import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT, verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 })
  const payload = verifyJWT(token)
  if (!payload) return Response.json({ error: 'Invalid token' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string }

  if (!currentPassword || !newPassword) {
    return Response.json({ error: 'Both current and new password are required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [payload.userId])
    if (!result.rows.length) return Response.json({ error: 'User not found' }, { status: 404 })

    const valid = await verifyPassword(currentPassword, result.rows[0].password_hash)
    if (!valid) return Response.json({ error: 'Current password is incorrect' }, { status: 400 })

    const newHash = await hashPassword(newPassword)
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, payload.userId])

    return Response.json({ success: true })
  } catch (err) {
    console.error('Change password error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
