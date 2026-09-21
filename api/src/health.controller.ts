import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { sql } from 'drizzle-orm';
import { DRIZZLE, Database } from './db/db.module';

/**
 * Probe for the orchestrator and monitoring. Checks the DB because an API
 * that's alive with the database down responds 200 to everything and fails
 * on every real request.
 */
@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  @Get()
  @SkipThrottle()
  async check() {
    try {
      await this.db.execute(sql`select 1`);
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        message: (error as Error).message,
      });
    }
    return { status: 'ok', database: 'up' };
  }
}
