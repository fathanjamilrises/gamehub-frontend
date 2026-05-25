'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { chatApi } from '@/lib/chatApi'

interface AdminUser {
  id: number
  email: string
  role: string
  username?: string
  name?: string
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { label: 'Games', href: '/admin/games', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
  )},
  { label: 'Produk', href: '/admin/produks', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
  )},
  { label: 'Voucher', href: '/admin/vouchers', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
  )},
  { label: 'Reseller', href: '/admin/resellers', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  )},
  { label: 'Listing Akun', href: '/admin/listings', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
  )},
  { label: 'Chat', href: '/admin/chat', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
  )},
  { label: 'Pesanan', href: '/admin/orders', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
  )},
  { label: 'Penarikan', href: '/admin/withdrawals', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>
  )},
  { label: 'Pengguna', href: '/admin/users', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  )},
  { label: 'Pengaturan', href: '/admin/settings', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
  )},
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('gamehub_admin_token')
    if (!token) return

    const fetchCount = () => {
      chatApi.getUnreadCount()
        .then(count => setUnreadCount(count))
        .catch(() => {})
    }

    fetchCount()
    const interval = setInterval(fetchCount, 15000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('gamehub_admin_token')
    const storedUser = localStorage.getItem('gamehub_admin_user')
    
    // Jika tidak ada user tersimpan, pasti belum login
    if (!storedUser) {
      console.log('[AdminShell] No stored user found, redirecting to login')
      router.replace('/admin/login')
      return
    }

    try {
      const parsed = JSON.parse(storedUser)
      // Cek role dengan toleransi case-insensitive
      const role = String(parsed.role || '').toLowerCase()
      
      if (role !== 'admin') {
        console.log('[AdminShell] User is not admin (role:', role, '), redirecting to login')
        router.replace('/admin/login')
        return
      }
      
      setUser(parsed)
      setIsLoading(false)
    } catch (err) {
      console.error('[AdminShell] Error parsing user data:', err)
      router.replace('/admin/login')
    }
  }, [router])

  const handleLogout = () => {
    const token = localStorage.getItem('gamehub_admin_token')
    if (token) {
      fetch('/api-proxy/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      }).catch(err => {
        console.error('[AdminShell] Logout API error:', err)
      })
    }
    localStorage.removeItem('gamehub_admin_token')
    localStorage.removeItem('gamehub_admin_refresh_token')
    localStorage.removeItem('gamehub_admin_user')
    router.replace('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white border-[3px] border-gray-900 p-8 rounded-2xl shadow-[8px_8px_0px_#111827]">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
          <p className="font-black text-gray-900 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    )
  }

  const getInitial = () => (user?.name || user?.username || user?.email || 'A').charAt(0).toUpperCase()
  const getDisplayName = () => user?.name || user?.username || user?.email?.split('@')[0] || 'Admin'

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b-[3px] border-gray-700">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <div className="w-10 h-10 bg-[#ffc900] border-[3px] border-gray-700 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#ffc900] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <p className="font-black text-white text-base uppercase tracking-tight leading-none">Admin</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">GameHub.ID</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const isChat = item.label === 'Chat'
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={
                "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all " +
                (active
                  ? 'bg-[#ffc900] text-gray-900 border-[3px] border-gray-700 shadow-[3px_3px_0px_#ffc900]'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800 border-[3px] border-transparent')
              }
            >
              <div className="flex items-center gap-3">
                <span className={active ? 'text-gray-900' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </div>
              {isChat && unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-gray-900 shadow-[1px_1px_0px_#111827]">
                  {unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t-[3px] border-gray-700">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 bg-[#ff90e8] border-[3px] border-gray-700 rounded-lg flex items-center justify-center text-sm font-black text-gray-900 shrink-0">
            {getInitial()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate">{getDisplayName()}</p>
            <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-wider">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 border-[3px] border-gray-700 rounded-lg text-[10px] font-black text-gray-300 uppercase tracking-wider hover:text-white hover:bg-gray-700 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Site
          </Link>
          <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/20 border-[3px] border-red-500/40 rounded-lg text-[10px] font-black text-red-400 uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 border-r-[3px] border-gray-900 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-gray-900 border-r-[3px] border-gray-900 flex flex-col shadow-[8px_0px_0px_#111827] animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile Top Bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-gray-900 border-b-[3px] border-gray-900 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center text-white hover:text-[#ffc900] transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span className="font-black text-white text-sm uppercase tracking-wider">Admin Panel</span>
          <div className="w-8 h-8 bg-[#ff90e8] border-[3px] border-gray-700 rounded-lg flex items-center justify-center text-xs font-black text-gray-900">
            {getInitial()}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  )
}
