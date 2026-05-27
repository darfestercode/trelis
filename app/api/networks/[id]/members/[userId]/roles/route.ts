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

type Ctx = { params: Promise<{ id: string; userId: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const callerId = await getAuthUserId()
  if (!callerId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, userId: targetId } = await params
  const networkId = parseInt(id)
  const targetUserId = parseInt(targetId)

  const result = await pool.query(
    `SELECT nr.id, nr.name, nr.color, nr.position
     FROM network_member_roles nmr
     JOIN network_roles nr ON nmr.role_id = nr.id
     WHERE nmr.network_id = $1 AND nmr.user_id = $2 AND nr.is_everyone = false
     ORDER BY nr.position ASC`,
    [networkId, targetUserId]
  )
  return Response.json({ roles: result.rows })
}

// PUT body: { roleIds: number[] } — replaces all assigned roles for this member
export async function PUT(req: NextRequest, { params }: Ctx) {
  const callerId = await getAuthUserId()
  if (!callerId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, userId: targetId } = await params
  const networkId = parseInt(id)
  const targetUserId = parseInt(targetId)

  const callerPerms = await getServerPermissions(callerId, networkId)
  if (!has(callerPerms, P.MANAGE_ROLES)) {
    return Response.json({ error: 'Missing MANAGE_ROLES permission' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { roleIds } = body as { roleIds: number[] }
  if (!Array.isArray(roleIds)) return Response.json({ error: 'roleIds must be an array' }, { status: 400 })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'DELETE FROM network_member_roles WHERE network_id = $1 AND user_id = $2',
      [networkId, targetUserId]
    )
    for (const roleId of roleIds) {
      await client.query(
        'INSERT INTO network_member_roles (network_id, user_id, role_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [networkId, targetUserId, roleId]
      )
    }
    await client.query('COMMIT')
    return Response.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
