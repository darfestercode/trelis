'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { useGoalProgress } from '@/app/components/GoalProgressContext'
import { useUser } from '@/app/components/UserContext'

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
  const { user, loggedOut } = useUser()
  const { refreshProgress } = useGoalProgress()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (loggedOut) router.push('/login')
  }, [loggedOut, router])

  useEffect(() => {
    loadMilestones()
  }, [])

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
      refreshProgress()
    }
    setSaving(false)
  }

  function startEdit(m: Milestone) {
    setEditingId(m.id)
    setEditForm({ title: m.title, description: m.description ?? '' })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ title: '', description: '' })
  }

  async function handleEdit(e: React.FormEvent, id: number) {
    e.preventDefault()
    if (!editForm.title.trim() || editSaving) return
    setEditSaving(true)
    const res = await fetch(`/api/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const data = await res.json()
      setMilestones(prev => prev.map(m => m.id === id ? data.milestone : m))
      cancelEdit()
    }
    setEditSaving(false)
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE' })
    if (res.ok) { setMilestones(prev => prev.filter(m => m.id !== id)); refreshProgress() }
    setDeletingId(null)
  }

  async function toggleComplete(m: Milestone) {
    // Optimistic update — instant UI response
    const next = !m.is_completed
    setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, is_completed: next } : x))
    refreshProgress()
    // Fire API in background
    fetch('/api/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestone_id: m.id, is_completed: next }),
    }).catch(() => {
      // Revert on failure
      setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, is_completed: m.is_completed } : x))
      refreshProgress()
    })
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
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

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="relative">

                {/* Add New Milestone — top of timeline */}
                <div className="flex gap-4 items-start relative">

                  {/* Node + connector */}
                  <div className="flex flex-col items-center shrink-0 self-stretch">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-400 bg-white"
                    style={{
                      border: showForm ? '2px solid #1e3a5f' : '2px dashed #1e3a5f',
                      background: showForm ? '#1e3a5f' : undefined,
                      transform: showForm ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1)',
                    }}
                  >
                    <svg
                      className="w-4 h-4 transition-all duration-400"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ color: showForm ? 'white' : '#1e3a5f' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  {milestones.length > 0 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                  </div>

                  {/* Single morphing container */}
                  <div
                    className="flex-1 rounded-xl overflow-hidden relative mb-4"
                    style={{
                      maxHeight: showForm ? '400px' : '48px',
                      border: showForm ? '1px solid rgba(30,58,95,0.4)' : '1px dashed var(--border-light)',
                      background: showForm ? '' : 'transparent',
                      transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1), border 0.3s ease, background 0.3s ease',
                    }}
                  >
                    {/* Button label — fades out, stays in place */}
                    <div
                      className="absolute inset-0 flex items-center px-4 text-sm cursor-pointer select-none"
                      style={{
                        opacity: showForm ? 0 : 1,
                        transition: 'opacity 0.15s ease',
                        pointerEvents: showForm ? 'none' : 'auto',
                        color: 'var(--text-muted)',
                      }}
                      onClick={() => setShowForm(true)}
                    >
                      + Add new milestone…
                    </div>

                    {/* Form content — fades in on top */}
                    <form
                      onSubmit={handleAdd}
                      className="bg-gray-50 p-4 space-y-3"
                      style={{
                        opacity: showForm ? 1 : 0,
                        transition: 'opacity 0.3s ease 0.15s',
                        pointerEvents: showForm ? 'auto' : 'none',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Milestone title (e.g. Finish Data Structures)"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        required
                        autoFocus={showForm}
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
                        <button
                          type="button"
                          onClick={() => { setShowForm(false); setForm({ title: '', description: '' }) }}
                          className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="bg-[#1e3a5f] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#162d4a] disabled:opacity-60 transition-colors"
                        >
                          {saving ? 'Adding…' : 'Add'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Milestones */}
                {milestones.length === 0 ? (
                  <div className="ml-12 border border-dashed border-gray-200 rounded-xl p-5 text-center">
                    <p className="text-gray-400 text-sm">No milestones yet — add your first one above.</p>
                  </div>
                ) : (
                  milestones.map((m) => {
                    const isEditing = editingId === m.id
                    const isLast = milestones.indexOf(m) === milestones.length - 1
                    return (
                      <div key={m.id} className="flex gap-4 items-start relative">
                        {/* Circle + connector */}
                        <div className="flex flex-col items-center shrink-0 self-stretch">
                          <button
                            onClick={() => toggleComplete(m)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-colors bg-white ${
                              m.is_completed
                                ? '!bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-[#1e3a5f]'
                            }`}
                          >
                            {m.is_completed && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          {!isLast && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                        </div>

                        {/* Card — no height cap so description shows fully; cross-fades to edit form */}
                        <div
                          className={`flex-1 bg-white rounded-xl border overflow-hidden transition-all duration-300 ${isLast ? '' : 'mb-4'}`}
                          style={{ borderColor: isEditing ? 'rgba(30,58,95,0.4)' : 'var(--border-light)' }}
                        >
                          {/* View mode — fades out when editing */}
                          <div
                            className="px-4 py-3 flex items-start justify-between gap-2"
                            style={{
                              opacity: isEditing ? 0 : 1,
                              position: isEditing ? 'absolute' : 'relative',
                              pointerEvents: isEditing ? 'none' : 'auto',
                              transition: 'opacity 0.15s ease',
                              width: '100%',
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className={`font-medium text-sm ${m.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {m.title}
                              </p>
                              {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-gray-400">{timeAgo(m.created_at)}</span>
                              <button
                                onClick={() => startEdit(m)}
                                className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(m.id)}
                                disabled={deletingId === m.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                                title="Delete"
                              >
                                {deletingId === m.id ? (
                                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Edit form — fades in, hidden entirely when not editing */}
                          {isEditing && (
                          <form
                            onSubmit={e => handleEdit(e, m.id)}
                            className="p-4 space-y-3 bg-gray-50"
                          >
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                              required
                              autoFocus={isEditing}
                              placeholder="Milestone title"
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 bg-white"
                            />
                            <textarea
                              value={editForm.description}
                              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                              rows={2}
                              placeholder="Description (optional)"
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 bg-white"
                            />
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-white transition-colors">
                                Cancel
                              </button>
                              <button type="submit" disabled={editSaving} className="bg-[#1e3a5f] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#162d4a] disabled:opacity-60 transition-colors">
                                {editSaving ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </form>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
