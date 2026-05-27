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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const networkId = parseInt(id)

  try {
    const result = await pool.query(
      `SELECT id, name, color, position, is_everyone, permissions, created_at
       FROM network_roles WHERE network_id = $1 ORDER BY position ASC, id ASC`,
      [networkId]
    )
    return Response.json({ roles: result.rows })
  } catch {
    return Response.json({ roles: [] })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const networkId = parseInt(id)

  const perms = await getServerPermissions(userId, networkId)
  if (!has(perms, P.MANAGE_ROLES)) {
    return Response.json({ error: 'Missing MANAGE_ROLES permission' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, color, permissions: rolePerms } = body as { name: string; color?: string; permissions?: number }
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  // Get next position
  const pos = await pool.query('SELECT COALESCE(MAX(position),0)+1 AS next FROM network_roles WHERE network_id = $1', [networkId])

  const result = await pool.query(
    `INSERT INTO network_roles (network_id, name, color, permissions, position)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, color, position, is_everyone, permissions`,
    [networkId, name.trim(), color ?? '#99aab5', rolePerms ?? 0, pos.rows[0].next]
  )
  return Response.json({ role: result.rows[0] }, { status: 201 })
}
