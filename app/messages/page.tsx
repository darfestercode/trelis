'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { useUser } from '@/app/components/UserContext'
import { Message, Conversation, User } from '@/types'

// ─── Attachment renderer ───────────────────────────────────────────────────
function Attachment({ msg, isMine }: { msg: Message; isMine: boolean }) {
  // Code snippets store their content in attachment_name — no URL needed
  if (msg.attachment_type === 'code') {
    return (
      <pre className={`mt-1 text-xs rounded-xl p-3 overflow-x-auto max-w-sm font-mono whitespace-pre-wrap ${
        isMine ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'
      }`}>
        {msg.attachment_name}
      </pre>
    )
  }

  if (!msg.attachment_url) return null

  if (msg.attachment_type === 'image') {
    return (
      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={msg.attachment_url}
          alt={msg.attachment_name ?? 'image'}
          className="max-w-[260px] rounded-xl mt-1 cursor-pointer hover:opacity-90 transition-opacity"
        />
      </a>
    )
  }

  if (msg.attachment_type === 'video') {
    return (
      <video
        src={msg.attachment_url}
        controls
        className="max-w-[280px] rounded-xl mt-1"
      />
    )
  }

  // Generic file
  return (
    <a
      href={msg.attachment_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-1 flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
        isMine ? 'bg-white/15 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
      } transition-colors`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="truncate max-w-[180px]">{msg.attachment_name ?? 'File'}</span>
    </a>
  )
}

// ─── Code snippet modal ────────────────────────────────────────────────────
function CodeModal({ onSend, onClose }: { onSend: (code: string) => void; onClose: () => void }) {
  const [code, setCode] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">Send Code Snippet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-4">
          <textarea
            autoFocus
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Paste your code here…"
            rows={12}
            className="w-full font-mono text-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
          />
        </div>
        <div className="px-4 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
          <button
            disabled={!code.trim()}
            onClick={() => { if (code.trim()) { onSend(code.trim()); onClose() } }}
            className="bg-[#1e3a5f] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#162d4a] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const withUserId = searchParams.get('with')

  const { user: currentUser, loading: authLoading } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    withUserId ? parseInt(withUserId) : null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastMessageTimeRef = useRef<string | null>(null)
  const selectedUserIdRef = useRef<number | null>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') =>
    messagesEndRef.current?.scrollIntoView({ behavior })

  useEffect(() => {
    if (!authLoading && !currentUser) router.push('/login')
  }, [authLoading, currentUser, router])

  // Keep ref in sync for use inside polling interval
  useEffect(() => { selectedUserIdRef.current = selectedUserId }, [selectedUserId])

  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/messages')
    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  const fetchMessages = useCallback(async (userId: number, silent = false) => {
    if (!silent) setLoadingMessages(true)
    const res = await fetch(`/api/messages/${userId}`)
    if (res.ok) {
      const data = await res.json()
      const msgs: Message[] = data.messages ?? []
      setMessages(msgs)
      if (msgs.length > 0) lastMessageTimeRef.current = msgs[msgs.length - 1].created_at
    }
    if (!silent) setLoadingMessages(false)
  }, [])

  // Poll for new messages every 5 s — pause when tab is hidden
  useEffect(() => {
    if (!selectedUserId) return

    const poll = async () => {
      // Skip if tab is not visible (saves bandwidth when user switches tabs)
      if (document.visibilityState === 'hidden') return
      const uid = selectedUserIdRef.current
      if (!uid) return
      const url = lastMessageTimeRef.current
        ? `/api/messages/${uid}?after=${encodeURIComponent(lastMessageTimeRef.current)}`
        : `/api/messages/${uid}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const newMsgs: Message[] = data.messages ?? []
      if (newMsgs.length === 0) return
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const truly_new = newMsgs.filter(m => !existingIds.has(m.id))
        if (truly_new.length === 0) return prev
        const merged = [...prev, ...truly_new]
        lastMessageTimeRef.current = merged[merged.length - 1].created_at
        return merged
      })
      fetchConversations()
    }

    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [selectedUserId, fetchConversations])

  // Only fetch messages when switching conversations
  useEffect(() => {
    if (selectedUserId) {
      lastMessageTimeRef.current = null
      fetchMessages(selectedUserId)
    }
  }, [selectedUserId, fetchMessages])

  // Update name from conversations list without re-fetching messages
  useEffect(() => {
    if (!selectedUserId || conversations.length === 0) return
    const conv = conversations.find(c => c.other_user_id === selectedUserId)
    if (conv) setSelectedUserName(conv.other_user_name)
  }, [selectedUserId, conversations])

  useEffect(() => {
    if (withUserId && conversations.length > 0) {
      const id = parseInt(withUserId)
      const conv = conversations.find(c => c.other_user_id === id)
      if (conv) setSelectedUserName(conv.other_user_name)
    }
  }, [withUserId, conversations])

  useEffect(() => { scrollToBottom() }, [messages])

  // ─── Send text message ────────────────────────────────────────────────
  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserId || sending || !currentUser) return
    await sendMessage({ message_text: newMessage.trim() })
    setNewMessage('')
  }

  async function sendMessage(payload: {
    message_text?: string
    attachment_url?: string
    attachment_type?: string
    attachment_name?: string
  }) {
    if (!selectedUserId || !currentUser) return

    const tempId = Date.now()
    const optimistic: Message = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: selectedUserId,
      message_text: payload.message_text ?? null,
      attachment_url: payload.attachment_url ?? null,
      attachment_type: (payload.attachment_type as Message['attachment_type']) ?? null,
      attachment_name: payload.attachment_name ?? null,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: selectedUserId, ...payload }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m))
        lastMessageTimeRef.current = data.message.created_at
        fetchConversations()
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        if (payload.message_text) setNewMessage(payload.message_text)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      if (payload.message_text) setNewMessage(payload.message_text)
    } finally {
      setSending(false)
    }
  }

  // ─── File upload ──────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedUserId) return
    e.target.value = ''

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url, type, name } = await res.json()
      await sendMessage({ attachment_url: url, attachment_type: type, attachment_name: name })
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // ─── Code snippet ─────────────────────────────────────────────────────
  async function handleCodeSend(code: string) {
    await sendMessage({
      attachment_type: 'code',
      attachment_name: code,
      message_text: undefined,
    })
  }

  // ─── User search ──────────────────────────────────────────────────────
  async function handleUserSearch(q: string) {
    setSearchUser(q)
    if (q.length < 2) { setSearchResults([]); return }
    const res = await fetch(`/api/users?search=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setSearchResults((data.users ?? []).filter((u: User) => u.id !== currentUser?.id).slice(0, 6))
    }
  }

  function selectConversation(userId: number, name: string) {
    setSelectedUserId(userId)
    setSelectedUserName(name)
    router.replace(`/messages?with=${userId}`, { scroll: false })
  }

  function formatTime(ts: string) {
    const d = new Date(ts)
    const now = new Date()
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <AppShell raw>
      {showCodeModal && (
        <CodeModal onSend={handleCodeSend} onClose={() => setShowCodeModal(false)} />
      )}

      <div className="flex h-full overflow-hidden">
        {/* ── Inbox sidebar ─────────────────────────────────────── */}
        <div className={`w-full md:w-72 md:shrink-0 bg-white border-r border-gray-200 flex-col ${
          selectedUserId ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="relative border-b border-gray-200 overflow-hidden" style={{ height: '56px' }}>
            <div
              className="absolute inset-0 flex items-center justify-between px-4"
              style={{
                opacity: showSearch ? 0 : 1,
                transform: showSearch ? 'translateX(8px)' : 'translateX(0)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                pointerEvents: showSearch ? 'none' : 'auto',
              }}
            >
              <h2 className="font-bold text-gray-900 text-sm">Messages</h2>
              <button
                onClick={() => setShowSearch(true)}
                className="text-xs font-semibold bg-[#1e3a5f] text-white px-3 py-1.5 rounded-lg hover:bg-[#162d4a] transition-colors"
              >
                + New
              </button>
            </div>

            <div
              className="absolute inset-x-3 inset-y-2 flex items-center gap-2 rounded-xl border border-[#334155]"
              style={{
                opacity: showSearch ? 1 : 0,
                transform: showSearch ? 'translateX(0)' : 'translateX(8px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                pointerEvents: showSearch ? 'auto' : 'none',
              }}
            >
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search students…"
                value={searchUser}
                onChange={e => handleUserSearch(e.target.value)}
                autoFocus={showSearch}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
              <button
                onClick={() => { setShowSearch(false); setSearchUser(''); setSearchResults([]) }}
                className="shrink-0 mr-3 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {showSearch && searchResults.length > 0 && (
            <div className="px-2 py-2 border-b border-gray-200 space-y-0.5">
              {searchResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => { selectConversation(u.id, u.name); setShowSearch(false); setSearchUser(''); setSearchResults([]) }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 text-sm transition-colors"
                >
                  <p className="font-medium text-gray-900">{u.name}</p>
                  {u.university && <p className="text-xs text-gray-400">{u.university}</p>}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-8 px-4">No conversations yet. Start one with &quot;+ New&quot;.</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.other_user_id}
                  onClick={() => selectConversation(conv.other_user_id, conv.other_user_name)}
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedUserId === conv.other_user_id ? 'bg-[#1e3a5f]/5 border-l-2 border-l-[#1e3a5f]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {conv.other_user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-xs truncate">{conv.other_user_name}</p>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">{formatTime(conv.latest_time)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.latest_message}</p>
                    </div>
                    {Number(conv.unread_count) > 0 && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Thread ────────────────────────────────────────────── */}
        <div className={`flex-1 flex-col bg-white overflow-hidden ${
          selectedUserId ? 'flex' : 'hidden md:flex'
        }`}>
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm font-medium text-gray-500">Select a conversation</p>
                <p className="text-xs mt-1 text-gray-400">or start a new one with &ldquo;+ New&rdquo;</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-3 sm:px-5 h-[56px] border-b border-gray-200 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  aria-label="Back to inbox"
                  onClick={() => setSelectedUserId(null)}
                  className="md:hidden p-1 -ml-1 text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {selectedUserName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{selectedUserName}</p>
                  <p className="text-xs text-gray-400">Student</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                        <div className="h-10 w-48 bg-gray-100 rounded-2xl animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No messages yet. Send the first one!</p>
                ) : (
                  messages.map((msg: Message) => {
                    const isMine = msg.sender_id === currentUser?.id
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                          isMine ? 'bg-[#1e3a5f] text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          {msg.message_text && <p>{msg.message_text}</p>}
                          <Attachment msg={msg} isMine={isMine} />
                          <p className={`text-xs mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-gray-200 shrink-0">
                {/* Attachment buttons */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Send image or file"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >
                    {uploading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCodeModal(true)}
                    title="Send code snippet"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!newMessage.trim() && !uploading)}
                    className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#f0f2f5] animate-pulse" />}>
      <MessagesContent />
    </Suspense>
  )
}
