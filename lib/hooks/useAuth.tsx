'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetProfile,
  getStoredUser,
  getToken,
  isLoggedOutFlag,
  clearLoggedOutFlag,
  AuthUser,
} from '@/lib/authApi'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    email: string,
    password: string,
    name: string,
    confirmPassword: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Jika user sudah klik logout, jangan coba re-authenticate dari cookies
      if (isLoggedOutFlag()) {
        console.log('[useAuth] Logout flag detected, skipping re-auth')
        setUser(null)
        setIsLoading(false)
        return
      }

      const stored = getStoredUser()
      const token = getToken()

      // Jika ada data user di localStorage, pakai dulu agar UI tidak kedip (optimistic)
      if (stored) {
        setUser(stored)
      }

      // Selalu coba fetch profil terbaru (ini akan mengirim cookies backend)
      const profileResult = await apiGetProfile()

      if (profileResult.success && profileResult.user) {
        setUser(profileResult.user)
      } else if (!token) {
        // Jika fetch profil gagal dan tidak ada token di localStorage, 
        // berarti memang tidak ada session aktif.
        setUser(null)
      }
    } catch (error) {
      console.error('Check auth error:', error)
      // Jangan langsung null-kan jika error network, biarkan stored user tetap ada jika tersedia
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (emailOrUsername: string, password: string) => {
    clearLoggedOutFlag() // Hapus flag logout agar checkAuth bisa berjalan normal
    const result = await apiLogin(emailOrUsername, password)
    if (result.success) {
      if (result.user) {
        setUser(result.user)
      } else {
        // Backend pakai HttpOnly cookie — user tidak ada di body, fetch profil
        await checkAuth()
      }
      return { success: true }
    }
    return { success: false, error: result.error || 'Login gagal' }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    confirmPassword: string,
  ) => {
    if (password !== confirmPassword) {
      return { success: false, error: 'Konfirmasi password tidak cocok' }
    }
    // `name` dipakai sebagai username untuk backend
    const result = await apiRegister(name, email, password)
    if (result.success) {
      if (result.user) {
        setUser(result.user)
      } else {
        // Backend mungkin tidak auto-login
        const loginRes = await apiLogin(email, password)
        if (loginRes.success && loginRes.user) setUser(loginRes.user)
      }
      return { success: true }
    }
    return { success: false, error: result.error || 'Registrasi gagal' }
  }

  const logout = async () => {
    await apiLogout()
    setUser(null)
    window.location.href = '/'
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
