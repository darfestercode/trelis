import { Pool } from 'pg'

// Reuse the pool across hot-reloads in dev and across invocations in Vercel Fluid Compute
const g = globalThis as typeof globalThis & { _pgPool?: Pool }

if (!g._pgPool) {
  g._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  })
}

const pool = g._pgPool
export default pool
