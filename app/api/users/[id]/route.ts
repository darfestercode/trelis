import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.university, u.major, u.year, u.country, u.bio, u.profile_photo_url, u.created_at,
        COALESCE(
          json_agg(DISTINCT json_build_object('id', t.id, 'name', t.name, 'category', t.category))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags,
        (SELECT COUNT(*) FROM connections c
         WHERE (c.requester_id = u.id OR c.recipient_id = u.id) AND c.status = 'accepted') AS connections_count,
        (SELECT COUNT(*) FROM network_members nm WHERE nm.user_id = u.id) AS networks_count
       FROM users u
       LEFT JOIN user_tags ut ON u.id = ut.user_id
       LEFT JOIN tags t ON ut.tag_id = t.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    )

    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const milestonesResult = await pool.query(
      `SELECT id, title, is_completed, created_at FROM milestones
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [id]
    )

    const user = { ...result.rows[0], recent_milestones: milestonesResult.rows }
    return Response.json({ user })
  } catch (err) {
    console.error('Get user error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const payload = verifyJWT(token)
  if (!payload || payload.userId !== parseInt(id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, bio, university, major, year, country, profile_photo_url, tagIds } = body as {
    name?: string
    bio?: string
    university?: string
    major?: string
    year?: number
    country?: string
    profile_photo_url?: string
    tagIds?: number[]
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const updateResult = await client.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        bio = COALESCE($2, bio),
        university = COALESCE($3, university),
        major = COALESCE($4, major),
        year = COALESCE($5, year),
        country = COALESCE($6, country),
        profile_photo_url = COALESCE($7, profile_photo_url)
       WHERE id = $8
       RETURNING id, email, name, university, major, year, country, bio, profile_photo_url, created_at`,
      [name ?? null, bio ?? null, university ?? null, major ?? null, year ?? null, country ?? null, profile_photo_url ?? null, id]
    )

    if (tagIds !== undefined) {
      await client.query('DELETE FROM user_tags WHERE user_id = $1', [id])
      if (tagIds.length > 0) {
        const tagValues = tagIds.map((tagId, i) => `($1, $${i + 2})`).join(', ')
        await client.query(
          `INSERT INTO user_tags (user_id, tag_id) VALUES ${tagValues}`,
          [id, ...tagIds]
        )
      }
    }

    await client.query('COMMIT')

    const tagsResult = await pool.query(
      `SELECT t.id, t.name, t.category FROM tags t
       JOIN user_tags ut ON t.id = ut.tag_id
       WHERE ut.user_id = $1`,
      [id]
    )

    const user = { ...updateResult.rows[0], tags: tagsResult.rows }
    return Response.json({ user })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Update user error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
