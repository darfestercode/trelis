'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NetworksPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [networks, setNetworks] = useState<Network[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { router.push('/login'); return }
      setCurrentUser(d.user)
    })
    fetch('/api/networks').then(r => r.json()).then(d => {
      setNetworks(d.networks ?? [])
      setLoading(false)
    })
  }, [router])

  async function handleJoin(e: React.MouseEvent, networkId: number) {
    e.stopPropagation() // don't navigate to detail page
    if (joiningId) return
    setJoiningId(networkId)
    await fetch(`/api/networks/${networkId}`, { method: 'POST' })
    const data = await fetch('/api/networks').then(r => r.json())
    setNetworks(data.networks ?? [])
    setJoiningId(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || creating) return
    setCreating(true)
    const res = await fetch('/api/networks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await fetch('/api/networks').then(r => r.json())
      setNetworks(data.networks ?? [])
      setForm({ name: '', description: '' })
      setShowForm(false)
    }
    setCreating(false)
  }

  const myNetworks = networks.filter(n => n.is_member)
  const otherNetworks = networks.filter(n => !n.is_member)

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Networks</h1>
            <p className="text-sm text-gray-500 mt-1">Manage the project networks you have built or joined.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#1e3a5f] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#162d4a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Network
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">New Project Network</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                placeholder="Network name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="bg-[#1e3a5f] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#162d4a] disabled:opacity-60">
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-4">Project networks you have built or joined.</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-gray-200" />)}
          </div>
        ) : myNetworks.length === 0 ? (
          <div className="bg-white rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-600 font-semibold text-sm">No networks yet</p>
            <p className="text-red-500 text-xs mt-1">
              Create your first network using the button above, or join one in the Discover page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myNetworks.map(n => (
              <div
                key={n.id}
                onClick={() => router.push(`/networks/${n.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-[#1e3a5f]/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {n.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{n.name}</h3>
                    {n.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {n.member_count} member{Number(n.member_count) !== 1 ? 's' : ''} · created by {n.creator_name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {otherNetworks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Open Networks to Join</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherNetworks.map(n => (
                <div
                  key={n.id}
                  onClick={() => router.push(`/networks/${n.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-[#1e3a5f]/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center text-[#1e3a5f] font-bold text-sm shrink-0">
                      {n.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{n.name}</h3>
                      {n.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {n.member_count} member{Number(n.member_count) !== 1 ? 's' : ''} · by {n.creator_name}
                      </p>
                    </div>
                    <button
                      onClick={e => handleJoin(e, n.id)}
                      disabled={joiningId === n.id}
                      className="shrink-0 bg-[#1e3a5f] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#162d4a] disabled:opacity-60 transition-colors"
                    >
                      {joiningId === n.id ? '…' : 'Join'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
