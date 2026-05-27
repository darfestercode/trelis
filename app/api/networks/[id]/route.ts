import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'
import { getServerPermissions } from '@/lib/server-permissions'

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
  if (isNaN(networkId)) return Response.json({ error: 'Invalid network id' }, { status: 400 })

  try {
    const networkResult = await pool.query(
      `SELECT n.id, n.name, n.description, n.created_at,
        u.name AS creator_name,
        COUNT(nm.user_id) AS member_count,
        bool_or(nm.user_id = $2) AS is_member,
        n.creator_id
       FROM networks n
       JOIN users u ON n.creator_id = u.id
       LEFT JOIN network_members nm ON n.id = nm.network_id
       WHERE n.id = $1
       GROUP BY n.id, u.name`,
      [networkId, userId]
    )

    if (networkResult.rows.length === 0) {
      return Response.json({ error: 'Network not found' }, { status: 404 })
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, nm.role, nm.joined_at,
        '[]'::json AS assigned_roles
       FROM network_members nm
       JOIN users u ON nm.user_id = u.id
       WHERE nm.network_id = $1
       ORDER BY nm.joined_at ASC`,
      [networkId]
    )

    const userPermissions = await getServerPermissions(userId, networkId)

    return Response.json({
      network: networkResult.rows[0],
      members: membersResult.rows,
      userPermissions,
    })
  } catch (err) {
    console.error('Network detail error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const networkId = parseInt(id)
  if (isNaN(networkId)) return Response.json({ error: 'Invalid network id' }, { status: 400 })

  try {
    const existing = await pool.query(
      'SELECT role FROM network_members WHERE network_id = $1 AND user_id = $2',
      [networkId, userId]
    )

    if (existing.rows.length > 0) {
      if (existing.rows[0].role === 'creator') {
        return Response.json({ error: 'Network creator cannot leave' }, { status: 400 })
      }
      await pool.query(
        'DELETE FROM network_members WHERE network_id = $1 AND user_id = $2',
        [networkId, userId]
      )
      return Response.json({ action: 'left' })
    } else {
      await pool.query(
        'INSERT INTO network_members (network_id, user_id, role) VALUES ($1, $2, $3)',
        [networkId, userId, 'member']
      )
      return Response.json({ action: 'joined' })
    }
  } catch (err) {
    console.error('Network join/leave error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
