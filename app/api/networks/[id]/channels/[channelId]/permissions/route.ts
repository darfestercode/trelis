import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'
import { getServerPermissions } from '@/lib/server-permissions'
import { P, has } from '@/lib/permissions'

async function getAuthUserId(): Promise<number | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyJWT(token)?.userId ?? null
}

type Ctx = { params: Promise<{ id: string; channelId: string }> }

// GET — return all role overrides for this channel
export async function GET(_req: NextRequest, { params }: Ctx) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { channelId } = await params
  const chId = parseInt(channelId)

  const result = await pool.query(
    `SELECT cpo.role_id, cpo.allow, cpo.deny, nr.name AS role_name, nr.color, nr.is_everyone, nr.position
     FROM channel_permission_overrides cpo
     JOIN network_roles nr ON cpo.role_id = nr.id
     WHERE cpo.channel_id = $1
     ORDER BY nr.is_everyone DESC, nr.position ASC`,
    [chId]
  )
  return Response.json({ overrides: result.rows })
}

// PUT body: { roleId, allow, deny } — upsert override for one role
export async function PUT(req: NextRequest, { params }: Ctx) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, channelId } = await params
  const networkId = parseInt(id)
  const chId = parseInt(channelId)

  const perms = await getServerPermissions(userId, networkId)
  if (!has(perms, P.MANAGE_CHANNELS)) {
    return Response.json({ error: 'Missing MANAGE_CHANNELS permission' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { roleId, allow, deny } = body as { roleId: number; allow: number; deny: number }

  await pool.query(
    `INSERT INTO channel_permission_overrides (channel_id, role_id, allow, deny)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (channel_id, role_id)
     DO UPDATE SET allow = EXCLUDED.allow, deny = EXCLUDED.deny`,
    [chId, roleId, allow ?? 0, deny ?? 0]
  )
  return Response.json({ ok: true })
}

// DELETE body: { roleId } — remove override (back to inherit)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, channelId } = await params
  const networkId = parseInt(id)
  const chId = parseInt(channelId)

  const perms = await getServerPermissions(userId, networkId)
  if (!has(perms, P.MANAGE_CHANNELS)) {
    return Response.json({ error: 'Missing MANAGE_CHANNELS permission' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { roleId } = body as { roleId: number }
  await pool.query('DELETE FROM channel_permission_overrides WHERE channel_id = $1 AND role_id = $2', [chId, roleId])
  return Response.json({ ok: true })
}
