'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const BRAND = '#335293'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const reset = searchParams.get('reset')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', padding: '32px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px' }}>Welcome back</h1>

      {registered && (
        <div style={{ background: 'var(--bg-success)', border: '1px solid var(--border-success)', color: 'var(--text-success)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px' }}>
          Account created! Please log in.
        </div>
      )}

      {reset && (
        <div style={{ background: 'var(--bg-success)', border: '1px solid var(--border-success)', color: 'var(--text-success)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px' }}>
          Password reset successfully. Please log in with your new password.
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--bg-error)', border: '1px solid var(--border-error)', color: 'var(--text-error)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px' }}>
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            autoFocus
            value={form.email}
            onChange={handleChange}
            placeholder="jane@university.edu"
            className="auth-input"
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>Password</label>
            <Link
              href="/forgot-password"
              style={{ fontSize: '13px', color: BRAND, fontWeight: 500 }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="Your password"
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
            marginTop: '4px',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '24px' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: BRAND, fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </div>
  )
}
