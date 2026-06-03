'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Target, Activity, Eye, Edit3 } from 'lucide-react'
import AppShell from '@/app/components/AppShell'
import { User, Tag } from '@/types'
import { useUser } from '@/app/components/UserContext'

interface ProfileUser extends User {
  connections_count?: number
  profile_views?: number
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

export default function MyProfilePage() {
  const router = useRouter()
  const { user: authUser, loggedOut } = useUser()
  const [currentUser, setCurrentUser] = useState<ProfileUser | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', bio: '' })

  const [tagInput, setTagInput] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const tagWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loggedOut) { router.push('/login'); return }
  }, [loggedOut, router])

  useEffect(() => {
    if (!authUser) return
    fetch(`/api/users/${authUser.id}`).then(r => r.json()).then(profileData => {
      const user: ProfileUser = profileData.user ?? authUser
      setCurrentUser(user)
      setForm({ name: user.name ?? '', bio: user.bio ?? '' })
      setSelectedTags(user.tags ?? [])
      setLoading(false)
    })
  }, [authUser])

  // Debounced tag search
  useEffect(() => {
    const trimmed = tagInput.trim()
    if (!trimmed) { setSuggestions([]); setShowDropdown(false); return }
    const timer = setTimeout(async () => {
      const data = await fetch(`/api/tags?q=${encodeURIComponent(trimmed)}`).then(r => r.json())
      const filtered = (data.tags ?? []).filter((t: Tag) => !selectedTags.find(s => s.id === t.id))
      setSuggestions(filtered)
      setShowDropdown(true)
    }, 180)
    return () => clearTimeout(timer)
  }, [tagInput, selectedTags])

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (tagWrapRef.current && !tagWrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleTagInput(value: string) {
    setTagInput(value.toLowerCase())
  }

  function selectTag(tag: Tag) {
    if (!selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag])
    }
    setTagInput('')
    setSuggestions([])
    setShowDropdown(false)
  }

  async function createTag(name: string) {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.tag) selectTag(data.tag)
  }

  function removeTag(id: number) {
    setSelectedTags(prev => prev.filter(t => t.id !== id))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
        body: JSON.stringify({ ...form, tagIds: selectedTags.map(t => t.id) }),
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

  if (loading || !currentUser) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[1100px] px-3 sm:px-6 lg:px-10 py-4 sm:py-8">
          <div className="bg-white border border-gray-200 rounded-xl h-[300px] animate-pulse" />
        </div>
      </AppShell>
    )
  }

  const exactMatch = suggestions.find(s => s.name === tagInput.trim())
  const alreadyAdded = !!tagInput.trim() && selectedTags.some(t => t.name === tagInput.trim())
  const milestones = currentUser.recent_milestones ?? []

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-3 sm:px-6 lg:px-10 py-4 sm:py-8 flex flex-col gap-6 sm:gap-8">

        {/* ── Hero Banner ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden relative shadow-sm">
          <div className="w-full h-[140px] bg-gradient-to-br from-[#335293] to-[#4A6BAE]" />

          <button
            onClick={() => setEditing(!editing)}
            className="absolute top-6 right-6 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border-0 px-4 py-2 rounded-full text-white font-semibold text-sm cursor-pointer hover:bg-white/30 transition-colors"
          >
            <Edit3 size={16} /> {editing ? 'Cancel Edit' : 'Edit Profile'}
          </button>

          <div className="px-5 sm:px-8 lg:px-10 pb-6 sm:pb-10 relative">
            <div className="w-[120px] h-[120px] rounded-full bg-white border-4 border-white flex items-center justify-center text-[2.5rem] font-extrabold text-[#335293] -mt-[60px] mb-4 shadow-md">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>

            <h1 className="text-[2rem] font-extrabold text-gray-900 mb-1 tracking-tight">
              {currentUser.name}
            </h1>
            {currentUser.email && (
              <a href={`mailto:${currentUser.email}`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 no-underline text-sm font-medium mt-2">
                <Mail size={16} className="text-[#335293]" />
                {currentUser.email}
              </a>
            )}
          </div>
        </div>

        {/* Success banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-6 py-4 text-sm font-medium">
            Profile saved successfully!
          </div>
        )}

        {/* ── Edit Form (inline) ── */}
        {editing && (
          <div className="bg-white border border-[#335293] rounded-xl p-4 sm:p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 text-gray-900">Edit Profile</h3>
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">Full Name</label>
                <input name="name" type="text" required value={form.name} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none font-[inherit] focus:border-[#335293] bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">Bio</label>
                <textarea name="bio" rows={3} value={form.bio} onChange={handleChange}
                  placeholder="Tell others about yourself, your interests, and what you're looking for…"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none resize-y font-[inherit] focus:border-[#335293] bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              {/* Tag input */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">Tags</label>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {selectedTags.map(t => (
                      <span key={t.id} className="inline-flex items-center gap-1 bg-[#335293]/10 text-[#335293] border border-[#335293]/20 px-3 py-1 rounded-full text-sm font-semibold">
                        #{t.name}
                        <button
                          type="button"
                          onClick={() => removeTag(t.id)}
                          className="ml-0.5 text-[#335293]/50 hover:text-[#335293] leading-none text-base cursor-pointer border-none bg-transparent p-0"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative" ref={tagWrapRef}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => handleTagInput(e.target.value)}
                    onFocus={() => tagInput.trim() && setShowDropdown(true)}
                    placeholder="Type to search or create a tag…"
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none font-[inherit] focus:border-[#335293] bg-white text-gray-900 placeholder-gray-400"
                  />
                  {showDropdown && (suggestions.length > 0 || (tagInput.trim() && !exactMatch)) && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {suggestions.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={() => selectTag(s)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 border-none bg-transparent cursor-pointer"
                        >
                          <span className="text-[#335293] font-semibold">#{s.name}</span>
                        </button>
                      ))}
                      {tagInput.trim() && !exactMatch && (
                        alreadyAdded ? (
                          <div className="px-4 py-2.5 text-sm text-gray-400 flex items-center gap-1.5 border-t border-gray-100">
                            <span className="text-[#335293] font-semibold">#{tagInput.trim()}</span> is already in your tags
                          </div>
                        ) : (
                          <button
                            type="button"
                            onMouseDown={() => createTag(tagInput.trim())}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#335293] font-semibold hover:bg-[#335293]/5 flex items-center gap-1.5 border-t border-gray-100 border-x-0 border-b-0 bg-transparent cursor-pointer"
                          >
                            + Create <span className="font-bold">#{tagInput.trim()}</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-200 bg-transparent text-gray-500 py-3 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-[2] bg-[#335293] text-white border-0 py-3 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60 hover:bg-[#2a4278] transition-colors">
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Two-column body (view mode) ── */}
        {!editing && (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

            {/* Left column */}
            <div className="flex-1 flex flex-col gap-6 lg:gap-8 min-w-0 w-full">

              {/* About Me */}
              {currentUser.bio ? (
                <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">About Me</h3>
                  <p className="text-gray-900 text-base leading-relaxed">{currentUser.bio}</p>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-5 sm:p-8 text-center">
                  <p className="text-gray-500 text-sm mb-3">No bio yet. Tell the community about yourself.</p>
                  <button onClick={() => setEditing(true)}
                    className="bg-[#335293] text-white border-0 px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#2a4278] transition-colors">
                    Add Bio
                  </button>
                </div>
              )}

              {/* My Tags */}
              {selectedTags.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">My Tags</h3>
                    <button onClick={() => setEditing(true)}
                      className="bg-transparent border border-gray-200 rounded-md text-gray-900 px-3 py-1.5 text-xs font-semibold cursor-pointer flex items-center gap-1 hover:bg-gray-50 transition-colors">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage Tags
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                    Your tags dictate how recruiters, study groups, and peers discover you in the network.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(t => (
                      <span key={t.id} className="bg-[#335293]/10 text-[#335293] border border-[#335293]/20 px-4 py-1.5 rounded-full text-sm font-semibold">
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-5 sm:p-8 text-center">
                  <p className="text-gray-500 text-sm mb-3">No tags yet. Tags help people find you.</p>
                  <button onClick={() => setEditing(true)}
                    className="bg-[#335293] text-white border-0 px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#2a4278] transition-colors">
                    Add Tags
                  </button>
                </div>
              )}

              {/* Recent Activity Planner */}
              {milestones.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Recent Activity Planner</h3>
                    <Link href="/roadmap" className="text-sm text-[#335293] font-medium no-underline hover:underline">View Roadmap →</Link>
                  </div>
                  <div className="flex flex-col gap-6">
                    {milestones.map((item, i) => (
                      <div key={item.id} className="flex gap-4 relative">
                        {i !== milestones.length - 1 && (
                          <div className="absolute top-[30px] left-[19px] w-0.5 h-[calc(100%-10px)] bg-gray-200" />
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          item.is_completed ? 'bg-green-100' : 'bg-[#335293]/10'
                        }`}>
                          {item.is_completed
                            ? <Target size={18} className="text-green-500" />
                            : <Activity size={18} className="text-[#335293]" />
                          }
                        </div>
                        <div className="pt-1.5">
                          <p className="text-gray-900 font-semibold text-sm mb-0.5">{item.title}</p>
                          <span className="text-gray-500 text-xs">{timeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right rail */}
            <aside className="w-full lg:w-[300px] lg:shrink-0 flex flex-col gap-6 lg:gap-8">

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-bold mb-5 text-gray-900">Impact Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
                    <div className="text-[1.8rem] font-extrabold text-[#335293] mb-0.5">
                      {currentUser.connections_count ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Connections</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
                    <div className="text-[1.8rem] font-extrabold text-[#335293] mb-0.5">
                      {currentUser.networks_count ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Networks</div>
                  </div>
                </div>
                <div className="mt-4 bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-gray-900 font-semibold text-sm">
                    <Eye size={18} className="text-gray-500" /> Profile Views
                  </div>
                  <span className="font-extrabold text-lg text-gray-900">{currentUser.profile_views ?? 0}</span>
                </div>
              </div>

              <div className="bg-[#335293] text-white rounded-xl p-6">
                <h3 className="text-base font-bold mb-2">Expand your reach</h3>
                <p className="text-sm leading-relaxed opacity-90 mb-5">
                  Users with 10+ tags receive 40% more study group invites.
                </p>
                <button onClick={() => setEditing(true)}
                  className="w-full py-2.5 bg-white text-[#335293] border-0 rounded-md font-bold cursor-pointer text-sm hover:bg-gray-100 transition-colors">
                  Add Tags
                </button>
              </div>

            </aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}
