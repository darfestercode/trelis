import { NextRequest } from 'next/server'
import { createHash, randomInt } from 'crypto'
import pool from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  const { email } = body as { email: string }
  if (!email) return Response.json({ error: 'Email is required' }, { status: 400 })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return Response.json({ error: 'Invalid email format' }, { status: 400 })
  }

  try {
    // Check if email is already taken
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return Response.json({ error: 'An account with that email already exists' }, { status: 409 })
    }

    // Generate 6-digit OTP
    const code = String(randomInt(100000, 1000000))
    const hash = hashOtp(code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Remove old OTPs for this email
    await pool.query('DELETE FROM email_otps WHERE email = $1', [email])

    // Insert new OTP
    await pool.query(
      'INSERT INTO email_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)',
      [email, hash, expiresAt]
    )

    // Send email via Resend
    const { error: resendError } = await resend.emails.send({
      from: 'Trelis <noreply@trelis.pro>',
      to: email,
      subject: 'Your Trelis verification code',
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
            <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 12px;">Verify your email</h1>
            <p style="font-size:15px;color:#6B7280;line-height:1.6;margin:0 0 28px;">
              Enter the code below to verify your email address and finish setting up your Trelis account.
              This code expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:#F3F4F6;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;letter-spacing:0.3em;">
              <span style="font-size:40px;font-weight:700;color:#111827;font-variant-numeric:tabular-nums;">${code}</span>
            </div>
            <p style="font-size:13px;color:#9CA3AF;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:24px 0 0;">
            Trelis · Global Student Network
          </p>
        </div>
      `,
    })

    if (resendError) {
      console.error('Resend OTP error:', resendError)
      return Response.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Send OTP error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
