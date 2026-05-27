import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import pool from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function ensureResetTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token      VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email } = body as { email: string }
  if (!email) return Response.json({ error: 'Email is required' }, { status: 400 })

  try {
    await ensureResetTable()

    const userRes = await pool.query('SELECT id, name FROM users WHERE email = $1', [email])

    // Always respond success — don't reveal whether the email exists
    if (userRes.rows.length === 0) {
      return Response.json({ success: true })
    }

    const { id: userId, name } = userRes.rows[0]
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
      [userId]
    )
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    )

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    const { data, error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Trelis <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your Trelis password',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#F9FAFB;">
          <div style="background:#fff;border-radius:16px;border:1px solid #E5E7EB;padding:40px;">
            <div style="margin-bottom:32px;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#335293,#4A6BAE);display:inline-flex;align-items:center;justify-content:center;">
                  <span style="color:#fff;font-weight:700;font-size:16px;">T</span>
                </div>
                <span style="font-size:20px;font-weight:700;color:#335293;">Trelis</span>
              </div>
            </div>
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 12px;">Reset your password</h1>
            <p style="font-size:15px;color:#6B7280;line-height:1.6;margin:0 0 32px;">
              Hi${name ? ` ${name.split(' ')[0]}` : ''}, we received a request to reset your Trelis password.
              Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}"
              style="display:inline-block;background:#335293;color:#fff;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">
              Reset Password
            </a>
            <p style="font-size:13px;color:#9CA3AF;margin:32px 0 0;line-height:1.6;">
              If you didn't request this, you can safely ignore this email — your password won't change.
            </p>
          </div>
          <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:24px 0 0;">
            Trelis · Global Student Network
          </p>
        </div>
      `,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return Response.json({ error: 'Failed to send email', detail: resendError.message }, { status: 500 })
    }
    console.log('Password reset email sent:', data?.id, '→', email)
    return Response.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
