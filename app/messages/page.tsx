'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Navbar from '@/app/components/Navbar'
import { User, Message, Conversation } from '@/types'

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const withUserId = searchParams.get('with')

  const [currentUser, setCurrentUser] = useState<User | null>(null)
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { router.push('/login'); return }
        setCurrentUser(d.user)
      })
  }, [router])

  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/messages')
    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const fetchMessages = useCallback(async (userId: number) => {
    setLoadingMessages(true)
    const res = await fetch(`/api/messages/${userId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages ?? [])
    }
    setLoadingMessages(false)
  }, [])

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId)
      const conv = conversations.find((c) => c.other_user_id === selectedUserId)
      if (conv) setSelectedUserName(conv.other_user_name)
    }
  }, [selectedUserId, fetchMessages, conversations])

  useEffect(() => {
    if (withUserId && conversations.length > 0) {
      const id = parseInt(withUserId)
      const conv = conversations.find((c) => c.other_user_id === id)
      if (conv) setSelectedUserName(conv.other_user_name)
    }
  }, [withUserId, conversations])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserId || sending) return
    setSending(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: selectedUserId, message_text: newMessage.trim() }),
      })
      if (res.ok) {
        setNewMessage('')
        await fetchMessages(selectedUserId)
        await fetchConversations()
      }
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
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar currentUserId={currentUser?.id} />

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Inbox sidebar */}
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              + New
            </button>
          </div>

          {/* New message search */}
          {showSearch && (
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search students…"
                value={searchUser}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        selectConversation(u.id, u.name)
                        setShowSearch(false)
                        setSearchUser('')
                        setSearchResults([])
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-sm"
                    >
                      <p className="font-medium text-gray-900">{u.name}</p>
                      {u.university && <p className="text-xs text-gray-400">{u.university}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8 px-4">
                No conversations yet. Start one by clicking &quot;+ New&quot;.
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.other_user_id}
                  onClick={() => selectConversation(conv.other_user_id, conv.other_user_name)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedUserId === conv.other_user_id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {conv.other_user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 text-sm truncate">{conv.other_user_name}</p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatTime(conv.latest_time)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.latest_message}</p>
                    </div>
                    {Number(conv.unread_count) > 0 && (
                      <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-5xl mb-4">💬</p>
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm mt-1">or start a new one with &quot;+ New&quot;</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold">
                  {selectedUserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUserName}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                        <div className="h-10 w-48 bg-gray-100 rounded-2xl animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">
                    No messages yet. Send the first one!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUser?.id
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          <p>{msg.message_text}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={handleSend} className="px-4 py-4 border-t border-gray-100 flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 animate-pulse" />}>
      <MessagesContent />
    </Suspense>
  )
}
