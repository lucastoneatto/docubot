import { sql, type SQL } from 'drizzle-orm';
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

const tsVector = customType<{ data: SQL }>({
  dataType: () => 'tsvector',
});

export const EMBEDDING_DIM = 384;

export const collectionStatusEnum = pgEnum('collection_status', [
  'pending',
  'processing',
  'ready',
  'error',
]);

export const ingestJobStatusEnum = pgEnum('ingest_job_status', [
  'queued',
  'running',
  'done',
  'error',
]);

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const usageTypeEnum = pgEnum('usage_type', [
  'embedding',
  'chat',
  'summary',
]);

export const userPlanEnum = pgEnum('user_plan', ['free', 'paid']);

export const feedbackEnum = pgEnum('feedback', ['up', 'down']);

export type CollectionSettings = {
  color: string;
  greeting: string;
  customPrompt: string;
  temperature: number;
  maxFiles: number;
  maxFileSizeMb: number;
};

export const DEFAULT_SETTINGS: CollectionSettings = {
  color: '#4f46e5',
  greeting: 'Hi! How can I help you?',
  customPrompt: '',
  temperature: 0.2,
  maxFiles: 200,
  maxFileSizeMb: 100,
};

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  plan: userPlanEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A "collection" is the DocuBot equivalent of Sitebot's "site": the unit an
 * owner creates, uploads files into, and embeds a chat widget for.
 */
export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    status: collectionStatusEnum('status').notNull().default('pending'),
    summary: text('summary'),
    allowedOrigins: text('allowed_origins')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    settings: jsonb('settings')
      .$type<CollectionSettings>()
      .notNull()
      .default(DEFAULT_SETTINGS),
    lastIngestedAt: timestamp('last_ingested_at', { withTimezone: true }),
    monthlyMessageLimit: integer('monthly_message_limit'),
    monthlyBudgetUsd: doublePrecision('monthly_budget_usd'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('collections_user_idx').on(t.userId)],
);

/**
 * One uploaded file. `path` preserves the relative path within an uploaded
 * folder (e.g. "policies/2024/handbook.pdf"); for a single loose file it's
 * just the filename.
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    path: text('path').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull().default(0),
    extractedText: text('extracted_text').notNull(),
    contentHash: text('content_hash').notNull(),
    status: ingestJobStatusEnum('status').notNull().default('queued'),
    error: text('error'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('documents_collection_path_idx').on(t.collectionId, t.path)],
);

export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    tokenCount: integer('token_count').notNull().default(0),
    embedding: vector('embedding', { dimensions: EMBEDDING_DIM }).notNull(),
    search: tsVector('search').notNull(),
  },
  (t) => [
    index('chunks_collection_idx').on(t.collectionId),
    index('chunks_embedding_idx').using(
      'hnsw',
      t.embedding.op('vector_cosine_ops'),
    ),
    index('chunks_search_idx').using('gin', t.search),
  ],
);

/** One batch upload: a single file or an entire folder submitted together. */
export const ingestJobs = pgTable('ingest_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  status: ingestJobStatusEnum('status').notNull().default('queued'),
  filesFound: integer('files_found').notNull().default(0),
  filesProcessed: integer('files_processed').notNull().default(0),
  filesChanged: integer('files_changed').notNull().default(0),
  filesFailed: integer('files_failed').notNull().default(0),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  sources: jsonb('sources').$type<ChatSource[]>().notNull().default([]),
  feedback: feedbackEnum('feedback'),
  noInfo: boolean('no_info').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('password_reset_user_idx').on(t.userId)],
);

export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    type: usageTypeEnum('type').notNull(),
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    totalTokens: integer('total_tokens').notNull().default(0),
    cost: doublePrecision('cost').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('usage_collection_idx').on(t.collectionId)],
);

export type ChatSource = {
  filename: string;
  path: string;
  score: number;
};

export type User = typeof users.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type IngestJob = typeof ingestJobs.$inferSelect;
export type UsageType = typeof usageEvents.$inferSelect['type'];
export type Feedback = typeof messages.$inferSelect['feedback'];
export type UserPlan = typeof users.$inferSelect['plan'];
