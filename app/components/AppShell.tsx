'use client'

import Sidebar from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
  raw?: boolean
}

export default function AppShell({ children, raw = false }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5] dark:bg-[#0f172a]">
      <Sidebar open={true} />
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
  )
}
