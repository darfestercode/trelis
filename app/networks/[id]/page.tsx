'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { P, PERM_KEYS, PERM_INFO, type PermKey } from '@/lib/permissions'

interface Member { id: number; name: string; email: string; role: string }
interface NetworkDetail {
  id: number; name: string; description: string | null
  creator_name: string; creator_id: number
  member_count: number; is_member: boolean; created_at: string
}
interface Channel { id: number; name: string; created_at: string }
interface Message { id: number; content: string; created_at: string; user_id: number; user_name: string }
interface PermOverride { role_id: number; role_name: string; color: string; is_everyone: boolean; allow: number; deny: number }
interface Role { id: number; name: string; color: string; is_everyone: boolean; position: number }

// 0 = inherit, 1 = allow, 2 = deny
type OverrideState = 0 | 1 | 2

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === now.toDateString()
    ? `Today at ${time}`
    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`
}

export default function NetworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [network, setNetwork] = useState<NetworkDetail | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null)
  const [userPermissions, setUserPermissions] = useState(0)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [addingChannel, setAddingChannel] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [channelError, setChannelError] = useState<string | null>(null)

  // Channel permissions modal
  const [permModal, setPermModal] = useState<Channel | null>(null)
  const [permOverrides, setPermOverrides] = useState<PermOverride[]>([])
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [pendingOverrides, setPendingOverrides] = useState<Record<number, { allow: number; deny: number }>>({})
  const [savingPerms, setSavingPerms] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldScrollRef = useRef(true)

  const activeChannel = channels.find(c => c.id === activeChannelId) ?? null

  const canManageChannels = (userPermissions & P.ADMINISTRATOR) !== 0 || (userPermissions & P.MANAGE_CHANNELS) !== 0
  const canManageNetwork = (userPermissions & P.ADMINISTRATOR) !== 0 || (userPermissions & P.MANAGE_NETWORK) !== 0 || (userPermissions & P.MANAGE_ROLES) !== 0

  async function loadNetwork() {
    const res = await fetch(`/api/networks/${id}`)
    if (res.status === 404) { router.push('/networks'); return }
    if (!res.ok) return
    const data = await res.json()
    setNetwork(data.network)
    setMembers(data.members)
    setUserPermissions(data.userPermissions ?? 0)
  }

  async function loadChannels() {
    const res = await fetch(`/api/networks/${id}/channels`)
    if (!res.ok) return
    const data = await res.json()
    const chs: Channel[] = data.channels ?? []
    setChannels(chs)
    if (chs.length > 0) setActiveChannelId(prev => prev ?? chs[0].id)
  }

  const loadMessages = useCallback(async (channelId: number) => {
    const res = await fetch(`/api/networks/${id}/channels/${channelId}/messages`)
    if (!res.ok) return
    const data = await res.json()
    setMessages(data.messages ?? [])
  }, [id])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { router.push('/login'); return }
      setCurrentUser(d.user)
    })
    Promise.all([loadNetwork(), loadChannels()]).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!activeChannelId) return
    shouldScrollRef.current = true
    setMessages([])
    loadMessages(activeChannelId)
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') loadMessages(activeChannelId)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeChannelId, loadMessages])

  useEffect(() => {
    if (shouldScrollRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
    }
  }, [messages])

  function handleScroll() {
    const c = containerRef.current
    if (!c) return
    shouldScrollRef.current = c.scrollHeight - c.scrollTop - c.clientHeight < 120
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending || !activeChannelId) return
    setSending(true)
    shouldScrollRef.current = true
    const res = await fetch(`/api/networks/${id}/channels/${activeChannelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    })
    if (res.ok) {
      setInput('')
      await loadMessages(activeChannelId)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function handleAddChannel(e: React.FormEvent) {
    e.preventDefault()
    if (!newChannelName.trim() || addingChannel) return
    setAddingChannel(true)
    setChannelError(null)
    try {
      const res = await fetch(`/api/networks/${id}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChannelName }),
      })
      if (res.ok) {
        const data = await res.json()
        setChannels(prev => [...prev, data.channel])
        setActiveChannelId(data.channel.id)
        setNewChannelName('')
        setShowAddChannel(false)
      } else {
        const data = await res.json().catch(() => ({}))
        setChannelError(data.error ?? `Error ${res.status}`)
      }
    } catch {
      setChannelError('Network error — please try again')
    }
    setAddingChannel(false)
  }

  async function handleJoinLeave() {
    if (!network || toggling) return
    setToggling(true)
    const res = await fetch(`/api/networks/${id}`, { method: 'POST' })
    if (res.ok) await loadNetwork()
    setToggling(false)
  }

  // Open channel permissions modal
  async function openPermModal(ch: Channel) {
    setPermModal(ch)
    setPendingOverrides({})
    const [overridesRes, rolesRes] = await Promise.all([
      fetch(`/api/networks/${id}/channels/${ch.id}/permissions`),
      fetch(`/api/networks/${id}/roles`),
    ])
    const overridesData = await overridesRes.json()
    const rolesData = await rolesRes.json()

    const overrides: PermOverride[] = overridesData.overrides ?? []
    const roles: Role[] = rolesData.roles ?? []
    setPermOverrides(overrides)
    setAllRoles(roles)

    // Build pending state from existing overrides
    const pending: Record<number, { allow: number; deny: number }> = {}
    for (const ov of overrides) {
      pending[ov.role_id] = { allow: Number(ov.allow), deny: Number(ov.deny) }
    }
    // Ensure all roles have an entry
    for (const r of roles) {
      if (!pending[r.id]) pending[r.id] = { allow: 0, deny: 0 }
    }
    setPendingOverrides(pending)
  }

  function getPermState(roleId: number, flag: number): OverrideState {
    const ov = pendingOverrides[roleId]
    if (!ov) return 0
    if (ov.allow & flag) return 1
    if (ov.deny & flag) return 2
    return 0
  }

  function cyclePermState(roleId: number, flag: number) {
    const current = getPermState(roleId, flag)
    const next: OverrideState = current === 0 ? 1 : current === 1 ? 2 : 0
    setPendingOverrides(prev => {
      const existing = prev[roleId] ?? { allow: 0, deny: 0 }
      let { allow, deny } = existing
      allow &= ~flag; deny &= ~flag
      if (next === 1) allow |= flag
      if (next === 2) deny |= flag
      return { ...prev, [roleId]: { allow, deny } }
    })
  }

  async function saveChannelPerms() {
    if (!permModal || savingPerms) return
    setSavingPerms(true)
    await Promise.all(
      Object.entries(pendingOverrides).map(([roleId, { allow, deny }]) =>
        fetch(`/api/networks/${id}/channels/${permModal.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: parseInt(roleId), allow, deny }),
        })
      )
    )
    setSavingPerms(false)
    setPermModal(null)
    await loadChannels()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (!network) return null

  const isCreator = currentUser?.id === Number(network.creator_id)

  return (
    <AppShell raw>
      <div className="flex h-full relative">

        {/* ── Channel sidebar ── */}
        <div className="w-60 bg-[#1a2540] flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-white/10">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button
                  onClick={() => router.push('/networks')}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs mb-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  All Networks
                </button>
                <h2 className="font-bold text-white text-sm leading-tight truncate">{network.name}</h2>
              </div>
              {canManageNetwork && (
                <button
                  onClick={() => router.push(`/networks/${id}/settings`)}
                  title="Server Settings"
                  className="text-gray-400 hover:text-white transition-colors shrink-0 mt-5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 min-h-0">
            <div className="px-2 mb-2">
              <div className="flex items-center justify-between px-2 py-1 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Channels</span>
                {canManageChannels && (
                  <button onClick={() => setShowAddChannel(v => !v)} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>

              {channels.map(ch => (
                <div
                  key={ch.id}
                  className={`group flex items-center rounded transition-colors ${
                    activeChannelId === ch.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <button
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`flex-1 text-left flex items-center gap-1.5 px-2 py-1.5 text-sm transition-colors ${
                      activeChannelId === ch.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                    }`}
                  >
                    <span className="text-gray-500 text-base leading-none">#</span>
                    <span className="truncate">{ch.name}</span>
                  </button>
                  {canManageChannels && (
                    <button
                      onClick={() => openPermModal(ch)}
                      title="Channel permissions"
                      className="opacity-0 group-hover:opacity-100 px-2 text-gray-400 hover:text-white transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {showAddChannel && (
                <form onSubmit={handleAddChannel} className="mt-2 px-1">
                  <input
                    autoFocus
                    value={newChannelName}
                    onChange={e => { setNewChannelName(e.target.value); setChannelError(null) }}
                    placeholder="channel-name"
                    className="w-full bg-white/10 text-white text-xs placeholder-gray-500 px-2.5 py-1.5 rounded outline-none focus:ring-1 focus:ring-white/20"
                  />
                  {channelError && (
                    <p className="text-red-400 text-xs mt-1 px-0.5">{channelError}</p>
                  )}
                  <div className="flex gap-1.5 mt-1.5">
                    <button type="submit" disabled={addingChannel}
                      className="flex-1 bg-[#1e3a5f] text-white text-xs py-1 rounded hover:bg-[#162d4a] disabled:opacity-60 transition-colors">
                      {addingChannel ? '…' : 'Add'}
                    </button>
                    <button type="button" onClick={() => { setShowAddChannel(false); setNewChannelName(''); setChannelError(null) }}
                      className="flex-1 text-gray-400 text-xs py-1 rounded hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="px-2 mt-4">
              <div className="px-2 py-1 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Members — {Number(network.member_count)}
                </span>
              </div>
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 truncate flex-1">{m.name}</span>
                  {m.role === 'creator' && (
                    <svg className="w-3 h-3 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!isCreator && (
            <div className="px-3 py-3 border-t border-white/10">
              <button
                onClick={handleJoinLeave}
                disabled={toggling}
                className={`w-full text-xs font-medium py-2 rounded transition-colors disabled:opacity-60 ${
                  network.is_member
                    ? 'border border-white/20 text-gray-400 hover:bg-white/5'
                    : 'bg-[#1e3a5f] text-white hover:bg-[#162d4a]'
                }`}
              >
                {toggling ? '…' : network.is_member ? 'Leave Network' : 'Join Network'}
              </button>
            </div>
          )}
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
          {activeChannel ? (
            <>
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 shrink-0">
                <span className="text-gray-400 text-lg font-light">#</span>
                <span className="font-semibold text-gray-800">{activeChannel.name}</span>
              </div>

              <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <span className="text-gray-400 text-xl">#</span>
                    </div>
                    <p className="font-semibold text-gray-700">Welcome to #{activeChannel.name}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {network.is_member ? 'Be the first to post something.' : 'Join the network to start chatting.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const prev = messages[i - 1]
                      const sameUser = prev?.user_id === msg.user_id
                      const timeDiff = prev ? new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() : Infinity
                      const grouped = sameUser && timeDiff < 5 * 60 * 1000
                      return (
                        <div key={msg.id} className={`flex gap-3 group ${grouped ? 'mt-0.5' : 'mt-5'}`}>
                          <div className="w-9 shrink-0 pt-0.5">
                            {!grouped ? (
                              <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-semibold">
                                {msg.user_name.charAt(0).toUpperCase()}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 text-right block leading-[36px]">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {!grouped && (
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="font-semibold text-gray-900 text-sm">{msg.user_name}</span>
                                <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                              </div>
                            )}
                            <p className="text-sm text-gray-700 leading-relaxed break-words">{msg.content}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {network.is_member ? (
                <div className="px-5 py-3.5 border-t border-gray-100 shrink-0">
                  <form onSubmit={handleSend}>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={`Message #${activeChannel.name}`}
                        className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
                      />
                      <button type="submit" disabled={!input.trim() || sending}
                        className="text-[#1e3a5f] hover:text-[#162d4a] disabled:text-gray-300 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 shrink-0 text-center">
                  <p className="text-sm text-gray-500">
                    <button onClick={handleJoinLeave} disabled={toggling}
                      className="font-semibold text-[#1e3a5f] hover:underline disabled:opacity-60">
                      Join this network
                    </button>{' '}to send messages.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p className="text-sm">Select a channel to get started</p>
            </div>
          )}
        </div>

        {/* ── Channel Permissions Modal ── */}
        {permModal && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-gray-900">Channel Permissions</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="text-gray-400">#</span>{permModal.name}
                    {' — '}Control what each role can do in this channel.
                  </p>
                </div>
                <button onClick={() => setPermModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-auto min-h-0">
                <p className="text-xs text-gray-400 px-6 pt-4 pb-2">
                  Click a cell to cycle: <span className="text-green-500 font-medium">✓ Allow</span> → <span className="text-red-500 font-medium">✕ Deny</span> → <span className="text-gray-400">— Inherit</span>
                </p>

                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Role</th>
                      {PERM_KEYS.map(k => (
                        <th key={k} className="px-2 py-2.5 text-center">
                          <span className="text-xs text-gray-400 font-medium writing-mode-vertical" title={PERM_INFO[k].desc}>
                            {PERM_INFO[k].label.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allRoles.map(role => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                            <span className="font-medium text-gray-700 text-xs truncate">{role.name}</span>
                          </div>
                        </td>
                        {PERM_KEYS.map(key => {
                          const flag = P[key as PermKey]
                          const state = getPermState(role.id, flag)
                          return (
                            <td key={key} className="px-2 py-3 text-center">
                              <button
                                onClick={() => cyclePermState(role.id, flag)}
                                className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center text-sm font-bold transition-colors"
                                style={{
                                  backgroundColor: state === 1 ? '#dcfce7' : state === 2 ? '#fee2e2' : '#f3f4f6',
                                  color: state === 1 ? '#16a34a' : state === 2 ? '#dc2626' : '#9ca3af',
                                }}
                              >
                                {state === 1 ? '✓' : state === 2 ? '✕' : '—'}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button onClick={() => setPermModal(null)}
                  className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={saveChannelPerms} disabled={savingPerms}
                  className="bg-[#1e3a5f] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#162d4a] disabled:opacity-60 transition-colors">
                  {savingPerms ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
