import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

async function getAuthUserId(): Promise<number | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyJWT(token)?.userId ?? null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { title, description } = body as { title?: string; description?: string }
  if (!title?.trim()) return Response.json({ error: 'Title is required' }, { status: 400 })

  try {
    const result = await pool.query(
      `UPDATE milestones SET title = $1, description = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, title, description, is_completed, completed_at, created_at`,
      [title.trim(), description ?? null, id, userId]
    )
    if (result.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ milestone: result.rows[0] })
  } catch (err) {
    console.error('Update milestone error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params

  try {
    const result = await pool.query(
      'DELETE FROM milestones WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    if (result.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ success: true })
  } catch (err) {
    console.error('Delete milestone error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
