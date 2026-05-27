export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: pool } = await import('./lib/db')
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    try {
      const sql = readFileSync(join(process.cwd(), 'db/migrate.sql'), 'utf8')
      await pool.query(sql)
      console.log('✅ DB migration applied')
    } catch (err) {
      console.error('⚠️ DB migration error:', err)
    }
  }
}
