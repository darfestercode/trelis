'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import { User } from '@/types'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [profile, setProfile] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${profileId}`).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
    ]).then(([profileData, meData]) => {
      if (!profileData) { setNotFound(true) }
      else { setProfile(profileData.user) }
      if (meData) setCurrentUser(meData.user)
      setLoading(false)
    })
  }, [profileId])

  const yearLabel = (y: number | null) => {
    if (!y) return null
    const map: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: 'Graduate', 6: 'PhD' }
    return map[y] ?? `Year ${y}`
  }

  const isOwnProfile = currentUser?.id === parseInt(profileId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentUserId={currentUser?.id} />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl h-96 animate-pulse" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentUserId={currentUser?.id} />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-2xl font-bold text-gray-700">User not found</p>
          <Link href="/dashboard" className="text-indigo-600 mt-4 inline-block hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const fieldTags = profile.tags?.filter((t) => t.category === 'field') ?? []
  const roleTags = profile.tags?.filter((t) => t.category === 'role') ?? []
  const expTags = profile.tags?.filter((t) => t.category === 'experience') ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUserId={currentUser?.id} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Profile header */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-32" />
          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-12 mb-6">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex gap-3 pb-2">
                {isOwnProfile && (
                  <Link
                    href="/my-profile"
                    className="text-sm font-medium text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    Edit Profile
                  </Link>
                )}
                {!isOwnProfile && currentUser && (
                  <button
                    onClick={() => router.push(`/messages?with=${profile.id}`)}
                    className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Message
                  </button>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
              {profile.university && <span>🎓 {profile.university}</span>}
              {profile.major && <span>📚 {profile.major}</span>}
              {profile.year && <span>{yearLabel(profile.year)}</span>}
              {profile.country && <span>📍 {profile.country}</span>}
            </div>

            {profile.bio && (
              <p className="mt-5 text-gray-600 leading-relaxed">{profile.bio}</p>
            )}

            {/* Tags */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="mt-6 space-y-4">
                {fieldTags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fields</p>
                    <div className="flex flex-wrap gap-2">
                      {fieldTags.map((t) => (
                        <span key={t.id} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {roleTags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {roleTags.map((t) => (
                        <span key={t.id} className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {expTags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Experience</p>
                    <div className="flex flex-wrap gap-2">
                      {expTags.map((t) => (
                        <span key={t.id} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
