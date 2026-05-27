import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

config({ path: join(process.cwd(), '.env.local') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  const sql = readFileSync(join(process.cwd(), 'db/migrate.sql'), 'utf8')
  console.log('Running migration...')
  try {
    await pool.query(sql)
    console.log('✅ Migration complete')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
