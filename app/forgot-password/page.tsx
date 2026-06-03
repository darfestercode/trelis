'use client'

import { useState } from 'react'
import Link from 'next/link'

const BRAND = '#335293'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        fontFamily: 'var(--font-inter, -apple-system, sans-serif)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
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
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', padding: '32px' }}>
          {!submitted ? (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Forgot password?
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div
                  style={{
                    background: 'var(--bg-error)',
                    border: '1px solid var(--border-error)',
                    color: 'var(--text-error)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@university.edu"
                    className="auth-input"
                  />
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
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '24px' }}>
                <Link href="/login" style={{ color: BRAND, fontWeight: 600 }}>
                  Back to login
                </Link>
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(51,82,147,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <svg width="24" height="24" fill="none" stroke={BRAND} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Check your email
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                If an account with that email exists, a password reset link has been sent.
              </p>

              <Link href="/login" style={{ fontSize: '14px', color: BRAND, fontWeight: 600 }}>
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
