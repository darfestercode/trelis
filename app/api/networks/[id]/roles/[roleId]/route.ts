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

type Ctx = { params: Promise<{ id: string; roleId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, roleId } = await params
  const networkId = parseInt(id)
  const rId = parseInt(roleId)

  const perms = await getServerPermissions(userId, networkId)
  if (!has(perms, P.MANAGE_ROLES)) {
    return Response.json({ error: 'Missing MANAGE_ROLES permission' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (body.name !== undefined) { fields.push(`name = $${idx++}`); values.push(String(body.name).trim()) }
  if (body.color !== undefined) { fields.push(`color = $${idx++}`); values.push(String(body.color)) }
  if (body.permissions !== undefined) { fields.push(`permissions = $${idx++}`); values.push(Number(body.permissions)) }

  if (fields.length === 0) return Response.json({ error: 'Nothing to update' }, { status: 400 })

  values.push(rId, networkId)
  const result = await pool.query(
    `UPDATE network_roles SET ${fields.join(', ')} WHERE id = $${idx} AND network_id = $${idx + 1}
     RETURNING id, name, color, position, is_everyone, permissions`,
    values
  )
  if (result.rows.length === 0) return Response.json({ error: 'Role not found' }, { status: 404 })
  return Response.json({ role: result.rows[0] })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, roleId } = await params
  const networkId = parseInt(id)
  const rId = parseInt(roleId)

  const perms = await getServerPermissions(userId, networkId)
  if (!has(perms, P.MANAGE_ROLES)) {
    return Response.json({ error: 'Missing MANAGE_ROLES permission' }, { status: 403 })
  }

  const role = await pool.query('SELECT is_everyone FROM network_roles WHERE id = $1 AND network_id = $2', [rId, networkId])
  if (role.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 })
  if (role.rows[0].is_everyone) return Response.json({ error: 'Cannot delete the @everyone role' }, { status: 400 })

  await pool.query('DELETE FROM network_roles WHERE id = $1', [rId])
  return Response.json({ ok: true })
}
