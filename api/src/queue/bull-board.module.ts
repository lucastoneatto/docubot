import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { Queue } from 'bullmq';
import { config } from '../config';
import { checkBasicAuth } from '../common/basic-auth';
import { INGEST_QUEUE, QueueModule } from './queue.module';

@Module({ imports: [QueueModule] })
export class BullBoardModule implements NestModule {
  constructor(@Inject(INGEST_QUEUE) private readonly ingestQueue: Queue) {}

  configure(consumer: MiddlewareConsumer) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    createBullBoard({
      queues: [new BullMQAdapter(this.ingestQueue)],
      serverAdapter,
    });

    consumer
      .apply(bullBoardAuth, serverAdapter.getRouter())
      .forRoutes('/admin/queues');
  }
}

function bullBoardAuth(req: Request, res: Response, next: NextFunction) {
  const { user, password } = config.bullBoard;
  if (!user || !password) {
    res.status(401).send('Bull Board not configured');
    return;
  }

  if (!checkBasicAuth(req.headers.authorization, user, password)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="DocuBot Queues"');
    res.status(401).send('Invalid credentials');
    return;
  }

  next();
}
