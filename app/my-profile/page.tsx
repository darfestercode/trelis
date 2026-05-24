'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
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
      fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/tags').then((r) => r.json()),
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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
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
        body: JSON.stringify({
          ...form,
          year: form.year ? parseInt(form.year) : null,
          tagIds: selectedTagIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save')
        return
      }
      setCurrentUser(data.user)
      setSuccess(true)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentUserId={undefined} />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl h-96 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUserId={currentUser?.id} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-500 mt-1">Update your information and tags</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
              Profile saved successfully!
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                rows={4}
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell others about yourself, your interests, and what you're looking for…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
              <input
                name="university"
                type="text"
                value={form.university}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                <input
                  name="major"
                  type="text"
                  value={form.major}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                name="country"
                type="text"
                value={form.country}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Tags */}
            {Object.entries(tagsByCategory).map(([category, catTags]) => (
              <div key={category}>
                <p className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {category} Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {catTags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors border ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
