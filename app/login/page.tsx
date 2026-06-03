import { Suspense } from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJWT } from '@/lib/auth'
import LoginForm from './LoginForm'

const BRAND = '#335293'

export default async function LoginPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (token && verifyJWT(token)) redirect('/dashboard')

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
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '15px' }}>
            Welcome back — log in to your account
          </p>
        </div>

        <Suspense
          fallback={
            <div
              style={{
                height: '260px',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-light)',
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
