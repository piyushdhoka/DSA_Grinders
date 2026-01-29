import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForPool = globalThis as unknown as { pool: Pool | undefined };

const pool = globalForPool.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
});

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

export const db = drizzle(pool, { schema });
