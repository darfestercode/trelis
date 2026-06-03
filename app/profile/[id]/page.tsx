'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Mail, Target, Activity, Eye, Settings } from 'lucide-react'
import AppShell from '@/app/components/AppShell'
import { User } from '@/types'

interface ProfileUser extends User {
  connections_count?: number
  networks_count?: number
  recent_milestones?: { id: number; title: string; is_completed: boolean; created_at: string }[]
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  if (d < 7) return `${d} days ago`
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? 's' : ''} ago`
  return `${Math.floor(d / 30)} month${Math.floor(d / 30) > 1 ? 's' : ''} ago`
}

const BRAND = '#335293'
const BRAND_LIGHT = '#4A6BAE'
const TEXT_MAIN = 'var(--text-main)'
const TEXT_MUTED = 'var(--text-muted)'
const BORDER = 'var(--border-light)'
const BG_CARD = 'var(--bg-card)'
const BG_HOVER = 'var(--bg-hover)'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${profileId}`).then(r => r.ok ? r.json() : null),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/connections').then(r => r.json()),
    ]).then(([profileData, meData, connData]) => {
      if (!profileData) { setNotFound(true) }
      else { setProfile(profileData.user) }
      if (meData) setCurrentUser(meData.user)
      if (connData.connections) {
        const ids = new Set((connData.connections as { other_user_id: number }[]).map(c => c.other_user_id))
        setConnected(ids.has(parseInt(profileId)))
      }
      setLoading(false)
    })
  }, [profileId])

  async function handleConnect() {
    await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: parseInt(profileId) }),
    })
    setConnected(true)
  }

  const isOwnProfile = currentUser?.id === parseInt(profileId)

  if (loading) {
    return (
      <AppShell>
        <div style={{ margin: '0 auto', maxWidth: '1100px', padding: 'clamp(1rem, 3vw, 2rem) clamp(0.75rem, 4vw, 2.5rem)' }}>
          <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', height: '300px', animation: 'pulse 2s infinite' }} />
        </div>
      </AppShell>
    )
  }

  if (notFound || !profile) {
    return (
      <AppShell>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: TEXT_MAIN }}>User not found</p>
          <Link href="/dashboard" style={{ color: BRAND, marginTop: '1rem', display: 'inline-block', fontSize: '0.9rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </AppShell>
    )
  }

  const profileTags = profile.tags ?? []
  const milestones = profile.recent_milestones ?? []

  return (
    <AppShell>
      <div style={{ margin: '0 auto', width: '100%', maxWidth: '1100px', padding: 'clamp(1rem, 3vw, 2rem) clamp(0.75rem, 4vw, 2.5rem)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ── Hero Banner ── */}
        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '100%', height: '140px', background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)` }} />

          {isOwnProfile && (
            <Link
              href="/my-profile"
              style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', border: 'none', padding: '0.45rem 0.9rem', borderRadius: '100px', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'none' }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
          )}

          <div style={{ padding: '0 clamp(1.25rem, 4vw, 2.5rem) clamp(1.5rem, 4vw, 2.5rem)', position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: BG_CARD, border: `4px solid ${BG_CARD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: BRAND, marginTop: '-60px', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: TEXT_MAIN, marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>
                  {profile.name}
                </h1>
                {profile.email && (
                  <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: TEXT_MUTED, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, marginTop: '0.5rem' }}>
                    <Mail size={16} color={BRAND} /> {profile.email}
                  </a>
                )}
              </div>

              {!isOwnProfile && currentUser && (
                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                  <button
                    onClick={handleConnect}
                    disabled={connected}
                    style={{ background: 'transparent', border: `1px solid ${connected ? BORDER : BRAND}`, padding: '0.5rem 1.25rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, color: connected ? TEXT_MUTED : BRAND, cursor: connected ? 'default' : 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { if (!connected) e.currentTarget.style.background = `rgba(51,82,147,0.05)` }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {connected ? 'Connected' : 'Connect'}
                  </button>
                  <button
                    onClick={() => router.push(`/messages?with=${profile.id}`)}
                    style={{ background: BRAND, border: 'none', padding: '0.5rem 1.25rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, color: 'white', cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>

          {/* Left column */}
          <div style={{ flex: '1 1 min(100%, 360px)', display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>

            {/* About Me */}
            {profile.bio && (
              <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: TEXT_MAIN }}>About Me</h3>
                <p style={{ color: TEXT_MAIN, fontSize: '1rem', lineHeight: 1.6 }}>{profile.bio}</p>
              </div>
            )}

            {/* My Tags */}
            {profileTags.length > 0 && (
              <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: TEXT_MAIN }}>Tags</h3>
                  {isOwnProfile && (
                    <Link
                      href="/my-profile"
                      style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: TEXT_MAIN, padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}
                    >
                      <Settings size={14} /> Manage Tags
                    </Link>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {profileTags.map(t => (
                    <span key={t.id} style={{ background: 'rgba(51, 82, 147, 0.08)', color: BRAND, border: '1px solid rgba(51, 82, 147, 0.2)', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600 }}>
                      #{t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity Planner */}
            {milestones.length > 0 && (
              <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: TEXT_MAIN }}>Recent Activity Planner</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {milestones.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                      {i !== milestones.length - 1 && (
                        <div style={{ position: 'absolute', top: '30px', left: '19px', width: '2px', height: 'calc(100% - 10px)', background: BORDER }} />
                      )}
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: item.is_completed ? 'rgba(0, 202, 114, 0.1)' : 'rgba(51, 82, 147, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.is_completed
                          ? <Target size={18} color="#00ca72" />
                          : <Activity size={18} color={BRAND} />}
                      </div>
                      <div style={{ paddingTop: '0.35rem' }}>
                        <p style={{ color: TEXT_MAIN, fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{item.title}</p>
                        <span style={{ color: TEXT_MUTED, fontSize: '0.8rem' }}>{timeAgo(item.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right rail */}
          <aside style={{ flex: '1 1 300px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Impact Metrics */}
            <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: TEXT_MAIN }}>Impact Metrics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: BG_HOVER, border: `1px solid ${BORDER}`, padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: BRAND, marginBottom: '0.2rem' }}>
                    {profile.connections_count ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connections</div>
                </div>
                <div style={{ background: BG_HOVER, border: `1px solid ${BORDER}`, padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: BRAND, marginBottom: '0.2rem' }}>
                    {profile.networks_count ?? 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Networks</div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', background: BG_HOVER, border: `1px solid ${BORDER}`, padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: TEXT_MAIN, fontWeight: 600, fontSize: '0.9rem' }}>
                  <Eye size={18} color={TEXT_MUTED} /> Profile Views
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: TEXT_MAIN }}>—</span>
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: BRAND, color: 'white', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Expand your reach</h3>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5, opacity: 0.9, marginBottom: '1.25rem' }}>
                Users with 10+ strictly defined tags receive 40% more study group invites.
              </p>
              <Link
                href="/my-profile"
                style={{ display: 'block', width: '100%', padding: '0.6rem', background: 'white', color: BRAND, borderRadius: '6px', fontWeight: 700, textAlign: 'center', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                Add new Tags
              </Link>
            </div>

          </aside>
        </div>
      </div>
    </AppShell>
  )
}
