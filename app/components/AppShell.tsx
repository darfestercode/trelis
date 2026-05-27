'use client'

import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useGoalProgress } from './GoalProgressContext'

interface AppShellProps {
  children: React.ReactNode
  raw?: boolean
}

export default function AppShell({ children, raw = false }: AppShellProps) {
  const { goalProgress } = useGoalProgress()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f0f2f5] dark:bg-[#0f172a]">
      <TopBar goalProgress={goalProgress} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
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
    </div>
  )
}
