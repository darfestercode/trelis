import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { hashPassword, createJWT } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, password, name, university, major, year, country } = body as {
    email: string
    password: string
    name: string
    university?: string
    major?: string
    year?: number
    country?: string
  }

  if (!email || !password || !name) {
    return Response.json({ error: 'Email, password, and name are required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return Response.json({ error: 'Invalid email format' }, { status: 400 })
  }

  if (password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  try {
    const passwordHash = await hashPassword(password)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, university, major, year, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, university, major, year, country, bio, profile_photo_url, created_at`,
      [email, passwordHash, name, university ?? null, major ?? null, year ?? null, country ?? null]
    )
    const user = result.rows[0]
    const token = createJWT(user.id)

    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return Response.json({ user }, { status: 201 })
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    if (pgErr.code === '23505') {
      return Response.json({ error: 'An account with that email already exists' }, { status: 409 })
    }
    console.error('Signup error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
