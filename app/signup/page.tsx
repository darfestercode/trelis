'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BRAND = '#335293'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    university: '',
    major: '',
    year: '',
    country: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: form.year ? parseInt(form.year) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Signup failed'); return }
      router.push('/dashboard')
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
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        fontFamily: 'var(--font-inter, -apple-system, sans-serif)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
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
            Create your account and start connecting
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
            Create Account
          </h1>

          {error && (
            <div
              style={{
                background: '#FFF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                className="auth-input"
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
                className="auth-input"
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
                className="auth-input"
              />
            </div>

            <div style={{ paddingTop: '6px' }}>
              <p
                style={{
                  fontSize: '11px',
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  fontWeight: 600,
                  marginBottom: '12px',
                }}
              >
                Optional — fill in now or later
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  name="university"
                  type="text"
                  value={form.university}
                  onChange={handleChange}
                  placeholder="University (e.g. MIT, Oxford)"
                  className="auth-input"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    name="major"
                    type="text"
                    value={form.major}
                    onChange={handleChange}
                    placeholder="Major"
                    className="auth-input"
                  />
                  <select
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    className="auth-select"
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
                  className="auth-input"
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
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280', marginTop: '24px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: BRAND, fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
