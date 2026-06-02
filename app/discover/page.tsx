'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import { User } from '@/types'
import { useUser } from '@/app/components/UserContext'

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

  const { user: currentUser, loading: authLoading } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [connected, setConnected] = useState<Set<number>>(new Set())
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [activeYear, setActiveYear] = useState<string>('')

  useEffect(() => {
    if (!authLoading && !currentUser) router.push('/login')
  }, [authLoading, currentUser, router])

  useEffect(() => {
    if (!currentUser) return
    fetch('/api/networks').then(r => r.json()).then(d => setNetworks(d.networks ?? []))
    fetch('/api/connections').then(r => r.json()).then(d => {
      setConnected(new Set((d.connections ?? []).map((c: { other_user_id: number }) => c.other_user_id)))
    })
    fetch('/api/tags').then(r => r.json()).then(d => setAllTags(d.tags ?? []))
  }, [currentUser])


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
      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-4 sm:py-7 flex flex-col gap-5 sm:gap-7">

        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 mb-1">Discover</h1>
          <p className="text-sm text-gray-500">Find students, researchers, and collaborators worldwide.</p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2.5 items-center">

            {/* Search bar */}
            <div className={`flex-1 flex items-center gap-2.5 bg-white border rounded-xl px-4 py-2.5 transition-all ${
              filtersOpen ? 'border-[#335293] ring-2 ring-[#335293]/10' : 'border-gray-200'
            }`}>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearch('')}
                placeholder="Search by name, university, major..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 leading-none">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${
                filtersOpen || activeFilterCount > 0
                  ? 'border-[#335293] bg-[#335293]/6 text-[#335293]'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-[18px] h-[18px] rounded-full bg-[#335293] text-white text-[11px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {filtersOpen && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 flex flex-col gap-5">

              {/* Year level */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Level</p>
                <div className="flex flex-wrap gap-2">
                  {YEAR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setActiveYear(v => v === opt.value ? '' : opt.value)}
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all ${
                        activeYear === opt.value
                          ? 'border-[#335293] bg-[#335293]/8 text-[#335293]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
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
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">{cat.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => {
                        const active = activeTags.has(tag.name)
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.name)}
                            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all ${
                              active
                                ? 'border-[#335293] bg-[#335293]/8 text-[#335293]'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
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
            <div className="flex flex-wrap gap-2 items-center">
              {search.trim() && (
                <span className="inline-flex items-center gap-1.5 bg-[#335293]/8 text-[#335293] text-[13px] font-semibold px-3 py-1 rounded-full border border-[#335293]/20">
                  &ldquo;{search.trim()}&rdquo;
                  <button onClick={() => setSearch('')} className="leading-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {activeYear && (
                <span className="inline-flex items-center gap-1.5 bg-[#335293]/8 text-[#335293] text-[13px] font-semibold px-3 py-1 rounded-full border border-[#335293]/20">
                  {YEAR_OPTIONS.find(o => o.value === activeYear)?.label}
                  <button onClick={() => setActiveYear('')} className="leading-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {[...activeTags].map(name => (
                <span key={name} className="inline-flex items-center gap-1.5 bg-[#335293]/8 text-[#335293] text-[13px] font-semibold px-3 py-1 rounded-full border border-[#335293]/20">
                  {name}
                  <button onClick={() => toggleTag(name)} className="leading-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <button onClick={clearAll} className="text-[13px] text-gray-500 font-medium underline bg-transparent border-none cursor-pointer px-2 py-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Project Networks */}
        {!hasFilters && (
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-4">Project Networks</h2>
            {networks.length === 0 ? (
              <p className="text-sm text-gray-400">No networks yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                {networks.map(n => (
                  <div key={n.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-[#1e3a5f]/30 transition-all cursor-pointer"
                    onClick={() => router.push(`/networks/${n.id}`)}>
                    <div className="w-10 h-10 rounded-xl bg-[#335293] flex items-center justify-center text-white font-bold text-sm mb-3">
                      {n.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">{n.name}</p>
                    {n.description && <p className="text-[13px] text-gray-500 mb-2 leading-relaxed line-clamp-2">{n.description}</p>}
                    <p className="text-xs text-gray-400">{n.member_count} member{Number(n.member_count) !== 1 ? 's' : ''} · by {n.creator_name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* People */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">
              {hasFilters ? 'Search Results' : 'Students & Professionals'}
            </h2>
            {!loading && (
              <span className="text-[13px] text-gray-400">{users.length} found</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl h-40 border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500 text-[15px] font-medium">No people match your filters</p>
              <p className="text-gray-400 text-[13px] mt-1.5">Try removing some filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {users.map(user => (
                <div key={user.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#335293] flex items-center justify-center text-white font-bold text-base shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {yearLabel(user.year)}{user.major ? ` · ${user.major}` : ''}{user.university ? ` @ ${user.university}` : ''}
                      </p>
                    </div>
                  </div>

                  {user.tags && user.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {user.tags.slice(0, 4).map(t => {
                        const isActive = activeTags.has(t.name)
                        return (
                          <span
                            key={t.id}
                            className={`text-xs px-2.5 py-1 rounded-full border ${
                              isActive
                                ? 'border-[#335293] text-[#335293] bg-[#335293]/6 font-semibold'
                                : 'border-gray-200 text-gray-500 bg-white'
                            }`}
                          >
                            {t.name}
                          </span>
                        )
                      })}
                      {user.tags.length > 4 && (
                        <span className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-400">
                          +{user.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex-1 text-center text-[13px] py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-colors"
                    >
                      View Profile
                    </Link>
                    {currentUser && currentUser.id !== user.id && (
                      <button
                        onClick={() => handleConnect(user.id)}
                        disabled={connected.has(user.id)}
                        className={`flex-1 text-[13px] py-2 rounded-lg font-semibold border transition-all ${
                          connected.has(user.id)
                            ? 'border-gray-200 text-gray-400 bg-white cursor-default'
                            : 'border-[#335293] text-[#335293] bg-[#335293]/6 hover:bg-[#335293]/12'
                        }`}
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
