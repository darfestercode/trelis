'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface GoalProgressContextValue {
  goalProgress: number
  refreshProgress: () => void
}

const GoalProgressContext = createContext<GoalProgressContextValue>({
  goalProgress: 0,
  refreshProgress: () => {},
})

export function GoalProgressProvider({ children }: { children: ReactNode }) {
  const [goalProgress, setGoalProgress] = useState(0)

  const refreshProgress = useCallback(() => {
    fetch('/api/milestones')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const milestones = data?.milestones ?? []
        const total = milestones.length
        const completed = milestones.filter((m: { is_completed: boolean }) => m.is_completed).length
        setGoalProgress(total === 0 ? 0 : Math.round((completed / total) * 100))
      })
      .catch(() => {})
  }, [])

  // Fetch once on app load
  useEffect(() => { refreshProgress() }, [refreshProgress])

  return (
    <GoalProgressContext.Provider value={{ goalProgress, refreshProgress }}>
      {children}
    </GoalProgressContext.Provider>
  )
}

export function useGoalProgress() {
  return useContext(GoalProgressContext)
}
