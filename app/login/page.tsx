'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const BRAND = '#335293'

function LoginForm() {
  const router = useRouter()
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
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '32px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Welcome back</h1>

      {registered && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px' }}>
          Account created! Please log in.
        </div>
      )}

      {reset && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px' }}>
          Password reset successfully. Please log in with your new password.
        </div>
      )}

      {error && (
        <div style={{ background: '#FFF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
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
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Password</label>
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

      <p style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280', marginTop: '24px' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: BRAND, fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
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
          <p style={{ color: '#6B7280', marginTop: '8px', fontSize: '15px' }}>
            Welcome back — log in to your account
          </p>
        </div>

        <Suspense
          fallback={
            <div
              style={{
                height: '260px',
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
              }}
            />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
