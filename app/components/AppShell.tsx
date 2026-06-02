'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
  raw?: boolean
}

export default function AppShell({ children, raw = false }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#f0f2f5] dark:bg-[#0f172a]">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full">
        <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-[#1e293b] bg-white dark:bg-[#0f172a] shrink-0">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-lg font-bold text-[#1e3a5f] dark:text-white">Trelis</span>
          </div>
          <div className="w-6" />
        </div>

        {raw ? (
          <div className="flex-1 overflow-hidden min-h-0">
            {children}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
