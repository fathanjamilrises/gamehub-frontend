'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { chatApi, ChatMessage, ChatRoom } from '@/lib/chatApi'
import { connectChatSocket, joinRoom, leaveRoom, emitTyping, emitStopTyping, emitMarkRead, disconnectChatSocket } from '@/lib/chatSocket'
import { getStoredUser } from '@/lib/authApi'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/contexts/ToastContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Hari ini'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ChatRoomPage() {
  const params = useParams()
  const roomId = Number(params?.roomId)
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [offerPrice, setOfferPrice] = useState('')
  const [showListingInfo, setShowListingInfo] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<any>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch room detail & messages
  useEffect(() => {
    if (!roomId) return
    const init = async () => {
      setLoading(true)
      try {
        const [roomData, msgData] = await Promise.all([
          chatApi.getRoomDetail(roomId),
          chatApi.getMessages(roomId),
        ])
        setRoom(roomData)
        setMessages(msgData.messages.reverse())
        chatApi.markRead(roomId)
      } catch (err: any) {
        console.error('Init chat error:', err)
        toast(err.message || 'Gagal memuat chat', 'error')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [roomId, toast])

  // Connect WebSocket
  useEffect(() => {
    if (!roomId) return

    let socket: any
    try {
      socket = connectChatSocket()
      joinRoom(roomId)

      socket.on('new_message', (data: any) => {
        if (Number(data.room_id) === roomId) {
          setMessages((prev) => [...prev, data.message || data])
          emitMarkRead(roomId)
          setTimeout(scrollToBottom, 100)
        }
      })

      socket.on('user_typing', (data: any) => {
        if (Number(data.room_id) === roomId) setOtherTyping(true)
      })

      socket.on('user_stop_typing', (data: any) => {
        if (Number(data.room_id) === roomId) setOtherTyping(false)
      })
    } catch (err) {
      console.warn('WebSocket connection failed, using REST fallback:', err)
    }

    return () => {
      leaveRoom(roomId)
    }
  }, [roomId, scrollToBottom])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      emitTyping(roomId)
    }
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      emitStopTyping(roomId)
    }, 2000)
  }

  // Send text message
  const handleSend = async () => {
    if (!inputText.trim() || sending) return
    const text = inputText.trim()
    setInputText('')
    setSending(true)
    emitStopTyping(roomId)
    setIsTyping(false)

    try {
      const msg = await chatApi.sendMessage(roomId, text)
      setMessages((prev) => [...prev, msg])
      setTimeout(scrollToBottom, 100)
    } catch (err: any) {
      toast(err.message || 'Gagal mengirim pesan', 'error')
      setInputText(text)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // Send offer
  const handleSendOffer = async () => {
    const price = Number(offerPrice.replace(/\D/g, ''))
    if (!price || sending) return
    setSending(true)
    try {
      const msg = await chatApi.sendOffer(roomId, price)
      setMessages((prev) => [...prev, msg])
      setShowOffer(false)
      setOfferPrice('')
      setTimeout(scrollToBottom, 100)
    } catch (err: any) {
      toast(err.message || 'Gagal mengirim penawaran', 'error')
    } finally {
      setSending(false)
    }
  }

  // Respond to offer
  const handleRespondOffer = async (msgId: number, action: string) => {
    try {
      await chatApi.respondOffer(roomId, msgId, action)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, status_penawaran: action as any } : m
        )
      )
      toast(action === 'accepted' ? 'Penawaran diterima!' : 'Penawaran ditolak', action === 'accepted' ? 'success' : 'error')
    } catch (err: any) {
      toast(err.message || 'Gagal merespon penawaran', 'error')
    }
  }

  // Send image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSending(true)
    try {
      const msg = await chatApi.sendImage(roomId, file)
      setMessages((prev) => [...prev, msg])
      setTimeout(scrollToBottom, 100)
    } catch (err: any) {
      toast(err.message || 'Gagal mengirim gambar', 'error')
    } finally {
      setSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const getOtherUser = () => {
    if (!currentUser || !room) return { name: 'User', avatar: '' }
    
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

  const isMine = (msg: any) => {
    const senderId = msg.sender_id || msg.id_pengirim || msg.userId || msg.id_user || msg.sender?.id || msg.pengirim?.id;
    const currentId = currentUser?.id === 'undefined' ? undefined : (currentUser?.id || (currentUser as any)?.id_user);
    
    if (senderId && currentId && String(senderId) === String(currentId)) return true;
    
    const senderUsername = msg.sender?.username || msg.pengirim?.username;
    if (senderUsername && currentUser?.username && senderUsername === currentUser.username) return true;

    return false;
  }

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = []
  messages.forEach((msg) => {
    const dateStr = formatDate(msg.createdAt || msg.created_at)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === dateStr) {
      last.msgs.push(msg)
    } else {
      groupedMessages.push({ date: dateStr, msgs: [msg] })
    }
  })

  if (loading) {
    return (
      <div className="h-dvh bg-gray-100 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white border-[3px] border-gray-900 p-8 rounded-2xl shadow-[8px_8px_0px_#111827]">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
          <p className="font-black text-gray-900 uppercase tracking-widest text-sm">Memuat Chat...</p>
        </div>
      </div>
    )
  }

  const other = getOtherUser()

  return (
    <div className="h-dvh flex flex-col bg-gray-100 overflow-hidden">
      {/* ── Chat Header ── */}
      <header className="shrink-0 bg-white border-b-[3px] border-gray-900 z-30">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-3 flex items-center gap-3">
          {/* Back button */}
          <Link href="/chat" className="w-10 h-10 flex items-center justify-center rounded-xl border-[3px] border-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_#111827] shrink-0">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-[3px] border-gray-900 bg-gradient-to-br from-[#ffc900]/30 to-[#ff90e8]/30 flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_#111827]">
              {other.avatar ? (
                <img src={resolveImageUrl(other.avatar)} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-base sm:text-lg font-black text-gray-900">{other.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[3px] border-white rounded-full" />
          </div>

          {/* Name & status */}
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-sm sm:text-base truncate">{other.name}</h2>
            <p className="text-xs font-bold text-gray-500 truncate">
              {otherTyping ? (
                <span className="text-blue-600 animate-pulse">Sedang mengetik...</span>
              ) : (
                <span className="text-green-600">Online</span>
              )}
            </p>
          </div>

        </div>
      </header>

      {/* ── Sticky Product Card ── */}
      {room?.listing && (
        <div className="shrink-0 sticky top-0 z-20 bg-white border-b-[3px] border-gray-900 px-3 sm:px-5 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            {/* Product image */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-[3px] border-gray-900 overflow-hidden bg-white shrink-0 shadow-[2px_2px_0px_#111827]">
              {room.listing.accountGame?.gambar_game ? (
                <img src={resolveImageUrl(room.listing.accountGame.gambar_game)} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full bg-[#ffc900]/30 flex items-center justify-center text-lg font-black">🎮</div>
              )}
            </div>

            {/* Product details */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-black text-gray-900 truncate leading-tight">{room.listing.nama_post}</p>
              {room.listing.accountGame?.nama_game && (
                <p className="text-[11px] sm:text-xs font-bold text-gray-500 truncate mt-0.5">
                  🎮 {room.listing.accountGame.nama_game}
                </p>
              )}
              <p className="text-sm sm:text-base font-black text-blue-600 mt-0.5">
                Rp {Number(room.listing.harga || 0).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Status badge */}
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 border-2 border-green-600 rounded-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-black text-green-700 uppercase tracking-wider">Tersedia</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages Area ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
          <div className="space-y-4">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-5">
                  <span className="bg-white text-gray-600 text-[11px] font-black px-4 py-1.5 rounded-full border-[3px] border-gray-900 shadow-[2px_2px_0px_#111827] uppercase tracking-wider">
                    {group.date}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {group.msgs.map((msg) => {
                    const mine = isMine(msg)

                    // System message
                    if (msg.tipe === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <p className="text-[11px] font-bold text-gray-500 bg-gray-200 px-4 py-1.5 rounded-full">{msg.isi_pesan}</p>
                        </div>
                      )
                    }

                    // Offer message
                    if (msg.tipe === 'offer') {
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`w-[280px] sm:w-[320px] rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] overflow-hidden ${mine ? 'bg-blue-50' : 'bg-[#ffc900]/20'}`}>
                            <div className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-[3px] border-gray-900 ${mine ? 'bg-blue-200 text-blue-900' : 'bg-[#ffc900] text-gray-900'}`}>
                              💰 Penawaran Harga
                            </div>
                            <div className="p-5 text-center">
                              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                                Rp {Number(msg.harga_penawaran || 0).toLocaleString('id-ID')}
                              </p>
                              {msg.status_penawaran === 'pending' && !mine && (
                                <div className="flex gap-2 mt-4">
                                  <button
                                    onClick={() => handleRespondOffer(msg.id, 'accepted')}
                                    className="flex-1 py-2.5 bg-green-600 text-white font-black text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase tracking-wider"
                                  >
                                    Terima
                                  </button>
                                  <button
                                    onClick={() => handleRespondOffer(msg.id, 'rejected')}
                                    className="flex-1 py-2.5 bg-red-500 text-white font-black text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase tracking-wider"
                                  >
                                    Tolak
                                  </button>
                                </div>
                              )}
                              {msg.status_penawaran === 'accepted' && (
                                <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 border-[3px] border-green-600 px-3 py-1.5 rounded-lg">
                                  <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>
                                  <span className="text-xs font-black text-green-700 uppercase">Diterima</span>
                                </div>
                              )}
                              {msg.status_penawaran === 'rejected' && (
                                <div className="mt-3 inline-flex items-center gap-1.5 bg-red-100 border-[3px] border-red-500 px-3 py-1.5 rounded-lg">
                                  <svg width="14" height="14" fill="none" stroke="#dc2626" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/></svg>
                                  <span className="text-xs font-black text-red-700 uppercase">Ditolak</span>
                                </div>
                              )}
                            </div>
                            <div className="px-4 pb-2 text-right">
                              <span className="text-[10px] font-bold text-gray-400">{formatTime(msg.createdAt || msg.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // Image message
                    if (msg.tipe === 'image') {
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[240px] sm:max-w-[300px] rounded-2xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] overflow-hidden ${mine ? 'bg-blue-600' : 'bg-white'}`}>
                            <div className="p-1.5">
                              <img
                                src={resolveImageUrl(msg.url_gambar)}
                                className="w-full rounded-xl object-cover"
                                alt="gambar chat"
                              />
                            </div>
                            <div className="px-3 pb-2 text-right">
                              <span className={`text-[10px] font-bold ${mine ? 'text-blue-200' : 'text-gray-400'}`}>{formatTime(msg.createdAt || msg.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // Text message
                    return (
                      <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={
                            "max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl border-[3px] border-gray-900 " +
                            (mine
                              ? 'bg-blue-600 text-white rounded-br-lg shadow-[3px_3px_0px_#1d4ed8]'
                              : 'bg-white text-gray-900 rounded-bl-lg shadow-[3px_3px_0px_#111827]')
                          }
                        >
                          <p className="text-sm font-bold whitespace-pre-wrap break-words leading-relaxed">{msg.isi_pesan}</p>
                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            <span className={`text-[10px] font-bold ${mine ? 'text-blue-200' : 'text-gray-400'}`}>
                              {formatTime(msg.createdAt || msg.created_at)}
                            </span>
                            {mine && msg.is_read && (
                              <svg width="14" height="14" fill="none" stroke={mine ? '#93c5fd' : '#9ca3af'} strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {otherTyping && (
              <div className="flex justify-start">
                <div className="px-5 py-3.5 bg-white border-[3px] border-gray-900 rounded-2xl rounded-bl-lg shadow-[3px_3px_0px_#111827]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* ── Offer Panel ── */}
      {showOffer && (
        <div className="shrink-0 border-t-[3px] border-gray-900 bg-[#ffc900]/20">
          <div className="max-w-5xl mx-auto px-3 sm:px-5 py-3">
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-gray-900 text-xs uppercase tracking-widest">💰 Kirim Penawaran</p>
              <button onClick={() => setShowOffer(false)} className="w-7 h-7 flex items-center justify-center rounded-lg border-[3px] border-gray-900 bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_#111827]">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-500 text-sm">Rp</span>
                <input
                  type="text"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full pl-11 pr-4 py-3 border-[3px] border-gray-900 rounded-xl font-black text-gray-900 text-base shadow-[3px_3px_0px_#111827] focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] bg-white transition-all"
                />
              </div>
              <button
                onClick={handleSendOffer}
                disabled={!offerPrice || sending}
                className="px-5 sm:px-8 py-3 bg-[#ffc900] text-gray-900 font-black text-sm rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all disabled:opacity-50 uppercase tracking-wider"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="shrink-0 bg-white border-t-[3px] border-gray-900">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3">
          {/* Action buttons */}
          <div className="flex gap-1.5 shrink-0">
            {/* Image upload */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center rounded-xl border-[3px] border-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_#111827]"
              title="Kirim gambar"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </button>

            {/* Offer button */}
            <button
              onClick={() => setShowOffer(!showOffer)}
              className={
                "w-10 h-10 flex items-center justify-center rounded-xl border-[3px] border-gray-900 transition-colors shadow-[2px_2px_0px_#111827] " +
                (showOffer ? 'bg-[#ffc900] text-gray-900' : 'bg-gray-50 hover:bg-gray-100 text-gray-600')
              }
              title="Kirim penawaran"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
          </div>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ketik pesan..."
            className="flex-1 min-w-0 px-4 py-3 border-[3px] border-gray-900 rounded-xl font-bold text-sm text-gray-900 focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] bg-gray-50 focus:bg-white transition-all placeholder:text-gray-400"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className={
              "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl border-[3px] border-gray-900 transition-all shrink-0 " +
              (inputText.trim() && !sending
                ? 'bg-blue-600 text-white shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px]'
                : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed')
            }
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3 21l18-9L3 3l3 9zm0 0h7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
