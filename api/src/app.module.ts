import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { CollectionsModule } from './collections/collections.module';
import { DbModule } from './db/db.module';
import { HealthController } from './health.controller';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { FilesModule } from './files/files.module';
import { IngestModule } from './ingest/ingest.module';
import { BullBoardModule } from './queue/bull-board.module';
import { QueueModule } from './queue/queue.module';
import { StartupService } from './startup.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DbModule,
    QueueModule,
    EmbeddingsModule,
    IngestModule,
    FilesModule,
    CollectionsModule,
    ChatModule,
    AuthModule,
    AdminModule,
    BullBoardModule,
  ],
  controllers: [HealthController],
  providers: [
    StartupService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
