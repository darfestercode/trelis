'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User } from '@/types'

interface UserContextValue {
  user: User | null
  loading: boolean
  loggedOut: boolean
  refresh: () => void
  setUser: (u: User | null) => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  loggedOut: false,
  refresh: () => {},
  setUser: () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggedOut, setLoggedOut] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me')
      if (r.status === 401) {
        setUser(null)
        setLoggedOut(true)
      } else if (r.ok) {
        const d = await r.json()
        setUser(d?.user ?? null)
        setLoggedOut(false)
      }
      // 5xx or other non-401 errors: keep previous auth state, don't bounce to login
    } catch {
      // network error: keep previous auth state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <UserContext.Provider value={{ user, loading, loggedOut, refresh, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() { return useContext(UserContext) }
