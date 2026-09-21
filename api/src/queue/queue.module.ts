import { Global, Module } from '@nestjs/common';
import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from '../config';

export const REDIS_CONNECTION = Symbol('REDIS_CONNECTION');
export const INGEST_QUEUE = Symbol('INGEST_QUEUE');

export const INGEST_QUEUE_NAME = 'ingest';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CONNECTION,
      useFactory: () =>
        new IORedis(config.redisUrl, { maxRetriesPerRequest: null }),
    },
    {
      provide: INGEST_QUEUE,
      useFactory: (connection: IORedis) =>
        new Queue(INGEST_QUEUE_NAME, { connection }),
      inject: [REDIS_CONNECTION],
    },
  ],
  exports: [REDIS_CONNECTION, INGEST_QUEUE],
})
export class QueueModule {}
