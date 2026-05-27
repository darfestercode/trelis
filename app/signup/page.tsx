'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BRAND = '#335293'

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #D1D5DB',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  outline: 'none',
  background: '#fff',
  color: '#111827',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    university: '',
    major: '',
    year: '',
    country: '',
  })

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  function startCountdown(seconds: number) {
    setCountdown(seconds)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password || !form.name) {
      setError('Email, password, and name are required')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to send verification code')
        return
      }
      setOtp(['', '', '', '', '', ''])
      setStep('otp')
      startCountdown(60)
      // Focus first OTP box after render
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus()
      }
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newOtp = Array(6).fill('')
    pasted.split('').forEach((d, i) => { newOtp[i] = d })
    setOtp(newOtp)
    const nextFocus = Math.min(pasted.length, 5)
    setTimeout(() => otpRefs.current[nextFocus]?.focus(), 0)
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: form.year ? parseInt(form.year) : undefined,
          otp_code: code,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Signup failed')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0 || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to resend code')
        return
      }
      setOtp(['', '', '', '', '', ''])
      startCountdown(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        fontFamily: 'var(--font-inter, -apple-system, sans-serif)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #335293 0%, #4A6BAE 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>T</span>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: BRAND, letterSpacing: '-0.3px' }}>
              Trelis
            </span>
          </Link>
          <p style={{ color: '#6B7280', marginTop: '8px', fontSize: '15px' }}>
            {step === 'form' ? 'Create your account and start connecting' : 'Verify your email address'}
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '32px' }}>

          {/* ── STEP 1: Form ── */}
          {step === 'form' && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
                Create Account
              </h1>

              {error && (
                <div style={{ background: '#FFF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoFocus
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Password <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    style={inputStyle}
                  />
                </div>

                <div style={{ paddingTop: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: '12px' }}>
                    Optional — fill in now or later
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      name="university"
                      type="text"
                      value={form.university}
                      onChange={handleChange}
                      placeholder="University (e.g. MIT, Oxford)"
                      style={inputStyle}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input
                        name="major"
                        type="text"
                        value={form.major}
                        onChange={handleChange}
                        placeholder="Major"
                        style={inputStyle}
                      />
                      <select
                        name="year"
                        value={form.year}
                        onChange={handleChange}
                        style={{ ...inputStyle, color: form.year ? '#111827' : '#9CA3AF' }}
                      >
                        <option value="">Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">Graduate</option>
                        <option value="6">PhD</option>
                      </select>
                    </div>
                    <input
                      name="country"
                      type="text"
                      value={form.country}
                      onChange={handleChange}
                      placeholder="Country"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? '#6B8BC5' : BRAND,
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '15px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '4px',
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Sending code…' : 'Send Verification Code'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280', marginTop: '24px' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: BRAND, fontWeight: 600 }}>
                  Log in
                </Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {/* Email icon */}
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#335293" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                  Check your inbox
                </h1>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: '#374151' }}>{form.email}</strong>
                </p>
              </div>

              {error && (
                <div style={{ background: '#FFF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateAccount}>
                {/* OTP boxes */}
                <div
                  style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      style={{
                        width: '46px',
                        height: '54px',
                        textAlign: 'center',
                        fontSize: '22px',
                        fontWeight: 700,
                        border: `2px solid ${digit ? BRAND : '#D1D5DB'}`,
                        borderRadius: '10px',
                        outline: 'none',
                        color: '#111827',
                        background: digit ? '#EEF2FF' : '#fff',
                        transition: 'border-color 0.15s, background 0.15s',
                        fontFamily: 'monospace',
                        caretColor: BRAND,
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  style={{
                    width: '100%',
                    background: loading || otp.join('').length < 6 ? '#6B8BC5' : BRAND,
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '15px',
                    border: 'none',
                    cursor: loading || otp.join('').length < 6 ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Creating account…' : 'Verify & Create Account'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                  Didn&apos;t receive it?{' '}
                  <button
                    onClick={handleResend}
                    disabled={countdown > 0 || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: countdown > 0 || loading ? 'default' : 'pointer',
                      color: countdown > 0 || loading ? '#9CA3AF' : BRAND,
                      fontWeight: 600,
                      fontSize: '14px',
                      padding: 0,
                    }}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </p>
                <button
                  onClick={() => { setStep('form'); setError('') }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B7280',
                    fontSize: '13px',
                    marginTop: '8px',
                    padding: 0,
                  }}
                >
                  ← Change email address
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
