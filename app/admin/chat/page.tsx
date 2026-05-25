'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminShell from '@/components/admin/AdminShell'
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

function resolveLastMsg(room: ChatRoom | any) {
  if (!room) return null
  let msg = room.last_message || room.lastMessage || room.latestMessage || room.latest_message || room.lastMsg
  
  if (!msg && Array.isArray(room.messages) && room.messages.length > 0) {
    msg = room.messages[room.messages.length - 1]
  }
  if (!msg && Array.isArray(room.Messages) && room.Messages.length > 0) {
    msg = room.Messages[room.Messages.length - 1]
  }
  return msg
}

function resolveLastMsgText(msg: any): string {
  if (!msg) return ''
  if (typeof msg === 'string') return msg
  return msg.isi_pesan || msg.isiPesan || msg.message || msg.content || msg.text || msg.body || ''
}

function resolveLastMsgType(msg: any): string {
  if (!msg) return 'text'
  return msg.tipe || msg.type || (msg.url_gambar ? 'image' : (msg.harga_penawaran ? 'offer' : 'text'))
}

export default function AdminChatRoomsPage() {
  const { error: showError } = useToast()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const currentUser = getStoredUser()

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const data = await chatApi.getRooms()
      
      // Fetch last message for each room to ensure it is displayed correctly
      const roomsWithLastMsg = await Promise.all(
        data.map(async (room) => {
          try {
            const msgData = await chatApi.getMessages(room.id, 1, 1)
            const lastMsg = msgData.messages && msgData.messages.length > 0 
              ? msgData.messages[0] 
              : null
            return {
              ...room,
              last_message: lastMsg || undefined
            }
          } catch (e) {
            console.error(`Failed to fetch last message for room ${room.id}:`, e)
            return room
          }
        })
      )
      setRooms(roomsWithLastMsg)
    } catch (err: any) {
      console.error('Fetch admin rooms error:', err)
      showError(err.message || 'Gagal memuat daftar chat admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

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
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
              💬 CHAT PANEL ADMIN
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
              Pesan Masuk
            </h1>
            <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Komunikasi internal admin dengan pembeli dan penjual di platform GameHub.ID.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={fetchRooms}
              className="flex items-center gap-2 px-5 py-3 bg-[#ff90e8] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
            >
              ↻ Refresh
            </button>
            {totalUnread > 0 && (
              <div className="flex items-center gap-2 bg-blue-600 border-[3px] border-gray-900 text-white text-sm font-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_#111827]">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                {totalUnread} Belum Dibaca
              </div>
            )}
          </div>
        </div>

        {/* Search & Rooms List Container */}
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />

          {/* Search bar */}
          <div className="p-5 border-b-[3px] border-gray-900 relative z-10">
            <div className="relative w-full max-w-md">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari reseller atau judul listing..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-black uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Rooms list */}
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
              <p className="font-black text-gray-900 uppercase tracking-widest text-sm">Memuat chat room...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center py-20 px-6 text-center">
              <div className="w-20 h-20 bg-gray-100 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center mb-5 shadow-[4px_4px_0px_#111827]">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-wider mb-2">
                {search ? 'Chat Tidak Ditemukan' : 'Belum Ada Chat Admin'}
              </h3>
              <p className="text-gray-500 font-bold text-sm max-w-sm">
                {search ? 'Coba cari nama reseller atau judul listing yang berbeda.' : 'Buka halaman detail listing lalu klik tombol Live Chat Penjual untuk memulai.'}
              </p>
            </div>
          ) : (
            <div className="divide-y-[3px] divide-gray-900">
              {filteredRooms.map((room) => {
                const other = getOtherUser(room)
                const lastMsg = resolveLastMsg(room)
                const unread = room.unread_count || 0
                const lastMsgText = resolveLastMsgText(lastMsg)
                const lastMsgType = resolveLastMsgType(lastMsg)

                return (
                  <Link
                    key={room.id}
                    href={`/admin/chat/${room.id}`}
                    className={
                      "flex items-center gap-4 px-5 py-5 hover:bg-blue-50/50 transition-colors relative group " +
                      (unread > 0 ? 'bg-blue-50/30' : '')
                    }
                  >
                    {/* Unread indicator line */}
                    {unread > 0 && (
                      <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-blue-600 rounded-r-full" />
                    )}

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-xl border-[3px] border-gray-900 bg-gradient-to-br from-[#ffc900]/30 to-[#ff90e8]/30 flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_#111827]">
                        {other.avatar ? (
                          <img src={resolveImageUrl(other.avatar)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-xl font-black text-gray-900">{other.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-green-500 border-[3px] border-white rounded-full" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={
                          "text-base truncate " +
                          (unread > 0 ? 'font-black text-gray-900' : 'font-bold text-gray-800')
                        }>
                          {other.name}
                        </h3>
                        <span className={
                          "text-xs whitespace-nowrap shrink-0 " +
                          (unread > 0 ? 'font-black text-blue-600' : 'font-bold text-gray-400')
                        }>
                          {timeAgo(lastMsg?.createdAt || lastMsg?.created_at || (lastMsg as any)?.createdAt || (lastMsg as any)?.created_at)}
                        </span>
                      </div>
                      {/* Listing name */}
                      <p className="text-xs font-bold text-blue-600 truncate mt-0.5">
                        {room.listing?.nama_post || 'Akun Game'}
                      </p>
                      {/* Last message text */}
                      <p className={
                        "text-sm truncate mt-0.5 " +
                        (unread > 0 ? 'font-bold text-gray-700' : 'font-medium text-gray-500')
                      }>
                        {lastMsgType === 'image'
                          ? '📷 Gambar'
                          : lastMsgType === 'offer'
                            ? `💰 Penawaran Rp ${Number(lastMsg?.harga_penawaran || (lastMsg as any)?.hargaPenawaran || 0).toLocaleString('id-ID')}`
                            : lastMsgText || 'Belum ada pesan'}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {unread > 0 && (
                      <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black border-[3px] border-gray-900 shadow-[2px_2px_0px_#111827] shrink-0">
                        {unread > 99 ? '99+' : unread}
                      </div>
                    )}

                    {/* Chevron */}
                    <svg className="w-5 h-5 text-gray-400 shrink-0 hidden sm:block group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
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
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{filteredRooms.length} PERCAKAPAN AKTIF</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
