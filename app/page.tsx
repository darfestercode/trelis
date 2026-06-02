import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJWT } from '@/lib/auth'

const BRAND = '#335293'
const BRAND_LIGHT = '#4A6BAE'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (token && verifyJWT(token)) redirect('/dashboard')

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'var(--font-inter, -apple-system, sans-serif)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>T</span>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: BRAND, letterSpacing: '-0.3px' }}>Trelis</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/login" style={{ color: '#6B7280', fontWeight: 500, fontSize: '15px', textDecoration: 'none' }}>
              Log in
            </Link>
            <Link href="/signup" style={{ background: BRAND, color: '#fff', padding: '8px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', textDecoration: 'none' }}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 72px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `rgba(51,82,147,0.08)`, border: `1px solid rgba(51,82,147,0.2)`, color: BRAND, fontSize: '13px', fontWeight: 600, padding: '6px 16px', borderRadius: '100px', marginBottom: '32px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: BRAND, display: 'inline-block' }} />
          Global Student Network
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 800, color: '#111827', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '20px' }}>
          Connect with{' '}
          <span style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Global Mentors
          </span>
          <br />& Peers
        </h1>
        <p style={{ fontSize: '18px', color: '#6B7280', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          Find guidance from students and professionals worldwide. Trelis is the global student
          networking platform for extracurricular opportunities, research collaborations, and mentorship.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ background: BRAND, color: '#fff', padding: '14px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 20px rgba(51,82,147,0.3)` }}>
            Get Started — It&apos;s Free
          </Link>
          <Link href="/login" style={{ background: '#fff', color: '#374151', padding: '14px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, textDecoration: 'none', border: '1px solid #E5E7EB' }}>
            Log In
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            {
              icon: (
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.8}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              ),
              title: 'Global Network',
              desc: 'Connect with students and professionals from universities worldwide across every field and discipline.',
            },
            {
              icon: (
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              ),
              title: 'Find Mentors',
              desc: 'Get guidance from experienced students who have navigated paths similar to yours.',
            },
            {
              icon: (
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
              ),
              title: 'Research & Opportunities',
              desc: 'Discover research collaborations, internships, and extracurricular activities that match your goals.',
            },
          ].map((feature) => (
            <div key={feature.title} style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #E5E7EB' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `rgba(51,82,147,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND, marginBottom: '20px' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.65 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ borderRadius: '20px', background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)`, padding: '60px 48px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>
            Ready to find your community?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '440px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Join thousands of students already connecting, learning, and growing together on Trelis.
          </p>
          <Link href="/signup" style={{ display: 'inline-block', background: '#fff', color: BRAND, padding: '14px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, textDecoration: 'none' }}>
            Create Your Profile
          </Link>
        </div>
      </section>
    </main>
  )
}
