'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthModal from '@/components/ui/AuthModal'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCart } from '@/lib/contexts/CartContext'
import { chatApi } from '@/lib/chatApi'

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function Navbar() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'login' | 'daftar'>('login')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const { cartCount, setIsOpen } = useCart()
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadChatCount(0)
      return
    }

    const fetchCount = () => {
      chatApi.getUnreadCount().then(count => setUnreadChatCount(count)).catch(() => {})
    }

    fetchCount()
    const interval = setInterval(fetchCount, 15000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    const handleOpenAuthModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: 'login' | 'daftar' }>
      setModalTab(customEvent.detail?.tab === 'daftar' ? 'daftar' : 'login')
      setModalOpen(true)
    }

    window.addEventListener('open-auth-modal', handleOpenAuthModal)

    return () => {
      window.removeEventListener('open-auth-modal', handleOpenAuthModal)
    }
  }, [])

  const openLogin = () => { setModalTab('login'); setModalOpen(true) }
  const openDaftar = () => { setModalTab('daftar'); setModalOpen(true) }

  const handleLogoutClick = () => {
    setDropdownOpen(false)
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = async () => {
    // eslint-disable-next-line no-console
    console.log('[Navbar] Tombol konfirmasi logout ditekan. Memulai proses logout...')
    setLoggingOut(true)
    try {
      await logout()
      // eslint-disable-next-line no-console
      console.log('[Navbar] Proses logout selesai (Sesi dihapus). Mengalihkan ke beranda...')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Navbar] Terjadi kesalahan saat memproses logout:', err)
    } finally {
      setLoggingOut(false)
      setShowLogoutConfirm(false)
    }
  }

  // Get username from email (before @)
  const getUsername = () => {
    const email = user?.email
    if (!email) return 'User'
    return email.split('@')[0]
  }

  return (
    <>
      <motion.nav
        className="sticky top-0 z-40 bg-white border-b-2 border-gray-900"
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 bg-blue-600 border-2 border-gray-900 rounded-md flex items-center justify-center"
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <span className="text-white font-bold text-sm">G</span>
            </motion.div>
            <span className="font-bold text-gray-900 text-lg">GameHub.ID</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/topup" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Top Up
            </Link>
            {(!isAuthenticated || user?.role === 'user') && (
              <Link href="/accounts" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Beli Akun
              </Link>
            )}
            <Link href="/joki" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Jasa Joki
            </Link>
          </div>

          {/* Auth buttons / User dropdown */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <Link
                  href="/chat"
                  className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors hidden md:flex"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <AnimatePresence>
                    {unreadChatCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-600 rounded-full border-2 border-gray-900"
                      >
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                <button
                  onClick={() => setIsOpen(true)}
                  className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </>
            )}

            {isLoading ? (
              <div className="w-8 h-8 rounded-md bg-gray-200 animate-pulse border-2 border-gray-900 hidden md:block" />
            ) : isAuthenticated ? (
              <div className="relative hidden md:block">
                <motion.button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border-2 border-gray-900 hover:bg-gray-50 transition-colors nb-shadow-sm"
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="w-7 h-7 bg-blue-600 border-2 border-gray-900 rounded-md flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {getUsername().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {getUsername()}
                  </span>
                  <motion.svg
                    animate={{ rotate: dropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </motion.button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg border-2 border-gray-900 py-2 z-50 nb-shadow"
                      >
                        <div className="px-4 py-2 border-b-2 border-gray-900">
                          <p className="text-sm font-bold text-gray-900">{getUsername()}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Pesanan Saya
                        </Link>
                        <Link
                          href="/reseller"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Jadi Reseller
                        </Link>
                        <div className="border-t-2 border-gray-900 mt-2 pt-2">
                          <button
                            onClick={handleLogoutClick}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <motion.button
                  onClick={openLogin}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-1.5"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Masuk
                </motion.button>
                <motion.button
                  onClick={openDaftar}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-md border-2 border-gray-900 transition-colors nb-shadow-sm"
                  whileHover={{ y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Daftar
                </motion.button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(true)}
              className="flex md:hidden w-10 h-10 items-center justify-center bg-white border-2 border-gray-900 rounded-md nb-shadow-sm hover:bg-gray-50 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-xs bg-[#fbfbfb] border-l-[3px] border-gray-900 p-6 flex flex-col md:hidden overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b-2 border-gray-900">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    className="w-8 h-8 bg-blue-600 border-2 border-gray-900 rounded-md flex items-center justify-center"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <span className="text-white font-bold text-sm">G</span>
                  </motion.div>
                  <span className="font-bold text-gray-900 text-lg">GameHub.ID</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-900 rounded-md nb-shadow-sm hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info (if logged in) */}
              {isAuthenticated && (
                <div className="py-6 border-b-2 border-gray-900">
                  <div className="bg-white border-2 border-gray-900 rounded-xl p-4 nb-shadow-sm flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 border-2 border-gray-900 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-black text-lg">
                        {getUsername().charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 truncate uppercase text-sm tracking-wide">
                        {getUsername()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex-1 py-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                    Menu Utama
                  </p>
                  <Link
                    href="/topup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-900 rounded-xl font-bold text-gray-900 nb-shadow-sm hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Top Up
                  </Link>
                  {(!isAuthenticated || user?.role === 'user') && (
                    <Link
                      href="/accounts"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-900 rounded-xl font-bold text-gray-900 nb-shadow-sm hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Beli Akun
                    </Link>
                  )}
                  <Link
                    href="/joki"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-900 rounded-xl font-bold text-gray-900 nb-shadow-sm hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Jasa Joki
                  </Link>
                  <Link
                    href="/vouchers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-900 rounded-xl font-bold text-gray-900 nb-shadow-sm hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    Voucher Game
                  </Link>
                </div>

                {isAuthenticated && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                      Akun Saya
                    </p>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Pesanan Saya
                    </Link>
                    <Link
                      href="/reseller"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Jadi Reseller
                    </Link>
                    <Link
                      href="/chat"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                      </div>
                      {unreadChatCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold text-white bg-blue-600 rounded-full border-2 border-gray-900 animate-pulse">
                          {unreadChatCount}
                        </span>
                      )}
                    </Link>
                  </div>
                )}
              </div>

              {/* Action Buttons at the bottom */}
              {isAuthenticated ? (
                <div className="mt-auto pt-6 border-t-2 border-gray-900">
                  <motion.button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogoutClick()
                    }}
                    className="w-full py-3 font-bold text-sm text-white bg-red-500 border-2 border-gray-900 rounded-xl shadow-[3px_3px_0px_#111827] hover:bg-red-600 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.97 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar Akun
                  </motion.button>
                </div>
              ) : (
                <div className="mt-auto pt-6 border-t-2 border-gray-900 flex flex-col gap-3">
                  <motion.button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      openLogin()
                    }}
                    className="w-full py-3 font-bold text-sm text-gray-700 bg-gray-100 border-2 border-gray-900 rounded-xl shadow-[3px_3px_0px_#111827] hover:bg-gray-200 transition-colors uppercase tracking-wider text-center"
                    whileTap={{ scale: 0.97 }}
                  >
                    Masuk
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      openDaftar()
                    }}
                    className="w-full py-3 font-bold text-sm text-white bg-blue-600 border-2 border-gray-900 rounded-xl shadow-[3px_3px_0px_#111827] hover:bg-blue-700 transition-colors uppercase tracking-wider text-center"
                    whileTap={{ scale: 0.97 }}
                  >
                    Daftar Akun
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab={modalTab}
      />

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              variants={modalOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !loggingOut && setShowLogoutConfirm(false)}
            />
            {/* Modal */}
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] w-full max-w-sm p-6"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  className="w-16 h-16 bg-red-100 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#111827]"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
                >
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </motion.div>
              </div>

              <h2 className="text-xl font-black text-gray-900 text-center uppercase tracking-wide mb-2">
                Konfirmasi Logout
              </h2>
              <p className="text-sm font-bold text-gray-500 text-center mb-6">
                Apakah kamu yakin ingin keluar dari akun <span className="text-gray-900">{getUsername()}</span>?
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={loggingOut}
                  className="flex-1 py-3 font-black text-sm text-gray-700 bg-gray-100 border-[3px] border-gray-900 rounded-xl shadow-[3px_3px_0px_#111827] hover:bg-gray-200 transition-colors uppercase tracking-wider disabled:opacity-50"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Batal
                </motion.button>
                <motion.button
                  onClick={handleLogoutConfirm}
                  disabled={loggingOut}
                  className="flex-1 py-3 font-black text-sm text-white bg-red-500 border-[3px] border-gray-900 rounded-xl shadow-[3px_3px_0px_#111827] hover:bg-red-600 transition-colors uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loggingOut ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Keluar...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                      </svg>
                      Ya, Logout
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

