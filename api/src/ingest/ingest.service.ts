import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../db/db.module';
import { chunks } from '../db/schema';
import { config } from '../config';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { UsageService } from '../usage/usage.service';
import { chunkText, estimateTokens } from './chunker';

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly embeddings: EmbeddingsService,
    private readonly usage: UsageService,
  ) {}

  /**
   * Chunks and embeds one already-extracted document's plain text. Called
   * after a file's binary format (PDF, DOCX, XLSX, ...) has been converted
   * to text by the file-type-specific extractor in `files/extract.ts`.
   */
  async ingestDocument(params: {
    collectionId: string;
    documentId: string;
    filename: string;
    text: string;
  }): Promise<number> {
    const { collectionId, documentId, filename, text } = params;

    await this.db.delete(chunks).where(eq(chunks.documentId, documentId));

    const pieces = chunkText(
      text,
      config.ingest.chunkMaxChars,
      config.ingest.chunkOverlap,
    );
    if (pieces.length === 0) return 0;

    const payload = pieces.map((piece) => `# ${filename}\n\n${piece}`);
    const vectors = await this.embeddings.embedDocuments(payload);

    await this.db.insert(chunks).values(
      payload.map((content, index) => ({
        collectionId,
        documentId,
        content,
        tokenCount: estimateTokens(content),
        embedding: vectors[index],
        search: sql`to_tsvector('simple', ${content})`,
      })),
    );

    const totalTokens = payload.reduce(
      (sum, content) => sum + estimateTokens(content),
      0,
    );
    await this.usage.record({ collectionId, type: 'embedding', totalTokens });

    this.logger.log(`Indexed ${pieces.length} chunks from ${filename}`);
    return pieces.length;
  }
}
