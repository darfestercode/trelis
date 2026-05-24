'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import { User, Tag } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tags, setTags] = useState<Record<string, Tag[]>>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    field: '',
    role: '',
    experience: '',
    country: '',
  })

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { router.push('/login'); return }
        setCurrentUser(d.user)
      })
    fetch('/api/tags')
      .then((r) => r.json())
      .then((d) => setTags(d.grouped ?? {}))
  }, [router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.field) params.set('field', filters.field)
    if (filters.role) params.set('role', filters.role)
    if (filters.experience) params.set('experience', filters.experience)
    if (filters.country) params.set('country', filters.country)

    const res = await fetch(`/api/users?${params}`)
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const yearLabel = (y: number | null) => {
    if (!y) return null
    const map: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: 'Graduate', 6: 'PhD' }
    return map[y] ?? `Year ${y}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUserId={currentUser?.id} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover Students & Mentors</h1>
          <p className="text-gray-500 mt-1">Find your next collaborator, mentor, or peer</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search by name or university…"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <select
              value={filters.field}
              onChange={(e) => setFilters((f) => ({ ...f, field: e.target.value }))}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">All Fields</option>
              {(tags.field ?? []).map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="">All Roles</option>
              {(tags.role ?? []).map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Country…"
              value={filters.country}
              onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No students found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{user.name}</h3>
                    {user.university && (
                      <p className="text-sm text-gray-500 truncate">{user.university}</p>
                    )}
                    {(user.major || user.year) && (
                      <p className="text-xs text-gray-400 truncate">
                        {[user.major, yearLabel(user.year)].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{user.bio}</p>
                )}

                {user.tags && user.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {user.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {user.tags.length > 4 && (
                      <span className="text-xs text-gray-400 px-2 py-0.5">
                        +{user.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex-1 text-center text-sm font-medium text-indigo-600 border border-indigo-200 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    View Profile
                  </Link>
                  {currentUser && currentUser.id !== user.id && (
                    <Link
                      href={`/messages?with=${user.id}`}
                      className="flex-1 text-center text-sm font-medium text-white bg-indigo-600 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Message
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
