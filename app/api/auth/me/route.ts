import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const payload = verifyJWT(token)
  if (!payload) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.university, u.major, u.year, u.country, u.bio, u.profile_photo_url, u.created_at,
        COALESCE(
          json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
       FROM users u
       LEFT JOIN user_tags ut ON u.id = ut.user_id
       LEFT JOIN tags t ON ut.tag_id = t.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [payload.userId]
    )

    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Me error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
