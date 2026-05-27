'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TopBarProps {
  onMenuToggle: () => void
  goalProgress?: number
}

export default function TopBar({ onMenuToggle, goalProgress = 0 }: TopBarProps) {
  const router = useRouter()
  const [q, setQ] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = q.trim()
    router.push(trimmed ? `/discover?q=${encodeURIComponent(trimmed)}` : '/discover')
  }

  return (
    <header className="flex items-center px-5 py-3 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-[#1e293b] shrink-0">

      {/* Left — hamburger */}
      <div className="flex-1 flex items-center">
        <button
          onClick={onMenuToggle}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Center — search */}
      <form
        onSubmit={handleSearch}
        className="w-full max-w-sm flex items-center gap-2 border border-gray-200 dark:border-[#334155] rounded-xl px-4 py-2 bg-white dark:bg-[#1e293b] transition-all focus-within:border-[#335293] focus-within:ring-2 focus-within:ring-[#335293]/10"
      >
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search people, universities, tags..."
          className="bg-transparent text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none w-full"
        />
        {q && (
          <button type="submit" className="text-xs font-semibold px-2 py-0.5 rounded-md shrink-0" style={{ color: '#335293', background: 'rgba(51,82,147,0.08)' }}>
            Go
          </button>
        )}
      </form>

      {/* Right — current goal */}
      <div className="flex-1 flex items-center justify-end">
        <div className="flex items-center gap-2.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-xl px-4 py-2 shrink-0" style={{ minWidth: '220px' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(51, 82, 147, 0.1)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#335293' }}>
              <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
              <circle cx="12" cy="12" r="6" strokeWidth={1.8} />
              <circle cx="12" cy="12" r="2" strokeWidth={1.8} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Current Goal</span>
              <span className="text-xs font-bold ml-2" style={{ color: '#335293' }}>{goalProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${goalProgress}%`, background: 'linear-gradient(90deg, #335293 0%, #4A6BAE 100%)' }}
              />
            </div>
          </div>
        </div>
      </div>

    </header>
  )
}
