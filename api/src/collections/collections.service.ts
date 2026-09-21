import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, Database } from '../db/db.module';
import {
  chatSessions,
  chunks,
  collections,
  DEFAULT_SETTINGS,
  documents,
  ingestJobs,
  messages,
  usageEvents,
  type CollectionSettings,
} from '../db/schema';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';
import { SummaryService } from '../summary/summary.service';

const PAGE_SIZE = 50;

@Injectable()
export class CollectionsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly summary: SummaryService,
  ) {}

  async create(userId: string, dto: CreateCollectionDto) {
    const [collection] = await this.db
      .insert(collections)
      .values({
        userId,
        name: dto.name.trim(),
        allowedOrigins: [],
        settings: DEFAULT_SETTINGS,
      })
      .returning();

    return collection;
  }

  async list(userId: string) {
    return this.db
      .select({
        id: collections.id,
        name: collections.name,
        status: collections.status,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        // Columns are qualified with their table on purpose: interpolating
        // ${documents.collectionId} makes Drizzle emit only "collection_id",
        // and inside the subquery "id" would resolve to documents.id instead
        // of collections.id, comparing documents.collection_id = documents.id
        // and always returning 0.
        documentCount: sql<number>`(select count(*) from ${documents} where ${documents}."collection_id" = ${collections}."id")`.mapWith(
          Number,
        ),
        chunkCount: sql<number>`(select count(*) from ${chunks} where ${chunks}."collection_id" = ${collections}."id")`.mapWith(
          Number,
        ),
      })
      .from(collections)
      .where(eq(collections.userId, userId))
      .orderBy(desc(collections.createdAt));
  }

  async findOwned(id: string, userId: string) {
    const [collection] = await this.db
      .select()
      .from(collections)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async detail(id: string, userId: string) {
    const collection = await this.findOwned(id, userId);
    const [[job], countsResult, usageResult, feedbackResult] = await Promise.all([
      this.db
        .select()
        .from(ingestJobs)
        .where(eq(ingestJobs.collectionId, id))
        .orderBy(desc(ingestJobs.createdAt))
        .limit(1),
      this.db.execute(sql`
        select
          (select count(*) from ${documents} where ${documents.collectionId} = ${id})::int as document_count,
          (select count(*) from ${chunks} where ${chunks.collectionId} = ${id})::int as chunk_count,
          (select count(*) from ${messages} m
             join ${chatSessions} s on s.id = m.session_id
             where s.collection_id = ${id})::int as message_count
      `),
      this.db.execute(sql`
        select
          coalesce(sum(case when type = 'embedding' then cost else 0 end), 0)::float8 as indexing_cost,
          coalesce(sum(case when type = 'chat' then cost else 0 end), 0)::float8 as chat_cost,
          coalesce(sum(case when type = 'summary' then cost else 0 end), 0)::float8 as summary_cost,
          coalesce(sum(cost), 0)::float8 as total_cost,
          coalesce(sum(case when type = 'embedding' then 1 else 0 end), 0)::int as indexing_events,
          coalesce(sum(case when type = 'chat' then 1 else 0 end), 0)::int as chat_events,
          coalesce(sum(case when type = 'summary' then 1 else 0 end), 0)::int as summary_events,
          coalesce(sum(case when type = 'embedding' then total_tokens else 0 end), 0)::int as indexing_tokens,
          coalesce(sum(case when type = 'chat' then total_tokens else 0 end), 0)::int as chat_tokens
        from ${usageEvents} where ${usageEvents.collectionId} = ${id}
      `),
      this.db.execute(sql`
        select
          coalesce(sum(case when m.feedback = 'up' then 1 else 0 end), 0)::int as feedback_up,
          coalesce(sum(case when m.feedback = 'down' then 1 else 0 end), 0)::int as feedback_down,
          coalesce(sum(case when m.no_info then 1 else 0 end), 0)::int as no_info,
          (select count(*) from ${chatSessions} where ${chatSessions.collectionId} = ${id})::int as conversation_count
        from ${messages} m
        join ${chatSessions} s on s.id = m.session_id
        where s.collection_id = ${id}
      `),
    ]);

    const counts = (countsResult.rows[0] ?? {}) as {
      document_count?: number;
      chunk_count?: number;
      message_count?: number;
    };

    const usageRow = (usageResult.rows[0] ?? {}) as {
      indexing_cost?: number;
      chat_cost?: number;
      summary_cost?: number;
      total_cost?: number;
      indexing_events?: number;
      chat_events?: number;
      summary_events?: number;
      indexing_tokens?: number;
      chat_tokens?: number;
    };

    const feedbackRow = (feedbackResult.rows[0] ?? {}) as {
      feedback_up?: number;
      feedback_down?: number;
      no_info?: number;
      conversation_count?: number;
    };

    const indexingCost = usageRow.indexing_cost ?? 0;
    const chatCost = usageRow.chat_cost ?? 0;
    const summaryCost = usageRow.summary_cost ?? 0;
    const indexingEvents = usageRow.indexing_events ?? 0;
    const chatEvents = usageRow.chat_events ?? 0;

    return {
      collection,
      job: job ?? null,
      stats: {
        documentCount: counts.document_count ?? 0,
        chunkCount: counts.chunk_count ?? 0,
        messageCount: counts.message_count ?? 0,
      },
      analytics: {
        conversations: feedbackRow.conversation_count ?? 0,
        feedbackUp: feedbackRow.feedback_up ?? 0,
        feedbackDown: feedbackRow.feedback_down ?? 0,
        noInfo: feedbackRow.no_info ?? 0,
      },
      usage: {
        total: usageRow.total_cost ?? 0,
        indexing: {
          cost: indexingCost,
          files: indexingEvents,
          tokens: usageRow.indexing_tokens ?? 0,
        },
        chat: {
          cost: chatCost,
          messages: chatEvents,
          tokens: usageRow.chat_tokens ?? 0,
        },
        summary: {
          cost: summaryCost,
          generations: usageRow.summary_events ?? 0,
        },
        avgPerMessage: chatEvents > 0 ? chatCost / chatEvents : 0,
        avgPerFile: indexingEvents > 0 ? indexingCost / indexingEvents : 0,
      },
    };
  }

  async update(id: string, userId: string, dto: UpdateCollectionDto) {
    const current = await this.findOwned(id, userId);
    const incoming = dto.settings
      ? Object.fromEntries(
          Object.entries(dto.settings).filter(([, value]) => value !== undefined),
        )
      : {};
    const settings: CollectionSettings = {
      ...DEFAULT_SETTINGS,
      ...(current.settings ?? {}),
      ...incoming,
    };

    const [collection] = await this.db
      .update(collections)
      .set({
        name: dto.name?.trim() || current.name,
        allowedOrigins: dto.allowedOrigins ?? current.allowedOrigins,
        settings,
        // Quotas are not touched here: they belong to the operator, edited in /admin.
        updatedAt: new Date(),
      })
      .where(eq(collections.id, id))
      .returning();

    return collection;
  }

  async remove(id: string, userId: string) {
    await this.findOwned(id, userId);
    await this.db.delete(collections).where(eq(collections.id, id));
    return { ok: true };
  }

  async listDocuments(
    id: string,
    userId: string,
    offset = 0,
    limit = PAGE_SIZE,
  ) {
    await this.findOwned(id, userId);
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const [rows, [total]] = await Promise.all([
      this.db
        .select({
          id: documents.id,
          filename: documents.filename,
          path: documents.path,
          mimeType: documents.mimeType,
          fileSizeBytes: documents.fileSizeBytes,
          uploadedAt: documents.uploadedAt,
        })
        .from(documents)
        .where(eq(documents.collectionId, id))
        .orderBy(documents.path)
        .limit(safeLimit)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(documents)
        .where(eq(documents.collectionId, id)),
    ]);

    return { items: rows, total: total?.value ?? 0, offset, limit: safeLimit };
  }

  async getDocument(id: string, documentId: string, userId: string) {
    await this.findOwned(id, userId);
    const [document] = await this.db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.collectionId, id)));
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async status(id: string, userId: string) {
    const collection = await this.findOwned(id, userId);
    const [job] = await this.db
      .select()
      .from(ingestJobs)
      .where(eq(ingestJobs.collectionId, id))
      .orderBy(desc(ingestJobs.createdAt))
      .limit(1);
    return { status: collection.status, job: job ?? null };
  }

  async regenerateSummary(id: string, userId: string) {
    await this.findOwned(id, userId);
    const summary = await this.summary.generate(id);
    return { summary };
  }


  async listConversations(
    id: string,
    userId: string,
    offset = 0,
    limit = PAGE_SIZE,
  ) {
    await this.findOwned(id, userId);
    const safeLimit = Math.min(Math.max(limit, 1), 200);

    const [rows, [total]] = await Promise.all([
      this.db.execute(sql`
        select
          s.id,
          s.created_at,
          count(m.id)::int as message_count,
          max(m.created_at) as last_message_at,
          count(*) filter (where m.no_info)::int as no_info_count,
          count(*) filter (where m.feedback = 'up')::int as thumbs_up,
          count(*) filter (where m.feedback = 'down')::int as thumbs_down,
          (
            select m2.content from ${messages} m2
             where m2.session_id = s.id and m2.role = 'user'
             order by m2.created_at
             limit 1
          ) as preview
        from ${chatSessions} s
        left join ${messages} m on m.session_id = s.id
        where s.collection_id = ${id}
        group by s.id
        order by s.created_at desc
        limit ${safeLimit} offset ${offset}
      `),
      this.db
        .select({ value: count() })
        .from(chatSessions)
        .where(eq(chatSessions.collectionId, id)),
    ]);

    const items = (rows.rows as {
      id: string;
      created_at: Date;
      message_count: number;
      last_message_at: Date | null;
      no_info_count: number;
      thumbs_up: number;
      thumbs_down: number;
      preview: string | null;
    }[]).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      messageCount: row.message_count,
      lastMessageAt: row.last_message_at,
      noInfoCount: row.no_info_count,
      thumbsUp: row.thumbs_up,
      thumbsDown: row.thumbs_down,
      preview: row.preview,
    }));

    return { items, total: total?.value ?? 0, offset, limit: safeLimit };
  }

  async getConversation(id: string, sessionId: string, userId: string) {
    await this.findOwned(id, userId);
    const [session] = await this.db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.collectionId, id)));
    if (!session) throw new NotFoundException('Conversation not found');

    const rows = await this.db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        sources: messages.sources,
        feedback: messages.feedback,
        noInfo: messages.noInfo,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt);

    return { session, messages: rows };
  }
}
