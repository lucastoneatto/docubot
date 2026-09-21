import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { UsageModule } from '../usage/usage.module';
import { IngestService } from './ingest.service';

@Module({
  imports: [EmbeddingsModule, UsageModule],
  providers: [IngestService],
  exports: [IngestService],
})
export class IngestModule {}
