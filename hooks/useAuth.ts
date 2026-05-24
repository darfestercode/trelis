'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'

interface AuthState {
  user: User | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setState({ user: data?.user ?? null, loading: false }))
      .catch(() => setState({ user: null, loading: false }))
  }, [])

  return state
}
