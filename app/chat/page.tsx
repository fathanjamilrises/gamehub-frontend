'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { chatApi, ChatRoom } from '@/lib/chatApi'
import { useToast } from '@/lib/contexts/ToastContext'
import { getStoredUser } from '@/lib/authApi'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}j`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}h`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function ChatRoomsPage() {
  const { toast } = useToast()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pembeli' | 'penjual'>('all')
  const [search, setSearch] = useState('')
  const currentUser = getStoredUser()

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true)
      try {
        const role = filter === 'all' ? undefined : filter
        const data = await chatApi.getRooms(role)
        setRooms(data)
      } catch (err: any) {
        console.error('Fetch rooms error:', err)
        toast(err.message || 'Gagal memuat daftar chat', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchRooms()
  }, [filter, toast])

  const getOtherUser = (room: ChatRoom) => {
    if (!currentUser) return { name: 'User', avatar: '' }
    
    const currentId = currentUser.id === 'undefined' ? undefined : (currentUser.id || (currentUser as any).id_user);
    let isBuyer = false;
    
    if (currentId && String(room.id_pembeli) === String(currentId)) {
      isBuyer = true;
    } else if (currentUser.username && room.pembeli?.username && currentUser.username === room.pembeli.username) {
      isBuyer = true;
    }
    
    if (isBuyer) {
      const p = room.penjual
      const sellerName = p?.reseller?.nama_lengkap || p?.username || p?.store_name || p?.name || 'Penjual'
      return {
        name: sellerName,
        avatar: p?.avatar,
      }
    }
    return {
      name: room.pembeli?.name || room.pembeli?.username || 'Pembeli',
      avatar: room.pembeli?.avatar,
    }
  }

  const filteredRooms = rooms.filter((room) => {
    if (!search.trim()) return true
    const other = getOtherUser(room)
    const q = search.toLowerCase()
    return (
      other.name.toLowerCase().includes(q) ||
      (room.listing?.nama_post || '').toLowerCase().includes(q)
    )
  })

  const totalUnread = rooms.reduce((sum, r) => sum + (r.unread_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-3 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              CHAT
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight">Pesan</h1>
            <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Komunikasi dengan pembeli & penjual akun game.
            </p>
          </div>
          {totalUnread > 0 && (
            <div className="flex items-center gap-2 bg-blue-600 border-[3px] border-gray-900 text-white text-sm font-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_#111827]">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              {totalUnread} pesan belum dibaca
            </div>
          )}
        </div>

        {/* Search & Filters Card */}
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />

          {/* Search + Filter Bar */}
          <div className="p-4 sm:p-5 border-b-[3px] border-gray-900 relative z-10">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari chat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-[3px] border-gray-900 rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Chat List */}
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
              <p className="font-black text-gray-900 uppercase tracking-widest text-sm">Memuat...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center py-16 px-6 text-center">
              <div className="w-20 h-20 bg-gray-100 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center mb-5 shadow-[4px_4px_0px_#111827]">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-wider mb-2">
                {search ? 'Chat Tidak Ditemukan' : 'Belum Ada Chat'}
              </h3>
              <p className="text-gray-500 font-bold text-sm max-w-sm mb-6">
                {search ? 'Coba kata kunci lain.' : 'Mulai percakapan dengan menekan tombol chat di halaman detail akun.'}
              </p>
              {!search && (
                <Link href="/accounts" className="inline-flex px-6 py-3 bg-[#ffc900] text-gray-900 font-black uppercase text-sm rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all">
                  Lihat Akun Game
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y-2 divide-gray-200">
              {filteredRooms.map((room) => {
                const other = getOtherUser(room)
                const lastMsg = room.last_message
                const unread = room.unread_count || 0

                return (
                  <Link
                    key={room.id}
                    href={`/chat/${room.id}`}
                    className={
                      "flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-blue-50/50 transition-colors relative group " +
                      (unread > 0 ? 'bg-blue-50/30' : '')
                    }
                  >
                    {/* Unread indicator line */}
                    {unread > 0 && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-r-full" />
                    )}

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-[3px] border-gray-900 bg-gradient-to-br from-[#ffc900]/30 to-[#ff90e8]/30 flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_#111827]">
                        {other.avatar ? (
                          <img src={resolveImageUrl(other.avatar)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-lg sm:text-xl font-black text-gray-900">{other.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      {/* Online dot */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-[3px] border-white rounded-full" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={
                          "text-sm sm:text-base truncate " +
                          (unread > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-800')
                        }>
                          {other.name}
                        </h3>
                        <span className={
                          "text-[11px] whitespace-nowrap shrink-0 " +
                          (unread > 0 ? 'font-black text-blue-600' : 'font-bold text-gray-400')
                        }>
                          {timeAgo(lastMsg?.createdAt || lastMsg?.created_at)}
                        </span>
                      </div>
                      {/* Listing name */}
                      <p className="text-xs font-bold text-blue-600 truncate mt-0.5">
                        {room.listing?.nama_post || 'Akun Game'}
                      </p>
                      {/* Last message */}
                      <p className={
                        "text-sm truncate mt-0.5 " +
                        (unread > 0 ? 'font-bold text-gray-700' : 'font-medium text-gray-500')
                      }>
                        {lastMsg?.tipe === 'image'
                          ? '📷 Gambar'
                          : lastMsg?.tipe === 'offer'
                            ? `💰 Penawaran Rp ${Number(lastMsg.harga_penawaran || 0).toLocaleString('id-ID')}`
                            : lastMsg?.isi_pesan || 'Belum ada pesan'}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {unread > 0 && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-[3px] border-gray-900 shadow-[2px_2px_0px_#111827] shrink-0">
                        {unread > 99 ? '99+' : unread}
                      </div>
                    )}

                    {/* Chevron */}
                    <svg className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Footer count */}
          {!loading && filteredRooms.length > 0 && (
            <div className="px-5 py-3 border-t-[3px] border-gray-900 bg-gray-50">
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{filteredRooms.length} percakapan</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
