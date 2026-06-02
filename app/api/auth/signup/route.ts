import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import pool from '@/lib/db'
import { hashPassword, createJWT } from '@/lib/auth'

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, password, name, university, major, year, country, otp_code } = body as {
    email: string
    password: string
    name: string
    university?: string
    major?: string
    year?: number
    country?: string
    otp_code?: string
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

  if (!otp_code) {
    return Response.json({ error: 'Email verification code is required' }, { status: 400 })
  }

  try {
    // Verify OTP
    const otpHash = hashOtp(String(otp_code).trim())
    const otpRes = await pool.query(
      `SELECT id FROM email_otps
       WHERE email = $1 AND otp_hash = $2 AND expires_at > NOW() AND verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [email, otpHash]
    )

    if (otpRes.rows.length === 0) {
      return Response.json({ error: 'Invalid or expired verification code' }, { status: 400 })
    }

    const otpId = otpRes.rows[0].id

    // Mark OTP as used
    await pool.query('UPDATE email_otps SET verified = true WHERE id = $1', [otpId])

    // Create account
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
      maxAge: 30 * 24 * 60 * 60,
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
