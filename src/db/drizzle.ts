import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';


const globalForPool = globalThis as unknown as { pool: Pool | undefined };

const isProduction = process.env.NODE_ENV === 'production';

// Connection pool settings optimized for serverless + Supabase Transaction Mode
const pool = globalForPool.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false }
    : false,
  max: 1, // Minimize connections per serverless instance to avoid pooler exhaust
  min: 0,
  idleTimeoutMillis: 10000, // Faster closing of idle connections
  connectionTimeoutMillis: 10000,
  maxUses: 100, // Recycle connections frequently
  allowExitOnIdle: true,
});

// Reuse pool in ALL environments to avoid creating too many during hot reloads or serverless reuse
globalForPool.pool = pool;

export const db = drizzle(pool, { schema });

// Export pool for health checks or manual cleanup if needed
export { pool };
