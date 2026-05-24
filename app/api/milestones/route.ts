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

export async function GET() {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const result = await pool.query(
      'SELECT id, title, description, is_completed, completed_at, created_at FROM milestones WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return Response.json({ milestones: result.rows })
  } catch {
    return Response.json({ milestones: [] })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { title, description, is_completed, milestone_id } = body as {
    title?: string; description?: string; is_completed?: boolean; milestone_id?: number
  }

  // Toggle completion
  if (milestone_id !== undefined && is_completed !== undefined) {
    try {
      await pool.query(
        `UPDATE milestones SET is_completed = $1, completed_at = $2 WHERE id = $3 AND user_id = $4`,
        [is_completed, is_completed ? new Date() : null, milestone_id, userId]
      )
      return Response.json({ success: true })
    } catch { return Response.json({ error: 'Internal server error' }, { status: 500 }) }
  }

  if (!title?.trim()) return Response.json({ error: 'Title is required' }, { status: 400 })

  try {
    const result = await pool.query(
      'INSERT INTO milestones (user_id, title, description) VALUES ($1, $2, $3) RETURNING id, title, description, is_completed, created_at',
      [userId, title.trim(), description ?? null]
    )
    return Response.json({ milestone: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('Milestone error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
