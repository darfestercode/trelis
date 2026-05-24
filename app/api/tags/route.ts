import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query('SELECT id, name, category FROM tags ORDER BY category, name')
    const grouped: Record<string, { id: number; name: string; category: string }[]> = {}
    for (const tag of result.rows) {
      if (!grouped[tag.category]) grouped[tag.category] = []
      grouped[tag.category].push(tag)
    }
    return Response.json({ tags: result.rows, grouped })
  } catch (err) {
    console.error('Get tags error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
