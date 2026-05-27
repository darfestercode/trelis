import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, password } = body as { token: string; password: string }

  if (!token || !password) {
    return Response.json({ error: 'Token and password are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  try {
    const tokenRes = await pool.query(
      'SELECT id, user_id FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    )

    if (tokenRes.rows.length === 0) {
      return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const { id: tokenId, user_id: userId } = tokenRes.rows[0]
    const passwordHash = await hashPassword(password)

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId])
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [tokenId])

    return Response.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
