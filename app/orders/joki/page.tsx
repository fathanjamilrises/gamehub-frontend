'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { authFetch } from '@/lib/authApi'
import { useToast } from '@/lib/contexts/ToastContext'
import { JokiOrder } from '@/lib/types'
import { AnimatePresence, motion } from 'framer-motion'

export default function OrdersJokiPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<JokiOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionModalConfig, setActionModalConfig] = useState({
    title: '',
    description: '',
    confirmText: '',
    confirmColor: 'bg-blue-600',
    onConfirm: () => {}
  })

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api-proxy/joki-orders/my')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || [])
      } else {
        // mock for UI if no backend
        setOrders([
          {
            id: 1,
            invoice_number: 'JKI-1716970000000-A1B2C3',
            status: 'done',
            harga: 150000,
            nama_games: 'Mobile Legends',
            rank_saat_ini: 'Epic',
            rank_target: 'Mythic',
            game_username: 'Fathan123',
            login_type: 'moonton',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      }
    } catch (error: any) {
      console.error('Fetch orders error:', error)
      toast(error.message || 'Gagal memuat riwayat pesanan', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleConfirmDone = async (id: number) => {
    try {
      const res = await authFetch(`/api-proxy/joki-orders/my/${id}/confirm`, {
        method: 'POST'
      })
      if (res.ok) {
        toast('Order dikonfirmasi selesai!', 'success')
        fetchOrders()
      } else {
        toast('Simulasi order dikonfirmasi!', 'success')
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'confirmed' } : o))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting_payment':
      case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border-2 border-yellow-700 rounded-md font-bold text-xs uppercase">Menunggu Pembayaran</span>
      case 'paid': return <span className="px-3 py-1 bg-blue-100 text-blue-700 border-2 border-blue-700 rounded-md font-bold text-xs uppercase">Menunggu Worker</span>
      case 'in_progress': return <span className="px-3 py-1 bg-purple-100 text-purple-700 border-2 border-purple-700 rounded-md font-bold text-xs uppercase">Sedang Dijoki</span>
      case 'done': return <span className="px-3 py-1 bg-orange-100 text-orange-700 border-2 border-orange-700 rounded-md font-bold text-xs uppercase">Selesai (Menunggu Konfirmasi)</span>
      case 'confirmed': return <span className="px-3 py-1 bg-green-100 text-green-700 border-2 border-green-700 rounded-md font-bold text-xs uppercase">Selesai ✅</span>
      case 'cancelled': return <span className="px-3 py-1 bg-gray-100 text-gray-600 border-2 border-gray-600 rounded-md font-bold text-xs uppercase">Dibatalkan</span>
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 border-2 border-gray-700 rounded-md font-bold text-xs uppercase">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b-2 border-gray-900 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 border-2 border-gray-900 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="font-bold text-gray-900 text-lg hidden sm:block">GameHub.ID</span>
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-black text-gray-900 uppercase">Pesanan Saya</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-sm text-gray-700 font-medium hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:block">Beranda</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Category Tabs */}
        <div className="flex gap-0 mb-8 border-[3px] border-gray-900 rounded-xl overflow-hidden w-fit shadow-[4px_4px_0_#111827] bg-white">
          <Link href="/orders" className="px-8 py-3.5 bg-white text-gray-900 font-black text-sm uppercase tracking-wider hover:bg-blue-50 transition-colors border-r-[3px] border-gray-900">
            Top Up / Voucher
          </Link>
          <Link href="/orders/akun" className="px-8 py-3.5 bg-white text-gray-900 font-black text-sm uppercase tracking-wider hover:bg-blue-50 transition-colors border-r-[3px] border-gray-900">
            Beli Akun
          </Link>
          <button className="px-8 py-3.5 bg-blue-600 text-white font-black text-sm uppercase tracking-wider hover:bg-blue-700 transition-colors">
            Jasa Joki
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-16 h-16 border-[6px] border-gray-900 border-t-blue-600 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border-[3px] border-gray-900 p-16 text-center shadow-[8px_8px_0_#111827]">
            <div className="w-28 h-28 bg-blue-100 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_#111827] -rotate-3">
              <svg className="w-14 h-14 text-blue-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-wide mb-3">Belum Ada Order Joki</h3>
            <p className="text-gray-500 font-bold mb-8">Kamu belum pernah memesan jasa joki.</p>
            <Link
              href="/joki"
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl border-[3px] border-gray-900 hover:bg-blue-700 transition-all font-black uppercase tracking-wider shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px]"
            >
              Pesan Jasa Joki
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[6px_6px_0_#111827] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_#111827]">
                <div className="p-5 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b-[3px] border-dashed border-gray-200">
                    <div>
                      <p className="text-lg font-black text-gray-900 uppercase tracking-widest">ORDER {order.invoice_number}</p>
                      <p className="text-sm font-bold text-gray-500 mt-1">{(order as any).createdAt || order.created_at ? new Date((order as any).createdAt || order.created_at!).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-900 text-xl uppercase truncate">{order.nama_games}</h3>
                      <p className="text-sm font-bold text-gray-600 mt-3 bg-gray-50 p-2 rounded-lg border-2 border-gray-200 inline-block">
                        Username/Email: <span className="text-blue-600">{order.game_username || order.game_email || '-'}</span>
                      </p>
                      <p className="text-sm font-bold text-gray-600 mt-2">Progress: <span className="uppercase text-gray-900">{order.rank_saat_ini} ➡️ {order.rank_target}</span></p>
                    </div>
                    <div className="sm:text-right flex flex-col sm:items-end justify-center gap-2 mt-4 sm:mt-0">
                      <p className="font-black text-2xl text-blue-600 drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">Rp {order.harga.toLocaleString('id-ID')}</p>
                      
                      <div className="flex gap-2 mt-2">
                        {(order.status === 'waiting_payment' || order.status === 'pending') && order.invoice_url && (
                          <a href={order.invoice_url} className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg border-[3px] border-gray-900 text-sm font-black uppercase tracking-wider hover:bg-yellow-500 transition-colors shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[1px] hover:translate-x-[1px]">Bayar Sekarang</a>
                        )}

                        {order.status === 'done' && (
                          <button 
                            onClick={() => {
                              setActionModalConfig({
                                title: 'Konfirmasi Selesai',
                                description: 'Apakah pesanan joki ini benar-benar sudah selesai dan sesuai harapan?',
                                confirmText: 'Ya, Konfirmasi',
                                confirmColor: 'bg-green-400',
                                onConfirm: () => handleConfirmDone(order.id)
                              })
                              setActionModalOpen(true)
                            }} 
                            className="px-4 py-2 bg-green-400 text-gray-900 rounded-lg border-[3px] border-gray-900 text-sm font-black uppercase tracking-wider hover:bg-green-500 transition-colors shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[1px] hover:translate-x-[1px]"
                          >
                            Konfirmasi Selesai
                          </button>
                        )}
                        {order.room_chat_id && (
                          <Link href={`/chat/${order.room_chat_id}`} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg border-[3px] border-blue-800 text-sm font-black uppercase tracking-wider hover:bg-blue-200 transition-colors shadow-[2px_2px_0_#1e40af] hover:shadow-[1px_1px_0_#1e40af] hover:translate-y-[1px] hover:translate-x-[1px]">
                            Chat Worker
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Generic Action Modal */}
      <AnimatePresence>
        {actionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setActionModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-sm overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className={`p-5 border-b-[3px] border-gray-900 ${actionModalConfig.confirmColor} flex items-center justify-between`}>
                <h2 className="text-md font-black text-gray-900 uppercase">
                  {actionModalConfig.title}
                </h2>
                <button 
                  onClick={() => setActionModalOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-bold text-gray-600">{actionModalConfig.description}</p>
                
                <div className="flex gap-3 pt-4 border-t border-dashed border-gray-200">
                  <button 
                    onClick={() => {
                      actionModalConfig.onConfirm()
                      setActionModalOpen(false)
                    }}
                    className={`flex-1 py-3 ${actionModalConfig.confirmColor} text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all`}
                  >
                    {actionModalConfig.confirmText}
                  </button>
                  <button 
                    onClick={() => setActionModalOpen(false)} 
                    className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
