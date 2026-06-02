'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/app/components/AppShell'
import { useUser } from '@/app/components/UserContext'
import { Conversation } from '@/types'

interface Post {
  id: number
  content: string
  attachment_url: string | null
  attachment_type: string | null
  created_at: string
  user_id: number
  name: string
  university: string | null
  major: string | null
  year: number | null
  tags: { id: number; name: string; category: string }[]
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function yearLabel(y: number | null) {
  const map: Record<number, string> = { 1: 'Undergrad', 2: 'Undergrad', 3: 'Undergrad', 4: 'Undergrad', 5: 'Postgraduate', 6: 'PhD' }
  return y ? (map[y] ?? 'Student') : 'Student'
}

export default function FeedPage() {
  const router = useRouter()
  const { user: currentUser, loggedOut } = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [postText, setPostText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [connected, setConnected] = useState<Set<number>>(new Set())
  const [attachment, setAttachment] = useState<{ url: string; type: string; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect only on a confirmed 401 from /api/auth/me — not on transient DB/network errors
  useEffect(() => {
    if (loggedOut) router.push('/login')
  }, [loggedOut, router])

  // Fetch data in parallel on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/posts').then(r => r.json()).catch(() => ({ posts: [] })),
      fetch('/api/messages').then(r => r.json()).catch(() => ({ conversations: [] })),
      fetch('/api/connections').then(r => r.json()).catch(() => ({ connections: [] })),
    ]).then(([postsData, msgsData, connsData]) => {
      setPosts(postsData.posts ?? [])
      setConversations(msgsData.conversations ?? [])
      const ids = new Set<number>((connsData.connections ?? []).map((c: { other_user_id: number }) => c.other_user_id))
      setConnected(ids)
    })
  }, [])

  async function handleMediaClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (res.ok) {
      const d = await res.json()
      setAttachment({ url: d.url, type: d.type, name: d.name })
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!postText.trim() || submitting) return
    const text = postText.trim()
    setSubmitting(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          attachment_url: attachment?.url ?? null,
          attachment_type: attachment?.type ?? null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error ?? 'Failed to post. Please try again.')
        return
      }
      setPostText('')
      setAttachment(null)
      const data = await fetch(`/api/posts?t=${Date.now()}`).then(r => r.json())
      setPosts(data.posts ?? [])
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConnect(userId: number) {
    setConnected(prev => new Set([...prev, userId]))
    await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: userId }),
    })
  }

  function formatTime(ts: string) {
    const d = new Date(ts)
    const now = new Date()
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex-1 min-w-0 space-y-5">
          {/* Recent Chats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Recent Chats</h3>
              <Link href="/messages" className="text-xs text-[#1e3a5f] hover:underline">View All</Link>
            </div>
            {conversations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">No chats yet.</p>
            ) : (
              <div className="space-y-3">
                {conversations.slice(0, 3).map(conv => (
                  <Link
                    key={conv.other_user_id}
                    href={`/messages?with=${conv.other_user_id}`}
                    className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {conv.other_user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900 truncate">{conv.other_user_name}</p>
                        <span className="text-xs text-gray-400 shrink-0 ml-1">{formatTime(conv.latest_time)}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{conv.latest_message}</p>
                    </div>
                    {Number(conv.unread_count) > 0 && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Post composer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <form onSubmit={handlePost}>
              <textarea
                ref={textareaRef}
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="Share a milestone or ask for study help..."
                rows={3}
                className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none outline-none border-none"
              />

              {/* Attachment preview */}
              {attachment && (
                <div className="mt-3 relative inline-block">
                  {attachment.type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={attachment.url} alt="attachment" className="max-h-48 rounded-lg border border-gray-200 object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {attachment.name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-900"
                  >×</button>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleMediaClick}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={1.8} />
                      <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.8} />
                      <polyline points="21 15 16 10 5 21" strokeWidth={1.8} />
                    </svg>
                  )}
                  {uploading ? 'Uploading…' : 'Media'}
                </button>
                <button
                  type="submit"
                  disabled={!postText.trim() || submitting}
                  className="bg-[#1e3a5f] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#162d4a] transition-colors disabled:opacity-50"
                >
                  Post Update
                </button>
              </div>
            </form>
          </div>

          {/* Feed */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-base">Your Feed</h2>
            <span className="text-xs text-gray-400">Sort by: Relevant</span>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 shadow-sm">
              <p className="text-base">No posts yet.</p>
              <p className="text-sm mt-1">Be the first to share a milestone!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {post.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/profile/${post.user_id}`} className="font-semibold text-gray-900 text-sm hover:underline">
                          {post.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {yearLabel(post.year)}
                          {post.major ? ` · ${post.major}` : ''}
                          {post.university ? ` @ ${post.university}` : ''}
                          {' · '}{timeAgo(post.created_at)}
                        </p>
                      </div>
                      {currentUser && currentUser.id !== post.user_id && (
                        <button
                          onClick={() => handleConnect(post.user_id)}
                          disabled={connected.has(post.user_id)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                            connected.has(post.user_id)
                              ? 'border-gray-200 text-gray-400 cursor-default'
                              : 'border-gray-300 text-gray-700 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
                          }`}
                        >
                          {connected.has(post.user_id) ? 'Connected' : 'Connect'}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed break-words">{post.content}</p>
                    {post.attachment_url && post.attachment_type === 'image' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.attachment_url} alt="" className="mt-3 rounded-lg border border-gray-200 max-h-96 object-cover w-full" />
                    )}
                    {post.attachment_url && post.attachment_type !== 'image' && (
                      <a href={post.attachment_url} target="_blank" rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#335293] hover:bg-gray-100 transition-colors w-fit">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        View attachment
                      </a>
                    )}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.tags.map(t => (
                          <span key={t.id} className="text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
