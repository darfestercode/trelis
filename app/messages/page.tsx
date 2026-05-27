'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { useUser } from '@/app/components/UserContext'
import { Message, Conversation, User } from '@/types'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    if (!authLoading && !currentUser) router.push('/login')
  }, [authLoading, currentUser, router])

  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/messages')
    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  const fetchMessages = useCallback(async (userId: number) => {
    setLoadingMessages(true)
    const res = await fetch(`/api/messages/${userId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages ?? [])
    }
    setLoadingMessages(false)
  }, [])

  // Only fetch messages when the selected conversation actually changes
  useEffect(() => {
    if (selectedUserId) fetchMessages(selectedUserId)
  }, [selectedUserId, fetchMessages])

  // Update displayed name whenever conversations list refreshes — never triggers fetchMessages
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserId || sending || !currentUser) return

    const text = newMessage.trim()
    setNewMessage('') // Clear input immediately

    // Optimistic update — message appears instantly
    const tempId = Date.now()
    const optimistic: Message = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: selectedUserId,
      message_text: text,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: selectedUserId, message_text: text }),
      })
      if (res.ok) {
        const data = await res.json()
        // Swap optimistic entry for the real message — no loading flash
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m))
        // Silently refresh conversations sidebar (no loading state)
        fetchConversations()
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setNewMessage(text)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(text)
    } finally {
      setSending(false)
    }
  }

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
      <div className="flex h-full overflow-hidden">
        {/* Inbox sidebar */}
        <div className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col">
          {/* Fixed-height header */}
          <div className="relative border-b border-gray-200 overflow-hidden" style={{ height: '56px' }}>

            {/* "Messages" + "+ New" */}
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

            {/* Search bar */}
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
                className="shrink-0 mr-3 text-gray-400 hover:text-gray-200 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

          </div>

          {/* Search results */}
          {showSearch && searchResults.length > 0 && (
            <div className="px-2 py-2 border-b border-gray-200 space-y-0.5">
              {searchResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    selectConversation(u.id, u.name)
                    setShowSearch(false)
                    setSearchUser('')
                    setSearchResults([])
                  }}
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

        {/* Thread */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
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
              <div className="px-5 h-[56px] border-b border-gray-200 flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {selectedUserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedUserName}</p>
                  <p className="text-xs text-gray-400">Student</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
                          isMine
                            ? 'bg-[#1e3a5f] text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          <p>{msg.message_text}</p>
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

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-200 flex gap-3 shrink-0">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#f0f2f5] dark:bg-[#0f172a] animate-pulse" />}>
      <MessagesContent />
    </Suspense>
  )
}
