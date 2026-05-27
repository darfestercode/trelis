import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'
import { DEFAULT_EVERYONE_PERMS, DEFAULT_MODERATOR_PERMS, DEFAULT_ADMIN_PERMS } from '@/lib/permissions'

async function getAuthUserId(): Promise<number | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyJWT(token)?.userId ?? null
}

export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const result = await pool.query(
      `SELECT n.id, n.name, n.description, n.created_at,
        u.name AS creator_name,
        COUNT(nm.user_id) AS member_count,
        bool_or(nm.user_id = $1) AS is_member
       FROM networks n
       JOIN users u ON n.creator_id = u.id
       LEFT JOIN network_members nm ON n.id = nm.network_id
       GROUP BY n.id, u.name
       ORDER BY n.created_at DESC`,
      [userId]
    )
    return Response.json({ networks: result.rows })
  } catch {
    return Response.json({ networks: [] })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, description } = body as { name: string; description?: string }
  if (!name?.trim()) return Response.json({ error: 'Name is required' }, { status: 400 })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'INSERT INTO networks (name, description, creator_id) VALUES ($1, $2, $3) RETURNING id, name, description, created_at',
      [name.trim(), description ?? null, userId]
    )
    const network = result.rows[0]
    await client.query(
      'INSERT INTO network_members (network_id, user_id, role) VALUES ($1, $2, $3)',
      [network.id, userId, 'creator']
    )
    await client.query(
      'INSERT INTO network_channels (network_id, name) VALUES ($1, $2), ($1, $3)',
      [network.id, 'general', 'resources']
    )
    // Seed default roles
    await client.query(
      `INSERT INTO network_roles (network_id, name, color, is_everyone, permissions, position)
       VALUES ($1, '@everyone', '#99aab5', true, $2, 0),
              ($1, 'Moderator', '#e67e22', false, $3, 1),
              ($1, 'Admin',     '#e74c3c', false, $4, 2)`,
      [network.id, DEFAULT_EVERYONE_PERMS, DEFAULT_MODERATOR_PERMS, DEFAULT_ADMIN_PERMS]
    )
    await client.query('COMMIT')
    return Response.json({ network }, { status: 201 })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Network error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}
