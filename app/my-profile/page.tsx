'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, GraduationCap, MapPin, Target, Activity, Eye, Edit3 } from 'lucide-react'
import AppShell from '@/app/components/AppShell'
import { User, Tag } from '@/types'

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
const TEXT_MAIN = '#111827'
const TEXT_MUTED = '#6B7280'
const BORDER = '#E5E7EB'
const BG_CARD = '#FFFFFF'
const BG_HOVER = '#F9FAFB'

export default function MyProfilePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<ProfileUser | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '', university: '', major: '', year: '', country: '' })

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/tags').then(r => r.json()),
    ]).then(([meData, tagsData]) => {
      if (!meData) { router.push('/login'); return }
      const user: ProfileUser = meData.user

      // Fetch full profile with counts
      fetch(`/api/users/${user.id}`).then(r => r.json()).then(profileData => {
        if (profileData.user) setCurrentUser(profileData.user)
      })

      setCurrentUser(user)
      setForm({ name: user.name ?? '', bio: user.bio ?? '', university: user.university ?? '', major: user.major ?? '', year: user.year?.toString() ?? '', country: user.country ?? '' })
      setSelectedTagIds((user.tags ?? []).map((t: Tag) => t.id))
      setAllTags(tagsData.tags ?? [])
      setLoading(false)
    })
  }, [router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function toggleTag(id: number) {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, year: form.year ? parseInt(form.year) : null, tagIds: selectedTagIds }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      setCurrentUser(prev => prev ? { ...prev, ...data.user } : data.user)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const tagsByCategory = allTags.reduce<Record<string, Tag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    skill: 'Skill Focus', skills: 'Skill Focus',
    level: 'Level of Study',
    goal: 'Future Goal', goals: 'Future Goal',
    field: 'Field', role: 'Role', experience: 'Experience',
  }

  const yearLabel = (y: number | null) => {
    if (!y) return null
    const map: Record<number, string> = { 1: 'Undergrad', 2: 'Undergrad', 3: 'Undergrad', 4: 'Undergrad', 5: 'Postgraduate', 6: 'PhD' }
    return map[y] ?? `Year ${y}`
  }

  if (loading || !currentUser) {
    return (
      <AppShell>
        <div style={{ margin: '0 auto', maxWidth: '1100px', padding: '2rem 2.5rem' }}>
          <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', height: '300px' }} />
        </div>
      </AppShell>
    )
  }

  const userTags = allTags.filter(t => selectedTagIds.includes(t.id))
  const userTagsByCategory = userTags.reduce<Record<string, Tag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

  const milestones = currentUser.recent_milestones ?? []

  return (
    <AppShell>
      <div style={{ margin: '0 auto', width: '100%', maxWidth: '1100px', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ── Hero Banner ── */}
        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '100%', height: '140px', background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)` }} />

          <button
            onClick={() => setEditing(!editing)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)', border: 'none', padding: '0.5rem 1rem', borderRadius: '100px', color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            <Edit3 size={16} /> {editing ? 'Cancel Edit' : 'Edit Profile'}
          </button>

          <div style={{ padding: '0 2.5rem 2.5rem 2.5rem', position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: BG_CARD, border: `4px solid ${BG_CARD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: BRAND, marginTop: '-60px', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: TEXT_MAIN, marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>
              {currentUser.name}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: TEXT_MUTED, fontSize: '0.9rem', fontWeight: 500, marginTop: '0.5rem' }}>
              {yearLabel(currentUser.year) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Briefcase size={16} color={BRAND} /> {yearLabel(currentUser.year)}{currentUser.major ? ` · ${currentUser.major}` : ''}
                </span>
              )}
              {currentUser.university && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={16} color={BRAND} /> {currentUser.university}
                </span>
              )}
              {currentUser.country && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={16} color={BRAND} /> {currentUser.country}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Success banner */}
        {success && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', borderRadius: '12px', padding: '1rem 1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
            Profile saved successfully!
          </div>
        )}

        {/* ── Edit Form (inline) ── */}
        {editing && (
          <div style={{ background: BG_CARD, border: `1px solid ${BRAND}`, borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: TEXT_MAIN }}>Edit Profile</h3>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: TEXT_MAIN, marginBottom: '0.4rem' }}>Full Name</label>
                <input name="name" type="text" required value={form.name} onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.currentTarget.style.borderColor = BRAND}
                  onBlur={e => e.currentTarget.style.borderColor = BORDER}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: TEXT_MAIN, marginBottom: '0.4rem' }}>Bio</label>
                <textarea name="bio" rows={3} value={form.bio} onChange={handleChange} placeholder="Tell others about yourself, your interests, and what you're looking for…"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={e => e.currentTarget.style.borderColor = BRAND}
                  onBlur={e => e.currentTarget.style.borderColor = BORDER}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: TEXT_MAIN, marginBottom: '0.4rem' }}>University</label>
                <input name="university" type="text" value={form.university} onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.currentTarget.style.borderColor = BRAND}
                  onBlur={e => e.currentTarget.style.borderColor = BORDER}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: TEXT_MAIN, marginBottom: '0.4rem' }}>Major</label>
                  <input name="major" type="text" value={form.major} onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.currentTarget.style.borderColor = BRAND}
                    onBlur={e => e.currentTarget.style.borderColor = BORDER}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: TEXT_MAIN, marginBottom: '0.4rem' }}>Year</label>
                  <select name="year" value={form.year} onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '0.95rem', outline: 'none', background: 'white', fontFamily: 'inherit' }}
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">Graduate</option>
                    <option value="6">PhD</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: TEXT_MAIN, marginBottom: '0.4rem' }}>Country</label>
                <input name="country" type="text" value={form.country} onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.currentTarget.style.borderColor = BRAND}
                  onBlur={e => e.currentTarget.style.borderColor = BORDER}
                />
              </div>

              {/* Tag selectors */}
              {Object.entries(tagsByCategory).map(([category, catTags]) => (
                <div key={category}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: TEXT_MAIN, marginBottom: '0.6rem' }}>
                    {categoryLabels[category] ?? category} Tags
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {catTags.map(tag => {
                      const selected = selectedTagIds.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          style={{ padding: '0.35rem 0.9rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${selected ? BRAND : BORDER}`, background: selected ? BRAND : 'white', color: selected ? 'white' : TEXT_MUTED, transition: 'all 0.15s' }}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditing(false)}
                  style={{ flex: 1, border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT_MUTED, padding: '0.75rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, background: BRAND, color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Two-column body (view mode) ── */}
        {!editing && (
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

            {/* Left column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>

              {/* About Me */}
              {currentUser.bio ? (
                <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: TEXT_MAIN }}>About Me</h3>
                  <p style={{ color: TEXT_MAIN, fontSize: '1rem', lineHeight: 1.6 }}>{currentUser.bio}</p>
                </div>
              ) : (
                <div style={{ background: BG_CARD, border: `1px dashed ${BORDER}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: TEXT_MUTED, fontSize: '0.95rem', marginBottom: '0.75rem' }}>No bio yet. Tell the community about yourself.</p>
                  <button onClick={() => setEditing(true)}
                    style={{ background: BRAND, color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    Add Bio
                  </button>
                </div>
              )}

              {/* My Filter Tags */}
              {Object.keys(userTagsByCategory).length > 0 ? (
                <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: TEXT_MAIN }}>My Filter Tags</h3>
                    <button onClick={() => setEditing(true)}
                      style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: TEXT_MAIN, padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage Tags
                    </button>
                  </div>
                  <p style={{ color: TEXT_MUTED, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Your active tags dictate how recruiters, study groups, and peers discover you in the network search algorithm.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(userTagsByCategory).map(([category, tags]) => (
                      <div key={category}>
                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: TEXT_MUTED, letterSpacing: '0.05em', marginBottom: '0.8rem' }}>
                          {categoryLabels[category] ?? category}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {tags.map(t => (
                            <span key={t.id} style={{ background: 'rgba(51, 82, 147, 0.08)', color: BRAND, border: '1px solid rgba(51, 82, 147, 0.2)', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600 }}>
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: BG_CARD, border: `1px dashed ${BORDER}`, borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: TEXT_MUTED, fontSize: '0.95rem', marginBottom: '0.75rem' }}>No tags selected. Tags help people find you.</p>
                  <button onClick={() => setEditing(true)}
                    style={{ background: BRAND, color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    Add Tags
                  </button>
                </div>
              )}

              {/* Recent Activity Planner */}
              {milestones.length > 0 && (
                <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: TEXT_MAIN }}>Recent Activity Planner</h3>
                    <Link href="/roadmap" style={{ fontSize: '0.85rem', color: BRAND, fontWeight: 500, textDecoration: 'none' }}>View Roadmap →</Link>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {milestones.map((item, i) => (
                      <div key={item.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        {i !== milestones.length - 1 && (
                          <div style={{ position: 'absolute', top: '30px', left: '19px', width: '2px', height: 'calc(100% - 10px)', background: BORDER }} />
                        )}
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: item.is_completed ? 'rgba(0, 202, 114, 0.1)' : 'rgba(51, 82, 147, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.is_completed ? <Target size={18} color="#00ca72" /> : <Activity size={18} color={BRAND} />}
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
            <aside style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: TEXT_MAIN }}>Impact Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: BG_HOVER, border: `1px solid ${BORDER}`, padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: BRAND, marginBottom: '0.2rem' }}>
                      {currentUser.connections_count ?? 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connections</div>
                  </div>
                  <div style={{ background: BG_HOVER, border: `1px solid ${BORDER}`, padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: BRAND, marginBottom: '0.2rem' }}>
                      {currentUser.networks_count ?? 0}
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

              <div style={{ background: BRAND, color: 'white', borderRadius: '12px', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Expand your reach</h3>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5, opacity: 0.9, marginBottom: '1.25rem' }}>
                  Users with 10+ strictly defined tags receive 40% more study group invites.
                </p>
                <button onClick={() => setEditing(true)}
                  style={{ width: '100%', padding: '0.6rem', background: 'white', color: BRAND, border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                  Add new Tags
                </button>
              </div>

            </aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}
