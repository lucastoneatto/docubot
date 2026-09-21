import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../db/db.module';
import { chatSessions, messages, usageEvents, type UsageType } from '../db/schema';
import { config } from '../config';

@Injectable()
export class UsageService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async record(params: {
    collectionId: string;
    type: UsageType;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  }): Promise<void> {
    const promptTokens = params.promptTokens ?? 0;
    const completionTokens = params.completionTokens ?? 0;
    const totalTokens =
      params.totalTokens ?? promptTokens + completionTokens;

    let cost = 0;
    if (params.type === 'embedding') {
      cost =
        config.embeddingProvider === 'openai'
          ? (totalTokens / 1_000_000) * config.pricing.embeddingPerMTok
          : 0;
    } else {
      cost =
        (promptTokens / 1_000_000) * config.pricing.chatInputPerMTok +
        (completionTokens / 1_000_000) * config.pricing.chatOutputPerMTok;
    }

    await this.db.insert(usageEvents).values({
      collectionId: params.collectionId,
      type: params.type,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
    });
  }

  async monthlyUsage(collectionId: string): Promise<{
    messages: number;
    cost: number;
  }> {
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [msgResult, costResult] = await Promise.all([
      this.db.execute(sql`
        select count(*)::int as count
        from ${messages} m
        join ${chatSessions} s on s.id = m.session_id
        where s.collection_id = ${collectionId} and m.created_at >= ${since}
      `),
      this.db.execute(sql`
        select coalesce(sum(case when type = 'chat' then cost else 0 end), 0)::float8 as cost
        from ${usageEvents}
        where collection_id = ${collectionId} and type = 'chat' and created_at >= ${since}
      `),
    ]);

    return {
      messages:
        (msgResult.rows[0] as { count?: number } | undefined)?.count ?? 0,
      cost: (costResult.rows[0] as { cost?: number } | undefined)?.cost ?? 0,
    };
  }
}
