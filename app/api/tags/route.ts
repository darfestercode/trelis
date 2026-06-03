import pool from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')
    if (q !== null) {
      const term = q.toLowerCase().trim()
      // Only return tags that are fully lowercase (name = lower(name))
      const result = await pool.query(
        `SELECT id, name FROM tags WHERE name = lower(name) AND name LIKE $1 ORDER BY name LIMIT 10`,
        [`%${term}%`]
      )
      return Response.json({ tags: result.rows })
    }
    const result = await pool.query(
      'SELECT id, name FROM tags WHERE name = lower(name) ORDER BY name'
    )
    return Response.json({ tags: result.rows })
  } catch (err) {
    console.error('Get tags error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json()
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Name required' }, { status: 400 })
    }
    const normalized = name.toLowerCase().trim()
    if (!normalized) return Response.json({ error: 'Name required' }, { status: 400 })
    const result = await pool.query(
      `INSERT INTO tags (name, category) VALUES ($1, 'general')
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [normalized]
    )
    return Response.json({ tag: result.rows[0] })
  } catch (err) {
    console.error('Create tag error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
