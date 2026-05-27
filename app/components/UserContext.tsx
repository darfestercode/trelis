'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User } from '@/types'

interface UserContextValue {
  user: User | null
  loading: boolean
  refresh: () => void
  setUser: (u: User | null) => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refresh: () => {},
  setUser: () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setUser(d?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <UserContext.Provider value={{ user, loading, refresh, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() { return useContext(UserContext) }
