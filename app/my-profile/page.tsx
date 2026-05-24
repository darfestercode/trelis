'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { User, Tag } from '@/types'

export default function MyProfilePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    bio: '',
    university: '',
    major: '',
    year: '',
    country: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/tags').then(r => r.json()),
    ]).then(([meData, tagsData]) => {
      if (!meData) { router.push('/login'); return }
      const user: User = meData.user
      setCurrentUser(user)
      setForm({
        name: user.name ?? '',
        bio: user.bio ?? '',
        university: user.university ?? '',
        major: user.major ?? '',
        year: user.year?.toString() ?? '',
        country: user.country ?? '',
      })
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
      setCurrentUser(data.user)
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
    skill: 'Skills',
    level: 'Level',
    goal: 'Goals',
    field: 'Fields',
    role: 'Roles',
    experience: 'Experience',
  }

  const yearLabel = (y: number | null) => {
    if (!y) return null
    const map: Record<number, string> = { 1: '1st Year Undergrad', 2: '2nd Year Undergrad', 3: '3rd Year Undergrad', 4: '4th Year Undergrad', 5: 'Postgraduate', 6: 'PhD' }
    return map[y] ?? `Year ${y}`
  }

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

  if (!currentUser) return null

  const userTags = allTags.filter(t => selectedTagIds.includes(t.id))
  const userTagsByCategory = userTags.reduce<Record<string, Tag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

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
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-xs font-medium border border-[#1e3a5f] text-[#1e3a5f] px-4 py-2 rounded-lg hover:bg-[#1e3a5f] hover:text-white transition-colors mb-1"
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
              <h1 className="text-lg font-bold text-gray-900">{currentUser.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {[yearLabel(currentUser.year), currentUser.major, currentUser.university ? `@ ${currentUser.university}` : null]
                  .filter(Boolean).join(' · ')}
              </p>
              {currentUser.country && <p className="text-xs text-gray-400 mt-1">{currentUser.country}</p>}
            </div>
          </div>

          {/* Success banner */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              Profile saved successfully!
            </div>
          )}

          {/* Edit form */}
          {editing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-5">Edit Profile</h3>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell others about yourself…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">University</label>
                  <input
                    name="university"
                    type="text"
                    value={form.university}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Major</label>
                    <input
                      name="major"
                      type="text"
                      value={form.major}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                    <select
                      name="year"
                      value={form.year}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 bg-white"
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <input
                    name="country"
                    type="text"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  />
                </div>

                {/* Tags */}
                {Object.entries(tagsByCategory).map(([category, catTags]) => (
                  <div key={category}>
                    <p className="block text-xs font-medium text-gray-700 mb-2">
                      {categoryLabels[category] ?? category} Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {catTags.map(tag => {
                        const selected = selectedTagIds.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                              selected
                                ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]'
                            }`}
                          >
                            {tag.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#1e3a5f] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* About Me */}
              {currentUser.bio && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">About Me</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{currentUser.bio}</p>
                </div>
              )}

              {/* My Filter Tags */}
              {Object.keys(userTagsByCategory).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">My Filter Tags</h3>
                  <div className="space-y-4">
                    {Object.entries(userTagsByCategory).map(([category, tags]) => (
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
            </>
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
                  {new Date(currentUser.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs text-gray-500 leading-relaxed">
              Complete your profile to increase connection requests by up to 3x. Add a bio and select your tags.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
