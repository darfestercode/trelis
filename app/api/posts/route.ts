import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

let attachmentColumnsEnsured = false
async function ensureAttachmentColumns() {
  if (attachmentColumnsEnsured) return
  await pool.query(`
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachment_url TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20);
  `)
  attachmentColumnsEnsured = true
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const limit = parseInt(searchParams.get('limit') ?? '20')

  try {
    const result = await pool.query(
      `SELECT p.id, p.content, p.attachment_url, p.attachment_type, p.created_at,
        u.id AS user_id, u.name, u.university, u.major, u.year,
        COALESCE(
          json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN post_tags pt ON p.id = pt.post_id
       LEFT JOIN tags t ON pt.tag_id = t.id
       GROUP BY p.id, u.id
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    )
    return new Response(JSON.stringify({ posts: result.rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch {
    return Response.json({ posts: [] })
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 })
  const payload = verifyJWT(token)
  if (!payload) return Response.json({ error: 'Invalid token' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { content, tagIds, attachment_url, attachment_type } = body as {
    content: string; tagIds?: number[]
    attachment_url?: string; attachment_type?: string
  }
  if (!content?.trim()) return Response.json({ error: 'Content is required' }, { status: 400 })

  try {
    await ensureAttachmentColumns()
  } catch (err) {
    console.error('Failed to ensure attachment columns:', err)
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO posts (user_id, content, attachment_url, attachment_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, attachment_url, attachment_type, created_at`,
      [payload.userId, content.trim(), attachment_url ?? null, attachment_type ?? null]
    )
    const post = result.rows[0]
    if (tagIds && tagIds.length > 0) {
      const vals = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ')
      await client.query(`INSERT INTO post_tags (post_id, tag_id) VALUES ${vals}`, [post.id, ...tagIds])
    }
    await client.query('COMMIT')
    return Response.json({ post }, { status: 201 })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Post error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
