import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { config } from '../config';
import { users } from '../db/schema';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      'Usage: SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... pnpm seed:admin',
    );
    process.exit(0);
  }

  const pool = new Pool({ connectionString: config.databaseUrl });
  const db = drizzle(pool);
  const passwordHash = await bcrypt.hash(password, 10);

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    await db.update(users).set({ passwordHash }).where(eq(users.id, existing.id));
    console.log(`Updated password for ${email}`);
  } else {
    await db.insert(users).values({ email, passwordHash });
    console.log(`Created admin ${email}`);
  }
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
