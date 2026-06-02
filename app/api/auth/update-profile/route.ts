import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 })
  const payload = verifyJWT(token)
  if (!payload) return Response.json({ error: 'Invalid token' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, email, university, major, year, country, bio } = body as {
    name?: string
    email?: string
    university?: string
    major?: string
    year?: number | null
    country?: string
    bio?: string
  }

  if (name !== undefined && !name?.trim()) {
    return Response.json({ error: 'Name cannot be empty' }, { status: 400 })
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return Response.json({ error: 'Invalid email format' }, { status: 400 })
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), payload.userId])
    if (existing.rows.length > 0) return Response.json({ error: 'Email already in use' }, { status: 409 })
  }

  try {
    const result = await pool.query(
      `UPDATE users SET
        name       = COALESCE($1, name),
        email      = COALESCE($2, email),
        university = COALESCE($3, university),
        major      = COALESCE($4, major),
        year       = COALESCE($5, year),
        country    = COALESCE($6, country),
        bio        = COALESCE($7, bio)
       WHERE id = $8
       RETURNING id, name, email, university, major, year, country, bio`,
      [
        name?.trim() ?? null,
        email?.toLowerCase().trim() ?? null,
        university?.trim() ?? null,
        major?.trim() ?? null,
        year ?? null,
        country?.trim() ?? null,
        bio?.trim() ?? null,
        payload.userId,
      ]
    )
    return Response.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Update profile error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
