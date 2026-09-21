import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const path of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
]) {
  if (existsSync(path)) loadEnv({ path });
}

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://bot:bot@localhost:5432/bot',
  },
});
