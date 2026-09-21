import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module';
import { SummaryService } from './summary.service';

@Module({
  imports: [UsageModule],
  providers: [SummaryService],
  exports: [SummaryService],
})
export class SummaryModule {}
