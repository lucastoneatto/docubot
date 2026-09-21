import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const path of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
]) {
  if (existsSync(path)) loadEnv({ path });
}

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgres://bot:bot@localhost:5432/bot',

  // Auth
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  // Chat (OpenAI-compatible provider). A single global model for everyone.
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  chatBaseUrl: process.env.CHAT_BASE_URL ?? 'https://api.openai.com/v1',
  chatModel: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
  // RELATIVE cutoff to the best result (not absolute). Measured on the real
  // index with multilingual-e5-small: scores live compressed between 0.83
  // and 0.93, and the top-10 occupies only ~0.009 of that range. An absolute
  // threshold discards nothing; the relative margin does, but it must be on
  // the order of the real range (~0.01), not the 0-1 scale. See keepRelevant().
  chatRelativeMargin: Number(process.env.CHAT_RELATIVE_MARGIN ?? 0.02),
  chatSessionLimit: Number(process.env.CHAT_SESSION_LIMIT ?? 20),
  chatIpLimit: Number(process.env.CHAT_IP_LIMIT ?? 60),

  // Embeddings
  embeddingProvider: process.env.EMBEDDING_PROVIDER ?? 'local',
  embeddingModel:
    process.env.EMBEDDING_MODEL ?? 'Xenova/multilingual-e5-small',
  embeddingModelType:
    process.env.EMBEDDING_OPENAI_MODEL ?? 'text-embedding-3-small',
  embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? 384),

  apiPort: Number(process.env.API_PORT ?? 3001),
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  corsRelaxed: (process.env.CORS_RELAXED ?? 'false') === 'true',
  dashboardOrigins: (process.env.DASHBOARD_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  ingest: {
    maxFiles: Number(process.env.INGEST_MAX_FILES ?? 200),
    maxFileSizeMb: Number(process.env.INGEST_MAX_FILE_SIZE_MB ?? 100),
    // Files processed in parallel GLOBALLY (all that the BullMQ Worker runs
    // at once, summed across all collections) — each uploaded file is its
    // own job, and this is the Worker's real concurrency.
    fileConcurrency: Number(process.env.INGEST_FILE_CONCURRENCY ?? 4),
    chunkMaxChars: Number(process.env.CHUNK_MAX_CHARS ?? 1500),
    chunkOverlap: Number(process.env.CHUNK_OVERLAP ?? 150),
  },
  pricing: {
    chatInputPerMTok: Number(process.env.PRICE_CHAT_INPUT_PER_M ?? 0.15),
    chatOutputPerMTok: Number(process.env.PRICE_CHAT_OUTPUT_PER_M ?? 0.6),
    embeddingPerMTok: Number(process.env.PRICE_EMBEDDING_PER_M ?? 0.02),
  },
  // With free embeddings, storage is one of the few costs that scale.
  // 0 = keep indefinitely.
  retention: {
    conversationDays: Number(process.env.CONVERSATION_RETENTION_DAYS ?? 180),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'no-reply@docubot.local',
  },
  admin: {
    user: process.env.ADMIN_USER ?? '',
    password: process.env.ADMIN_PASSWORD ?? '',
  },
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  bullBoard: {
    user: process.env.BULL_BOARD_USER ?? process.env.ADMIN_USER ?? '',
    password: process.env.BULL_BOARD_PASSWORD ?? process.env.ADMIN_PASSWORD ?? '',
  },
  baseUrl: process.env.API_URL ?? 'http://localhost:3001',
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
};

const INSECURE_JWT_SECRETS = new Set([
  '',
  'dev-secret-change-me',
  'change-me',
]);

if (
  process.env.NODE_ENV === 'production' &&
  INSECURE_JWT_SECRETS.has(process.env.JWT_SECRET ?? '')
) {
  throw new Error(
    'JWT_SECRET is required in production. Define a strong secret before starting.',
  );
}

if (
  process.env.NODE_ENV === 'production' &&
  (!config.admin.user || config.admin.password.length < 12)
) {
  throw new Error(
    'ADMIN_USER and ADMIN_PASSWORD (12+ characters) are required in production for /admin.',
  );
}

if (
  process.env.NODE_ENV === 'production' &&
  (!config.bullBoard.user || config.bullBoard.password.length < 12)
) {
  throw new Error(
    'BULL_BOARD_USER and BULL_BOARD_PASSWORD (12+ characters) are required in production for /admin/queues.',
  );
}
