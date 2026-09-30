'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { http, setAuthToken, getAuthToken, USE_MOCKS } from './api/http'
import type { Student } from './types'
import { useSWRConfig } from 'swr'

type Credentials = { email: string; password: string }
type Registration = Credentials & { firstName: string; lastName: string }
type AuthResponse = { token: string; user: Student }

type AuthContextValue = {
  user: Student | null
  loading: boolean
  login: (input: Credentials) => Promise<void>
  register: (input: Registration) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const refresh = async () => {
    if (!USE_MOCKS && !getAuthToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      setUser(await http.get<Student>('/me'))
    } catch {
      setAuthToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const unauthorized = () => {
      setAuthToken(null)
      setUser(null)
      router.replace('/accedi')
    }
    window.addEventListener('randyflow:unauthorized', unauthorized)
    return () => window.removeEventListener('randyflow:unauthorized', unauthorized)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const authenticate = async (path: string, input: Credentials | Registration) => {
    const result = await http.post<AuthResponse>(path, input)
    await mutate(() => true, undefined, { revalidate: false })
    setAuthToken(result.token)
    setUser(result.user)
  }

  const value: AuthContextValue = {
      user,
      loading,
      login: (input) => authenticate('/auth/login', input),
      register: (input) => authenticate('/auth/register', input),
      logout: async () => {
        try {
          if (getAuthToken()) await http.post('/auth/logout')
        } finally {
          setAuthToken(null)
          setUser(null)
          await mutate(() => true, undefined, { revalidate: false })
          router.replace('/')
        }
      },
      refresh,
    }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return value
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user) router.replace('/accedi')
  }, [loading, user, router])
  if (loading || !user)
    return <div className="grid min-h-dvh place-items-center bg-background text-sm text-muted-foreground">Caricamento account…</div>
  return children
}
