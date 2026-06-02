import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyPassword, createJWT } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, password } = body as { email: string; password: string }

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  try {
    const result = await pool.query(
      'SELECT id, email, name, university, major, year, country, bio, profile_photo_url, password_hash, created_at FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = result.rows[0]
    const valid = await verifyPassword(password, user.password_hash)

    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = createJWT(user.id)
    const { password_hash: _, ...safeUser } = user

    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return Response.json({ user: safeUser })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
