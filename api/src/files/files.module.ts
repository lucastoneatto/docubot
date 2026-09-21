import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { SummaryModule } from '../summary/summary.module';
import { FilesService } from './files.service';

@Module({
  imports: [IngestModule, SummaryModule],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
