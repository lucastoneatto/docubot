import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../db/db.module';
import { collections, documents } from '../db/schema';
import { config } from '../config';
import { UsageService } from '../usage/usage.service';

const MAX_CORPUS_CHARS = 12000;

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);
  private readonly client = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.chatBaseUrl,
  });

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly usage: UsageService,
  ) {}

  async generate(collectionId: string): Promise<string> {
    const [collection] = await this.db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId));
    if (!collection) throw new NotFoundException('Collection not found');

    const documentRows = await this.db
      .select({ filename: documents.filename, text: documents.extractedText })
      .from(documents)
      .where(eq(documents.collectionId, collectionId));

    if (documentRows.length === 0) {
      throw new BadRequestException('No documents indexed yet');
    }

    const perDocument = Math.max(400, Math.floor(MAX_CORPUS_CHARS / documentRows.length));
    const corpus = documentRows
      .map((doc) => `## ${doc.filename}\n${doc.text.slice(0, perDocument)}`)
      .join('\n\n')
      .slice(0, MAX_CORPUS_CHARS);

    const response = await this.client.chat.completions.create({
      model: config.chatModel,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant that summarizes document collections. Write in English, in 2-3 sentences, ' +
            'clearly and concretely: what the documents cover and who they are useful for. ' +
            'Do not make up facts that do not appear in the content.',
        },
        {
          role: 'user',
          content: `Collection: ${collection.name}\n\nDocument contents:\n\n${corpus}\n\nGenerate the summary.`,
        },
      ],
    });

    const summary = response.choices[0]?.message?.content?.trim() ?? '';
    if (!summary) throw new BadRequestException('Could not generate the summary');

    const usage = response.usage;
    if (usage) {
      await this.usage.record({
        collectionId,
        type: 'summary',
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
      });
    }

    await this.db
      .update(collections)
      .set({ summary, updatedAt: new Date() })
      .where(eq(collections.id, collectionId));

    this.logger.log(`Summary generated for collection "${collection.name}"`);
    return summary;
  }
}
