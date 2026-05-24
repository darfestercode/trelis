'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import { User } from '@/types'

interface Network {
  id: number
  name: string
  description: string | null
  creator_name: string
  member_count: number
  is_member: boolean
  created_at: string
}

export default function DiscoverPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [connected, setConnected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { router.push('/login'); return }
      setCurrentUser(d.user)
    })
    fetch('/api/networks').then(r => r.json()).then(d => setNetworks(d.networks ?? []))
    fetch('/api/connections').then(r => r.json()).then(d => {
      setConnected(new Set((d.connections ?? []).map((c: { other_user_id: number }) => c.other_user_id)))
    })
  }, [router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const data = await fetch(`/api/users${params}`).then(r => r.json())
    setUsers(data.users ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleConnect(userId: number) {
    await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: userId }),
    })
    setConnected(prev => new Set([...prev, userId]))
  }

  const yearLabel = (y: number | null) => {
    const map: Record<number, string> = { 1: 'Undergrad', 2: 'Undergrad', 3: 'Undergrad', 4: 'Undergrad', 5: 'Postgraduate', 6: 'PhD' }
    return y ? (map[y] ?? 'Student') : 'Student'
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
          <p className="text-sm text-gray-500 mt-1">Discover likeminded students and open collaborative project networks.</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 max-w-lg shadow-sm">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, university, or tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-600 placeholder-gray-400"
          />
        </div>

        <p className="text-sm text-gray-400 -mt-4">Showing top recommended connections.</p>

        {/* Project Networks */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Project Networks</h2>
          {networks.length === 0 ? (
            <p className="text-sm text-gray-400">No networks found matching your criteria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {networks.map(n => (
                <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-sm mb-3">
                    {n.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{n.name}</h3>
                  {n.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">{n.member_count} member{Number(n.member_count) !== 1 ? 's' : ''} · by {n.creator_name}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Students & Professionals */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Students &amp; Professionals</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl h-36 animate-pulse border border-gray-200" />)}
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-400">No people found matching your criteria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {yearLabel(user.year)}{user.major ? ` · ${user.major}` : ''}
                        {user.university ? ` @ ${user.university}` : ''}
                      </p>
                    </div>
                  </div>
                  {user.tags && user.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {user.tags.slice(0, 3).map(t => (
                        <span key={t.id} className="text-xs border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{t.name}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/profile/${user.id}`} className="flex-1 text-center text-xs border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      View Profile
                    </Link>
                    {currentUser && currentUser.id !== user.id && (
                      <button
                        onClick={() => handleConnect(user.id)}
                        disabled={connected.has(user.id)}
                        className={`flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium ${
                          connected.has(user.id)
                            ? 'border border-gray-200 text-gray-400 cursor-default'
                            : 'border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white'
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
