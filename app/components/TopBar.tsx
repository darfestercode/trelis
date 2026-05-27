'use client'

export default function TopBar({ goalProgress = 0 }: { goalProgress?: number }) {
  return (
    <header className="flex items-center justify-end px-5 py-3 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-[#1e293b] shrink-0">

      {/* Current goal progress */}
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

    </header>
  )
}
