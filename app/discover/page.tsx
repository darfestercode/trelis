'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import { User } from '@/types'

const BRAND = '#335293'

interface Network {
  id: number
  name: string
  description: string | null
  creator_name: string
  member_count: number
  is_member: boolean
}

interface Tag {
  id: number
  name: string
  category: string
}

const FILTER_CATEGORIES: { key: string; label: string }[] = [
  { key: 'country', label: 'Country' },
  { key: 'institution', label: 'Institution' },
  { key: 'skill', label: 'Skills' },
  { key: 'interest', label: 'Interests' },
  { key: 'goal', label: 'Goals' },
]

const YEAR_OPTIONS = [
  { value: '1', label: 'Year 1' },
  { value: '2', label: 'Year 2' },
  { value: '3', label: 'Year 3' },
  { value: '4', label: 'Year 4' },
  { value: '5', label: 'Postgraduate' },
  { value: '6', label: 'PhD' },
]

function DiscoverInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [connected, setConnected] = useState<Set<number>>(new Set())
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filter state
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [activeYear, setActiveYear] = useState<string>('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { router.push('/login'); return }
      setCurrentUser(d.user)
    })
    fetch('/api/networks').then(r => r.json()).then(d => setNetworks(d.networks ?? []))
    fetch('/api/connections').then(r => r.json()).then(d => {
      setConnected(new Set((d.connections ?? []).map((c: { other_user_id: number }) => c.other_user_id)))
    })
    fetch('/api/tags').then(r => r.json()).then(d => setAllTags(d.tags ?? []))
  }, [router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (activeYear) params.set('year', activeYear)
    if (activeTags.size > 0) params.set('tags', [...activeTags].join(','))
    const data = await fetch(`/api/users?${params}`).then(r => r.json())
    setUsers(data.users ?? [])
    setLoading(false)
  }, [search, activeTags, activeYear])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Sync URL q param → search state when navigating here from TopBar
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearch(q)
  }, [searchParams])

  function toggleTag(name: string) {
    setActiveTags(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function clearAll() {
    setSearch('')
    setActiveTags(new Set())
    setActiveYear('')
  }

  async function handleConnect(userId: number) {
    await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: userId }),
    })
    setConnected(prev => new Set([...prev, userId]))
  }

  const yearLabel = (y: number | null) => {
    if (!y) return 'Student'
    if (y <= 4) return `Year ${y} · Undergrad`
    if (y === 5) return 'Postgraduate'
    return 'PhD'
  }

  const tagsByCategory = FILTER_CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = allTags.filter(t => t.category === cat.key)
    return acc
  }, {} as Record<string, Tag[]>)

  const hasFilters = activeTags.size > 0 || activeYear || search.trim()
  const activeFilterCount = activeTags.size + (activeYear ? 1 : 0)

  return (
    <AppShell>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Discover</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Find students, researchers, and collaborators worldwide.</p>
        </div>

        {/* Super search bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Main search */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: `1.5px solid ${filtersOpen ? BRAND : '#E5E7EB'}`, borderRadius: '12px', padding: '10px 16px', boxShadow: filtersOpen ? `0 0 0 3px rgba(51,82,147,0.1)` : 'none', transition: 'all 0.15s' }}>
              <svg width="16" height="16" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearch('')}
                placeholder="Search by name, university, major..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#111827', background: 'transparent' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ color: '#9CA3AF', lineHeight: 1 }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setFiltersOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: `1.5px solid ${filtersOpen || activeFilterCount > 0 ? BRAND : '#E5E7EB'}`, background: filtersOpen || activeFilterCount > 0 ? `rgba(51,82,147,0.06)` : '#fff', color: filtersOpen || activeFilterCount > 0 ? BRAND : '#374151', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              Filters
              {activeFilterCount > 0 && (
                <span style={{ background: BRAND, color: '#fff', fontSize: '11px', fontWeight: 700, width: '18px', height: '18px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {filtersOpen && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Year level */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Level</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {YEAR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setActiveYear(v => v === opt.value ? '' : opt.value)}
                      style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${activeYear === opt.value ? BRAND : '#E5E7EB'}`, background: activeYear === opt.value ? `rgba(51,82,147,0.08)` : '#fff', color: activeYear === opt.value ? BRAND : '#374151', transition: 'all 0.12s' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag categories */}
              {FILTER_CATEGORIES.map(cat => {
                const tags = tagsByCategory[cat.key] || []
                if (tags.length === 0) return null
                return (
                  <div key={cat.key}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{cat.label}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {tags.map(tag => {
                        const active = activeTags.has(tag.name)
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.name)}
                            style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${active ? BRAND : '#E5E7EB'}`, background: active ? `rgba(51,82,147,0.08)` : '#fff', color: active ? BRAND : '#374151', transition: 'all 0.12s' }}
                          >
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Active filter chips */}
          {hasFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {search.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(51,82,147,0.08)', color: BRAND, fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px', border: `1px solid rgba(51,82,147,0.2)` }}>
                  &ldquo;{search.trim()}&rdquo;
                  <button onClick={() => setSearch('')} style={{ color: BRAND, lineHeight: 1 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              )}
              {activeYear && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(51,82,147,0.08)', color: BRAND, fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px', border: `1px solid rgba(51,82,147,0.2)` }}>
                  {YEAR_OPTIONS.find(o => o.value === activeYear)?.label}
                  <button onClick={() => setActiveYear('')} style={{ color: BRAND, lineHeight: 1 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              )}
              {[...activeTags].map(name => (
                <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(51,82,147,0.08)', color: BRAND, fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px', border: `1px solid rgba(51,82,147,0.2)` }}>
                  {name}
                  <button onClick={() => toggleTag(name)} style={{ color: BRAND, lineHeight: 1 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              ))}
              <button onClick={clearAll} style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Project Networks */}
        {!hasFilters && (
          <section>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Project Networks</h2>
            {networks.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#9CA3AF' }}>No networks yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {networks.map(n => (
                  <div key={n.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '20px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>
                      {n.name.charAt(0).toUpperCase()}
                    </div>
                    <p style={{ fontWeight: 600, color: '#111827', fontSize: '14px', marginBottom: '4px' }}>{n.name}</p>
                    {n.description && <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', lineHeight: 1.5 }}>{n.description}</p>}
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{n.member_count} member{Number(n.member_count) !== 1 ? 's' : ''} · by {n.creator_name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* People */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
              {hasFilters ? 'Search Results' : 'Students & Professionals'}
            </h2>
            {!loading && (
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{users.length} found</span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: '#fff', borderRadius: '14px', height: '160px', border: '1px solid #E5E7EB', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '48px', textAlign: 'center' }}>
              <svg width="40" height="40" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" style={{ margin: '0 auto 16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <p style={{ color: '#6B7280', fontSize: '15px', fontWeight: 500 }}>No people match your filters</p>
              <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '6px' }}>Try removing some filters</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {users.map(user => (
                <div key={user.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: '#111827', fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                      <p style={{ fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {yearLabel(user.year)}{user.major ? ` · ${user.major}` : ''}{user.university ? ` @ ${user.university}` : ''}
                      </p>
                    </div>
                  </div>

                  {user.tags && user.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {user.tags.slice(0, 4).map(t => {
                        const isActive = activeTags.has(t.name)
                        return (
                          <span
                            key={t.id}
                            style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '100px', border: `1px solid ${isActive ? BRAND : '#E5E7EB'}`, color: isActive ? BRAND : '#6B7280', background: isActive ? 'rgba(51,82,147,0.06)' : '#fff', fontWeight: isActive ? 600 : 400 }}
                          >
                            {t.name}
                          </span>
                        )
                      })}
                      {user.tags.length > 4 && (
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '100px', border: '1px solid #E5E7EB', color: '#9CA3AF' }}>+{user.tags.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/profile/${user.id}`}
                      style={{ flex: 1, textAlign: 'center', fontSize: '13px', padding: '8px', borderRadius: '8px', border: '1px solid #E5E7EB', color: '#374151', fontWeight: 500, textDecoration: 'none' }}
                    >
                      View Profile
                    </Link>
                    {currentUser && currentUser.id !== user.id && (
                      <button
                        onClick={() => handleConnect(user.id)}
                        disabled={connected.has(user.id)}
                        style={{ flex: 1, fontSize: '13px', padding: '8px', borderRadius: '8px', fontWeight: 600, cursor: connected.has(user.id) ? 'default' : 'pointer', border: `1px solid ${connected.has(user.id) ? '#E5E7EB' : BRAND}`, color: connected.has(user.id) ? '#9CA3AF' : BRAND, background: connected.has(user.id) ? '#fff' : 'rgba(51,82,147,0.06)', transition: 'all 0.12s' }}
                      >
                        {connected.has(user.id) ? 'Connected' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverInner />
    </Suspense>
  )
}
