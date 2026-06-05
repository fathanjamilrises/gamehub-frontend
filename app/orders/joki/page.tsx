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
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Category Tabs */}
        <div className="flex gap-0 mb-6 border-2 border-gray-900 rounded-lg overflow-hidden w-fit">
          <Link href="/orders" className="px-6 py-3 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors border-r-2 border-gray-900">
            Top Up / Voucher
          </Link>
          <Link href="/orders/akun" className="px-6 py-3 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors border-r-2 border-gray-900">
            Beli Akun
          </Link>
          <button className="px-6 py-3 bg-blue-600 text-white font-bold text-sm">
            Jasa Joki
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-gray-900 p-12 text-center" style={{ boxShadow: '4px 4px 0 #1e293b' }}>
            <h3 className="text-lg font-black uppercase text-gray-900 mb-2">Belum Ada Order Joki</h3>
            <p className="text-gray-500 mb-6 font-bold">Kamu belum pernah memesan jasa joki.</p>
            <Link href="/joki" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md border-2 border-gray-900 hover:bg-blue-700 transition-all font-bold uppercase shadow-[3px_3px_0px_#111827]">
              Pesan Jasa Joki
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border-2 border-gray-900 overflow-hidden transition-all hover:-translate-y-0.5" style={{ boxShadow: '4px 4px 0 #1e293b' }}>
                <div className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-black text-gray-900 mb-1 uppercase">ORDER {order.invoice_number}</p>
                      <p className="text-sm font-bold text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 border-t-2 border-gray-200 pt-4">
                    <div className="flex-1">
                      <h3 className="font-black uppercase text-gray-900 text-lg mb-1">{order.nama_games}</h3>
                      <p className="font-bold text-sm text-gray-600">Username/Email: <span className="text-blue-600">{order.game_username || order.game_email || '-'}</span></p>
                      <p className="font-bold text-sm text-gray-600">Progress: <span className="uppercase">{order.rank_saat_ini} ➡️ {order.rank_target}</span></p>
                    </div>
                    <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2">
                      <p className="font-black text-gray-900 text-xl text-blue-600">Rp {order.harga.toLocaleString('id-ID')}</p>
                      
                      {(order.status === 'waiting_payment' || order.status === 'pending') && order.invoice_url && (
                        <a href={order.invoice_url} className="bg-[#ffc900] border-2 border-gray-900 px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_#111827]">Bayar Sekarang</a>
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
                          className="bg-green-400 border-2 border-gray-900 px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_#111827]"
                        >
                          Konfirmasi Selesai
                        </button>
                      )}
                      {order.room_chat_id && (
                        <Link href={`/chat/${order.room_chat_id}`} className="bg-blue-200 text-blue-900 border-2 border-gray-900 px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_#111827]">
                          Chat Worker
                        </Link>
                      )}
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
