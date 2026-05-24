import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const payload = verifyJWT(token)
  if (!payload) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  const otherId = parseInt(conversationId)
  if (isNaN(otherId)) {
    return Response.json({ error: 'Invalid conversation ID' }, { status: 400 })
  }

  try {
    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.recipient_id, m.message_text, m.is_read, m.created_at,
        su.name AS sender_name, ru.name AS recipient_name
       FROM messages m
       JOIN users su ON m.sender_id = su.id
       JOIN users ru ON m.recipient_id = ru.id
       WHERE (m.sender_id = $1 AND m.recipient_id = $2)
          OR (m.sender_id = $2 AND m.recipient_id = $1)
       ORDER BY m.created_at ASC`,
      [payload.userId, otherId]
    )

    // Mark unread messages as read
    await pool.query(
      `UPDATE messages SET is_read = true
       WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false`,
      [payload.userId, otherId]
    )

    return Response.json({ messages: result.rows })
  } catch (err) {
    console.error('Get messages error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
