import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { DRIZZLE, Database } from './db/db.module';
import { collections, ingestJobs } from './db/schema';

@Injectable()
export class StartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async onApplicationBootstrap() {
    // A batch upload's pending-file counter lives in Redis, which is wiped
    // or stale after a restart mid-batch — there's no way for an
    // interrupted ingest job to resume or self-report completion, so any
    // job still marked queued/running at boot was orphaned by a crash or
    // redeploy.
    const pending = await this.db
      .select({ id: ingestJobs.id, collectionId: ingestJobs.collectionId })
      .from(ingestJobs)
      .where(inArray(ingestJobs.status, ['queued', 'running']));

    if (pending.length === 0) return;

    const jobIds = pending.map((row) => row.id);
    const collectionIds = [...new Set(pending.map((row) => row.collectionId))];

    await this.db
      .update(ingestJobs)
      .set({
        status: 'error',
        error: 'Interrupted by restart',
        finishedAt: new Date(),
      })
      .where(inArray(ingestJobs.id, jobIds));

    await this.db
      .update(collections)
      .set({ status: 'error' })
      .where(inArray(collections.id, collectionIds));

    this.logger.warn(`Marked ${jobIds.length} orphaned ingest job(s) as error`);
  }
}
