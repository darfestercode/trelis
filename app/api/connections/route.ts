import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

async function getAuthUserId(): Promise<number | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  const payload = verifyJWT(token)
  return payload?.userId ?? null
}

export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const result = await pool.query(
      `SELECT c.id, c.status, c.created_at,
        CASE WHEN c.requester_id = $1 THEN c.recipient_id ELSE c.requester_id END AS other_user_id,
        u.name AS other_user_name, u.university, u.major
       FROM connections c
       JOIN users u ON u.id = CASE WHEN c.requester_id = $1 THEN c.recipient_id ELSE c.requester_id END
       WHERE (c.requester_id = $1 OR c.recipient_id = $1) AND c.status = 'accepted'
       ORDER BY c.created_at DESC`,
      [userId]
    )
    return Response.json({ connections: result.rows })
  } catch {
    return Response.json({ connections: [] })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { recipient_id, action } = body as { recipient_id: number; action?: string }

  if (action === 'accept') {
    try {
      await pool.query(
        `UPDATE connections SET status = 'accepted' WHERE requester_id = $1 AND recipient_id = $2`,
        [recipient_id, userId]
      )
      return Response.json({ success: true })
    } catch { return Response.json({ error: 'Internal server error' }, { status: 500 }) }
  }

  try {
    const result = await pool.query(
      `INSERT INTO connections (requester_id, recipient_id, status)
       VALUES ($1, $2, 'accepted')
       ON CONFLICT (requester_id, recipient_id) DO UPDATE SET status = 'accepted'
       RETURNING id, status`,
      [userId, recipient_id]
    )
    return Response.json({ connection: result.rows[0] }, { status: 201 })
  } catch {
    return Response.json({ connections: [] })
  }
}
