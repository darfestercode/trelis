'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { User } from '@/types'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [profile, setProfile] = useState<User | null>(null)
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

  const yearLabel = (y: number | null) => {
    if (!y) return null
    const map: Record<number, string> = { 1: '1st Year Undergrad', 2: '2nd Year Undergrad', 3: '3rd Year Undergrad', 4: '4th Year Undergrad', 5: 'Postgraduate', 6: 'PhD' }
    return map[y] ?? `Year ${y}`
  }

  const isOwnProfile = currentUser?.id === parseInt(profileId)

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="bg-white rounded-xl h-48 animate-pulse border border-gray-200" />
            <div className="bg-white rounded-xl h-24 animate-pulse border border-gray-200" />
          </div>
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-xl h-40 animate-pulse border border-gray-200" />
          </div>
        </div>
      </AppShell>
    )
  }

  if (notFound || !profile) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-xl font-bold text-gray-700">User not found</p>
          <Link href="/dashboard" className="text-[#1e3a5f] mt-4 inline-block hover:underline text-sm">
            Back to Dashboard
          </Link>
        </div>
      </AppShell>
    )
  }

  const tagsByCategory = (profile.tags ?? []).reduce<Record<string, NonNullable<User['tags']>>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    skill: 'Skills',
    level: 'Level',
    goal: 'Goals',
    field: 'Fields',
    role: 'Roles',
    experience: 'Experience',
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6">
        {/* Main */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="h-28 bg-[#1e3a5f]" />
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow bg-[#1e3a5f] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-2 pb-1">
                  {isOwnProfile ? (
                    <Link
                      href="/my-profile"
                      className="text-xs font-medium border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Edit Profile
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={handleConnect}
                        disabled={connected}
                        className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${
                          connected
                            ? 'border border-gray-200 text-gray-400 cursor-default'
                            : 'border border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white'
                        }`}
                      >
                        {connected ? 'Connected' : 'Connect'}
                      </button>
                      <button
                        onClick={() => router.push(`/messages?with=${profile.id}`)}
                        className="text-xs font-medium bg-[#1e3a5f] text-white px-4 py-2 rounded-lg hover:bg-[#162d4a] transition-colors"
                      >
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h1 className="text-lg font-bold text-gray-900">{profile.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {[yearLabel(profile.year), profile.major, profile.university ? `@ ${profile.university}` : null]
                  .filter(Boolean).join(' · ')}
              </p>
              {profile.country && <p className="text-xs text-gray-400 mt-1">{profile.country}</p>}
            </div>
          </div>

          {/* About Me */}
          {profile.bio && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">About Me</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* My Filter Tags */}
          {Object.keys(tagsByCategory).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">My Filter Tags</h3>
              <div className="space-y-4">
                {Object.entries(tagsByCategory).map(([category, tags]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {categoryLabels[category] ?? category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(t => (
                        <span key={t.id} className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-64 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Impact Metrics</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-xs text-gray-500">Profile Views</span>
                <span className="text-sm font-semibold text-gray-900">—</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-xs text-gray-500">Connections</span>
                <span className="text-sm font-semibold text-gray-900">—</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-gray-500">Member Since</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {!isOwnProfile && currentUser && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Connect to see {profile.name.split(' ')[0]}&apos;s full academic roadmap and collaborate on projects.
              </p>
              <button
                onClick={() => router.push(`/messages?with=${profile.id}`)}
                className="w-full bg-[#1e3a5f] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#162d4a] transition-colors"
              >
                Send Message
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
