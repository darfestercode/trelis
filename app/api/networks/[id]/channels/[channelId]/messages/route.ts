import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'
import { getChannelPermissions } from '@/lib/server-permissions'
import { P, has } from '@/lib/permissions'

async function getAuthUserId(): Promise<number | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyJWT(token)?.userId ?? null
}

type RouteParams = { params: Promise<{ id: string; channelId: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, channelId } = await params
  const networkId = parseInt(id)
  const chId = parseInt(channelId)

  const perms = await getChannelPermissions(userId, networkId, chId)
  if (!has(perms, P.VIEW_CHANNEL)) {
    return Response.json({ error: 'No access to this channel' }, { status: 403 })
  }

  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT cm.id, cm.content, cm.created_at, u.id AS user_id, u.name AS user_name
         FROM channel_messages cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.channel_id = $1
         ORDER BY cm.created_at DESC
         LIMIT 100
       ) sub ORDER BY created_at ASC`,
      [chId]
    )
    return Response.json({ messages: result.rows })
  } catch {
    return Response.json({ messages: [] })
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, channelId } = await params
  const networkId = parseInt(id)
  const chId = parseInt(channelId)

  const perms = await getChannelPermissions(userId, networkId, chId)
  if (!has(perms, P.SEND_MESSAGES)) {
    return Response.json({ error: 'No permission to send messages here' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { content } = body as { content: string }
  if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 })

  const result = await pool.query(
    `INSERT INTO channel_messages (channel_id, user_id, content) VALUES ($1, $2, $3)
     RETURNING id, content, created_at`,
    [chId, userId, content.trim()]
  )
  return Response.json({ message: result.rows[0] }, { status: 201 })
}
