import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../db/db.module';
import { collections, users } from '../db/schema';

/** First day of the current month, at midnight. */
function startOfMonth(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Spend and volume for the current month, to watch the margin at a glance. */
  async overview() {
    const since = startOfMonth();

    const result = await this.db.execute(sql`
      select
        (select count(*)::int from ${users}) as users,
        (select count(*)::int from ${collections}) as collections,
        (select count(*)::int from ${collections} where status = 'error') as collections_error,
        (select count(*)::int from ${collections} where status = 'processing') as collections_processing,
        (select coalesce(sum(cost), 0)::float8
           from usage_events where created_at >= ${since}) as cost,
        (select count(*)::int
           from messages m
           join chat_sessions s on s.id = m.session_id
          where m.role = 'assistant' and m.created_at >= ${since}) as messages
    `);

    const row = (result.rows[0] ?? {}) as Record<string, number>;
    return {
      users: row.users ?? 0,
      collections: row.collections ?? 0,
      collectionsError: row.collections_error ?? 0,
      collectionsProcessing: row.collections_processing ?? 0,
      monthlyCost: row.cost ?? 0,
      monthlyMessages: row.messages ?? 0,
    };
  }

  async listUsers() {
    const result = await this.db.execute(sql`
      select
        u.id, u.email, u.plan, u.created_at as "createdAt",
        (select count(*)::int from ${collections} c where c.user_id = u.id) as "collectionCount",
        coalesce((
          select sum(e.cost)::float8
            from usage_events e
            join ${collections} c on c.id = e.collection_id
           where c.user_id = u.id and e.created_at >= ${startOfMonth()}
        ), 0) as "monthlyCost"
      from ${users} u
      order by u.created_at desc
    `);
    return result.rows;
  }

  async setPlan(userId: string, plan: 'free' | 'paid') {
    const [updated] = await this.db
      .update(users)
      .set({ plan })
      .where(eq(users.id, userId))
      .returning({ id: users.id, email: users.email, plan: users.plan });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  /** All collections on the platform with their usage and their quotas. */
  async listCollections() {
    const result = await this.db.execute(sql`
      select
        c.id, c.name, c.status, c.user_id as "userId",
        u.email as "ownerEmail", u.plan as "ownerPlan",
        c.monthly_message_limit as "monthlyMessageLimit",
        c.monthly_budget_usd as "monthlyBudgetUsd",
        c.last_ingested_at as "lastIngestedAt",
        coalesce((
          select sum(e.cost)::float8 from usage_events e
           where e.collection_id = c.id and e.created_at >= ${startOfMonth()}
        ), 0) as "monthlyCost",
        coalesce((
          select count(*)::int
            from messages m
            join chat_sessions cs on cs.id = m.session_id
           where cs.collection_id = c.id and m.role = 'assistant'
             and m.created_at >= ${startOfMonth()}
        ), 0) as "monthlyMessages"
      from ${collections} c
      join ${users} u on u.id = c.user_id
      order by "monthlyCost" desc, c.created_at desc
    `);
    return result.rows;
  }

  async setQuota(
    collectionId: string,
    quota: { monthlyMessageLimit?: number | null; monthlyBudgetUsd?: number | null },
  ) {
    const patch: Record<string, number | null> = {};
    if (quota.monthlyMessageLimit !== undefined) {
      patch.monthlyMessageLimit = quota.monthlyMessageLimit;
    }
    if (quota.monthlyBudgetUsd !== undefined) {
      patch.monthlyBudgetUsd = quota.monthlyBudgetUsd;
    }

    const [updated] = await this.db
      .update(collections)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(collections.id, collectionId))
      .returning({
        id: collections.id,
        monthlyMessageLimit: collections.monthlyMessageLimit,
        monthlyBudgetUsd: collections.monthlyBudgetUsd,
      });
    if (!updated) throw new NotFoundException('Collection not found');
    return updated;
  }
}
