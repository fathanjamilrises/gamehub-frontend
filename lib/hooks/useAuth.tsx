'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session, status: sessionStatus } = useSession()
  const initDone = useRef(false)

  // Sync NextAuth Google session into user state
  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (session?.user) {
      setUser({
        id: session.user.id ?? '',
        email: session.user.email ?? '',
        name: session.user.name ?? '',
      })
      setIsLoading(false)
      initDone.current = true
    } else if (!initDone.current) {
      checkAuth()
    }
  }, [session, sessionStatus])

  const fetchProfile = async (): Promise<User | null> => {
    const res = await fetch('/api/auth', {
      method: 'GET',
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.data?.user) return data.data.user
    }
    return null
  }

  const checkAuth = async () => {
    try {
      const profile = await fetchProfile()
      if (profile) {
        setUser(profile)
        initDone.current = true
        return
      }
      // access token missing/expired — try refresh once
      const refreshed = await attemptRefresh()
      if (refreshed) {
        const profile2 = await fetchProfile()
        setUser(profile2)
        if (profile2) initDone.current = true
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Check auth error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Internal refresh — does NOT call checkAuth to avoid loops
  const attemptRefresh = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'refresh' }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', email, password }),
      })

      const data = await res.json()

      if (data.success) {
        setUser(data.data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Terjadi kesalahan' }
    }
  }

  const register = async (email: string, password: string, name: string, confirmPassword: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, name, confirmPassword }),
      })

      const data = await res.json()

      if (data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, error: 'Terjadi kesalahan' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' }),
      })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    const ok = await attemptRefresh()
    if (ok) {
      const profile = await fetchProfile()
      setUser(profile)
    }
    return ok
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshToken,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
