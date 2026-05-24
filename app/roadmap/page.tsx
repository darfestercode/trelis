'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'

interface Milestone {
  id: number
  title: string
  description: string | null
  is_completed: boolean
  completed_at: string | null
  created_at: string
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

export default function RoadmapPage() {
  const router = useRouter()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { router.push('/login'); return }
    })
    loadMilestones()
  }, [router])

  async function loadMilestones() {
    const data = await fetch('/api/milestones').then(r => r.json())
    setMilestones(data.milestones ?? [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || saving) return
    setSaving(true)
    const res = await fetch('/api/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ title: '', description: '' })
      setShowForm(false)
      await loadMilestones()
    }
    setSaving(false)
  }

  async function toggleComplete(m: Milestone) {
    await fetch('/api/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestone_id: m.id, is_completed: !m.is_completed }),
    })
    setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, is_completed: !x.is_completed } : x))
  }

  const total = milestones.length
  const completed = milestones.filter(m => m.is_completed).length
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <AppShell goalProgress={progress}>
      <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
                  <circle cx="12" cy="12" r="6" strokeWidth={1.8} />
                  <circle cx="12" cy="12" r="2" strokeWidth={1.8} />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Academic Roadmap</h1>
                <p className="text-sm text-gray-500">Log your progress and achieve goals transparently.</p>
              </div>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-[#1e3a5f] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#162d4a] transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Milestone
            </button>

            {showForm && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
                <form onSubmit={handleAdd} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Milestone title (e.g. Finish Data Structures)"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 bg-white"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 bg-white"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-white">Cancel</button>
                    <button type="submit" disabled={saving} className="bg-[#1e3a5f] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#162d4a] disabled:opacity-60">
                      {saving ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : milestones.length === 0 ? (
              <div className="border border-red-200 bg-red-50 rounded-xl p-5">
                <p className="text-red-600 font-semibold text-sm">No milestones yet</p>
                <p className="text-red-500 text-xs mt-1">Add your first milestone to start tracking your academic progress.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {milestones.map(m => (
                    <div key={m.id} className="flex gap-4 items-start">
                      <button
                        onClick={() => toggleComplete(m)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 relative z-10 transition-colors ${
                          m.is_completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-gray-300 hover:border-[#1e3a5f]'
                        }`}
                      >
                        {m.is_completed && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${m.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {m.title}
                          </p>
                          <span className="text-xs text-gray-400 shrink-0">{timeAgo(m.created_at)}</span>
                        </div>
                        {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: Analytics */}
        <div className="w-64 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Roadmap Analytics</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-4">
              <p className="text-4xl font-bold text-[#1e3a5f]">{progress}%</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Overall Progress</p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-[#1e3a5f] h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Logging your progress publicly increases your study group connection rate by 45%. Keep pushing!
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Completed Milestones</span>
              <span className="text-sm font-semibold text-gray-900">{completed}/{total}</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
