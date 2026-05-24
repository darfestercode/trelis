'use client'

interface TopBarProps {
  onMenuToggle: () => void
  goalProgress?: number
}

export default function TopBar({ onMenuToggle, goalProgress = 0 }: TopBarProps) {
  return (
    <header className="flex items-center gap-4 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
      {/* Hamburger */}
      <button
        onClick={onMenuToggle}
        className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search */}
      <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 bg-white max-w-xl transition-all focus-within:border-[#335293] focus-within:ring-2 focus-within:ring-[#335293]/10">
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <input
          type="text"
          placeholder="Search thousands of tags (e.g. 'RMIT', 'Engineer')..."
          className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
        />
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {/* Current Goal — animated progress bar */}
      <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2 shrink-0" style={{ minWidth: '220px' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(51, 82, 147, 0.1)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#335293' }}>
            <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
            <circle cx="12" cy="12" r="6" strokeWidth={1.8} />
            <circle cx="12" cy="12" r="2" strokeWidth={1.8} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Current Goal</span>
            <span className="text-xs font-bold ml-2" style={{ color: '#335293' }}>{goalProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${goalProgress}%`,
                background: 'linear-gradient(90deg, #335293 0%, #4A6BAE 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
