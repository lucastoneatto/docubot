import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { config } from '../config';

async function main() {
  const pool = new Pool({ connectionString: config.databaseUrl });
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: 'drizzle' });
  await pool.end();
  console.log('Migrations applied.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
