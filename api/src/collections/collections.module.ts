import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { SummaryModule } from '../summary/summary.module';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [FilesModule, SummaryModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
