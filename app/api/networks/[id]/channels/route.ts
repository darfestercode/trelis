import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'
import { getChannelPermissions, getServerPermissions } from '@/lib/server-permissions'
import { P, has } from '@/lib/permissions'

async function getAuthUserId(): Promise<number | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyJWT(token)?.userId ?? null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const networkId = parseInt(id)
  if (isNaN(networkId)) return Response.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const result = await pool.query(
      'SELECT id, name, created_at FROM network_channels WHERE network_id = $1 ORDER BY created_at ASC',
      [networkId]
    )

    // Filter channels by VIEW_CHANNEL permission
    const visible = await Promise.all(
      result.rows.map(async (ch: { id: number; name: string; created_at: string }) => {
        const perms = await getChannelPermissions(userId, networkId, ch.id)
        return has(perms, P.VIEW_CHANNEL) ? ch : null
      })
    )

    return Response.json({ channels: visible.filter(Boolean) })
  } catch {
    return Response.json({ channels: [] })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const networkId = parseInt(id)
  if (isNaN(networkId)) return Response.json({ error: 'Invalid id' }, { status: 400 })

  const perms = await getServerPermissions(userId, networkId)
  if (!has(perms, P.MANAGE_CHANNELS)) {
    return Response.json({ error: 'Missing MANAGE_CHANNELS permission' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name } = body as { name: string }
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  if (!slug) return Response.json({ error: 'Invalid name' }, { status: 400 })

  try {
    const result = await pool.query(
      'INSERT INTO network_channels (network_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
      [networkId, slug]
    )
    return Response.json({ channel: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('Create channel error:', err)
    return Response.json({ error: 'Failed to create channel' }, { status: 500 })
  }
}
