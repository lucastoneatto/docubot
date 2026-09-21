import {
  BadRequestException,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { Worker, type Job, type Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { DRIZZLE, Database } from '../db/db.module';
import { collections, documents, ingestJobs } from '../db/schema';
import { config } from '../config';
import { IngestService } from '../ingest/ingest.service';
import { SummaryService } from '../summary/summary.service';
import { extractText, hashContent, isSupportedFile } from './extract';
import { INGEST_QUEUE, INGEST_QUEUE_NAME, REDIS_CONNECTION } from '../queue/queue.module';

export type UploadedFile = {
  /** Relative path within the upload, e.g. "policies/handbook.pdf". For a
   *  loose single-file upload this is just the filename. */
  relativePath: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
};

interface FileJobData {
  ingestJobId: string;
  collectionId: string;
  relativePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  /** Buffer contents, base64-encoded: BullMQ persists job data as JSON in Redis. */
  bufferBase64: string;
}

const DEFAULT_MAX_FILE_SIZE_MB = 100;
const DEFAULT_MAX_FILES = 200;

@Injectable()
export class FilesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FilesService.name);
  private worker: Worker<FileJobData> | null = null;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(INGEST_QUEUE) private readonly ingestQueue: Queue<FileJobData>,
    @Inject(REDIS_CONNECTION) private readonly redis: IORedis,
    private readonly ingest: IngestService,
    private readonly summary: SummaryService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<FileJobData>(
      INGEST_QUEUE_NAME,
      (job: Job<FileJobData>) => this.processFile(job),
      {
        connection: this.redis,
        concurrency: config.ingest.fileConcurrency,
      },
    );
    this.worker.on('failed', (job, error) => {
      if (!job) return;
      this.logger.error(`File job ${job.id} (${job.data.originalName}) failed: ${error}`);
      const attempts = job.opts.attempts ?? 1;
      if (job.attemptsMade >= attempts) {
        void this.db
          .update(ingestJobs)
          .set({ filesFailed: sql`${ingestJobs.filesFailed} + 1` })
          .where(eq(ingestJobs.id, job.data.ingestJobId))
          .then(() => this.decrementAndMaybeFinalize(job.data.ingestJobId, job.data.collectionId))
          .catch((e) =>
            this.logger.error(`Finalize check failed for ${job.data.ingestJobId}: ${e}`),
          );
      }
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private pendingKey(ingestJobId: string) {
    return `ingest:${ingestJobId}:pending`;
  }

  /**
   * Enqueues one BullMQ job per uploaded file — mirroring how the previous
   * crawler gave each discovered page its own job. Unlike a crawl, the file
   * count here is already known up front (the browser sent everything in one
   * request), so there's no progressive discovery loop, just a fixed-size
   * batch tracked by a pending counter.
   */
  async ingestUpload(
    collectionId: string,
    files: UploadedFile[],
  ): Promise<{ jobId: string }> {
    const [collection] = await this.db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId));
    if (!collection) throw new NotFoundException('Collection not found');

    const maxFiles = collection.settings?.maxFiles ?? DEFAULT_MAX_FILES;
    const maxFileSizeBytes =
      (collection.settings?.maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB) *
      1024 *
      1024;

    if (files.length === 0) {
      throw new BadRequestException('No files were uploaded');
    }
    if (files.length > maxFiles) {
      throw new BadRequestException(
        `Too many files: ${files.length} exceeds the limit of ${maxFiles}`,
      );
    }
    for (const file of files) {
      if (file.size > maxFileSizeBytes) {
        throw new BadRequestException(
          `"${file.originalName}" exceeds the ${collection.settings?.maxFileSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB}MB limit`,
        );
      }
      if (!isSupportedFile(file.originalName)) {
        throw new BadRequestException(`Unsupported file type: "${file.originalName}"`);
      }
    }

    const [job] = await this.db
      .insert(ingestJobs)
      .values({
        collectionId,
        status: 'running',
        filesFound: files.length,
        startedAt: new Date(),
      })
      .returning();

    await this.db
      .update(collections)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(collections.id, collectionId));

    await this.redis.set(this.pendingKey(job.id), files.length);

    for (const file of files) {
      await this.ingestQueue.add(
        file.relativePath,
        {
          ingestJobId: job.id,
          collectionId,
          relativePath: file.relativePath,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          bufferBase64: file.buffer.toString('base64'),
        },
        { attempts: 2, backoff: { type: 'exponential', delay: 5_000 } },
      );
    }

    return { jobId: job.id };
  }

  private async processFile(job: Job<FileJobData>) {
    const { ingestJobId, collectionId, relativePath, originalName, mimeType, size, bufferBase64 } =
      job.data;
    const buffer = Buffer.from(bufferBase64, 'base64');

    try {
      const text = await extractText(originalName, buffer);
      const contentHash = hashContent(text);
      const changed = await this.upsertDocument({
        collectionId,
        relativePath,
        originalName,
        mimeType,
        size,
        text,
        contentHash,
      });

      await this.db
        .update(ingestJobs)
        .set({
          filesProcessed: sql`${ingestJobs.filesProcessed} + 1`,
          filesChanged: changed ? sql`${ingestJobs.filesChanged} + 1` : sql`${ingestJobs.filesChanged}`,
        })
        .where(eq(ingestJobs.id, ingestJobId));
    } catch (error) {
      this.logger.warn(`Failed to ingest "${relativePath}": ${(error as Error).message}`);
      throw error; // let BullMQ's retry/attempts machinery handle it
    }

    await this.decrementAndMaybeFinalize(ingestJobId, collectionId);
  }

  private async upsertDocument(params: {
    collectionId: string;
    relativePath: string;
    originalName: string;
    mimeType: string;
    size: number;
    text: string;
    contentHash: string;
  }): Promise<boolean> {
    const { collectionId, relativePath, originalName, mimeType, size, text, contentHash } = params;

    const [existing] = await this.db
      .select({ id: documents.id, contentHash: documents.contentHash })
      .from(documents)
      .where(
        and(eq(documents.collectionId, collectionId), eq(documents.path, relativePath)),
      );

    if (existing) {
      if (existing.contentHash === contentHash) {
        await this.db
          .update(documents)
          .set({ uploadedAt: new Date() })
          .where(eq(documents.id, existing.id));
        return false;
      }
      await this.db
        .update(documents)
        .set({
          extractedText: text,
          contentHash,
          fileSizeBytes: size,
          mimeType,
          status: 'done',
          uploadedAt: new Date(),
        })
        .where(eq(documents.id, existing.id));
      await this.ingest.ingestDocument({
        collectionId,
        documentId: existing.id,
        filename: originalName,
        text,
      });
      return true;
    }

    const [inserted] = await this.db
      .insert(documents)
      .values({
        collectionId,
        filename: originalName,
        path: relativePath,
        mimeType,
        fileSizeBytes: size,
        extractedText: text,
        contentHash,
        status: 'done',
      })
      .returning({ id: documents.id });

    await this.ingest.ingestDocument({
      collectionId,
      documentId: inserted.id,
      filename: originalName,
      text,
    });
    return true;
  }

  /** Decrements the pending files counter; if it reaches 0, finalizes the batch. */
  private async decrementAndMaybeFinalize(ingestJobId: string, collectionId: string) {
    const remaining = await this.redis.decr(this.pendingKey(ingestJobId));
    if (remaining <= 0) {
      await this.finalize(ingestJobId, collectionId);
      await this.redis.del(this.pendingKey(ingestJobId));
    }
  }

  private async finalize(ingestJobId: string, collectionId: string) {
    const [job] = await this.db
      .select()
      .from(ingestJobs)
      .where(eq(ingestJobs.id, ingestJobId));
    if (!job || job.status === 'done' || job.status === 'error') return;

    await this.db
      .update(ingestJobs)
      .set({ status: 'done', finishedAt: new Date() })
      .where(eq(ingestJobs.id, ingestJobId));
    await this.db
      .update(collections)
      .set({ status: 'ready', updatedAt: new Date(), lastIngestedAt: new Date() })
      .where(eq(collections.id, collectionId));

    if (job.filesChanged > 0) {
      try {
        await this.summary.generate(collectionId);
      } catch (error) {
        this.logger.warn(`Summary generation skipped: ${error}`);
      }
    }

    this.logger.log(
      `Batch ${ingestJobId} done: ${job.filesChanged} changed, ${job.filesFailed} failed, ${job.filesFound} total`,
    );
  }

  async removeDocument(collectionId: string, documentId: string) {
    const [existing] = await this.db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.collectionId, collectionId)));
    if (!existing) throw new NotFoundException('Document not found');

    await this.db.delete(documents).where(eq(documents.id, documentId));
    return { ok: true };
  }
}
