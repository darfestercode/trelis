import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 })
  const payload = verifyJWT(token)
  if (!payload) return Response.json({ error: 'Invalid token' }, { status: 401 })

  try {
    const result = await pool.query(
      `SELECT
        other_user_id,
        other_user_name,
        latest_message,
        latest_time,
        SUM(CASE WHEN is_unread THEN 1 ELSE 0 END) AS unread_count
       FROM (
         SELECT
           CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END AS other_user_id,
           CASE WHEN m.sender_id = $1 THEN ru.name ELSE su.name END AS other_user_name,
           COALESCE(m.message_text, m.attachment_name, 'Attachment') AS latest_message,
           m.created_at AS latest_time,
           (m.recipient_id = $1 AND NOT m.is_read) AS is_unread,
           ROW_NUMBER() OVER (
             PARTITION BY LEAST(m.sender_id, m.recipient_id), GREATEST(m.sender_id, m.recipient_id)
             ORDER BY m.created_at DESC
           ) AS rn
         FROM messages m
         JOIN users su ON m.sender_id = su.id
         JOIN users ru ON m.recipient_id = ru.id
         WHERE m.sender_id = $1 OR m.recipient_id = $1
       ) sub
       WHERE rn = 1
       GROUP BY other_user_id, other_user_name, latest_message, latest_time
       ORDER BY latest_time DESC`,
      [payload.userId]
    )
    return Response.json({ conversations: result.rows })
  } catch (err) {
    console.error('Get conversations error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
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

  const { recipient_id, message_text, attachment_url, attachment_type, attachment_name } = body as {
    recipient_id: number
    message_text?: string
    attachment_url?: string
    attachment_type?: string
    attachment_name?: string
  }

  if (!recipient_id) return Response.json({ error: 'recipient_id required' }, { status: 400 })
  if (!message_text?.trim() && !attachment_url) return Response.json({ error: 'message or attachment required' }, { status: 400 })
  if (recipient_id === payload.userId) return Response.json({ error: 'Cannot message yourself' }, { status: 400 })

  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, message_text, attachment_url, attachment_type, attachment_name, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING id, sender_id, recipient_id, message_text, attachment_url, attachment_type, attachment_name, is_read, created_at`,
      [payload.userId, recipient_id, message_text?.trim() ?? null, attachment_url ?? null, attachment_type ?? null, attachment_name ?? null]
    )
    return Response.json({ message: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('Send message error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
