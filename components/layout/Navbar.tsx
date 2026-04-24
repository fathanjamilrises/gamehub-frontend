'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import AuthModal from '@/components/ui/AuthModal'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'login' | 'daftar'>('login')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, isAuthenticated, logout, isLoading, checkAuth } = useAuth()
  const { data: session, status } = useSession()

  // Sync NextAuth session with our auth context
  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      checkAuth()
    }
  }, [session, status])

  const openLogin = () => { setModalTab('login'); setModalOpen(true) }
  const openDaftar = () => { setModalTab('daftar'); setModalOpen(true) }

  const handleLogout = async () => {
    // Sign out from both systems
    await signOut({ redirect: false })
    await logout()
    setDropdownOpen(false)
  }

  // Get username from email (before @)
  const getUsername = () => {
    // Prioritize session from NextAuth (Google Sign In)
    const email = session?.user?.email || user?.email
    if (!email) return 'User'
    return email.split('@')[0]
  }

  // Check if user is authenticated (either via JWT or NextAuth)
  const isUserAuthenticated = isAuthenticated || status === 'authenticated'
  const isUserLoading = isLoading || status === 'loading'

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">G</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">GameHub.ID</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/topup" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Top Up
            </Link>
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Beli Akun
            </Link>
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Jasa Joki
            </Link>
          </div>

          {/* Auth buttons / User dropdown */}
          <div className="flex items-center gap-3">
            {isUserLoading ? (
              // Loading state
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : isUserAuthenticated ? (
              // User dropdown
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {getUsername().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {getUsername()}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{getUsername()}</p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email || user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Pesanan Saya
                      </Link>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Auth buttons
              <>
                <button
                  onClick={openLogin}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-2"
                >
                  Masuk
                </button>
                <button
                  onClick={openDaftar}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                  Daftar
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab={modalTab}
      />
    </>
  )
}
