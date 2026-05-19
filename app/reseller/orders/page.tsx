'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { orderAkunApi } from '@/lib/orderAkunApi'
import { useToast } from '@/lib/contexts/ToastContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

export default function SellerOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const data = (await orderAkunApi.getSellerOrders()) as any
        console.log('SELLER ORDERS DATA:', data)
        setOrders(Array.isArray(data) ? data : (data.orders || data.data || []))
      } catch (error: any) {
        console.error('Fetch orders error:', error)
        toast(error.message || 'Gagal memuat pesanan masuk', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [toast])

  const sl = (status: string) => status?.toLowerCase()

  const getStatusBadge = (status: string) => {
    switch (sl(status)) {
      case 'waiting_payment':
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 border-2 border-amber-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#b45309]">Menunggu Pembayaran</span>
      case 'paid':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border-2 border-emerald-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#047857]">Perlu Dikirim</span>
      case 'delivered':
        return <span className="px-3 py-1 bg-violet-100 text-violet-700 border-2 border-violet-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#6d28d9]">Data Dikirim</span>
      case 'confirmed':
        return <span className="px-3 py-1 bg-teal-100 text-teal-700 border-2 border-teal-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#0f766e]">Dikonfirmasi</span>
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 border-2 border-green-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#15803d]">Selesai</span>
      case 'disputed':
        return <span className="px-3 py-1 bg-red-100 text-red-700 border-2 border-red-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#b91c1c]">Dispute</span>
      case 'refunded':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 border-2 border-orange-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#c2410c]">Refund</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 border-2 border-gray-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#374151]">{status}</span>
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true
    if (filter === 'PERLU_DIKIRIM') return sl(order.status) === 'paid'
    if (filter === 'SELESAI') return ['confirmed', 'completed'].includes(sl(order.status))
    if (filter === 'DISPUTE') return sl(order.status) === 'disputed'
    return true
  })

  // Hitung statistik
  const totalPesanan = orders.length
  const perluDikirim = orders.filter(o => sl(o.status) === 'paid').length
  const totalDana = orders.reduce((acc, o) => acc + Number(o.harga || o.total_bayar || 0), 0)

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section with Gradient Card */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 border-[3px] border-gray-900 rounded-2xl p-6 mb-8 shadow-[6px_6px_0_#111827] text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Pesanan Masuk</h1>
              <p className="font-bold text-violet-100 mt-1">Pantau pesanan akun game yang masuk dari pembeli.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/reseller" className="px-4 py-2 bg-white text-gray-900 font-black text-sm rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[1px] hover:translate-x-[1px] transition-all">
                Dashboard Seller
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0_#111827]">
            <span className="text-xs font-black text-gray-400 uppercase">Total Pesanan</span>
            <p className="text-3xl font-black text-gray-900">{totalPesanan}</p>
          </div>
          <div className="bg-amber-50 border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0_#111827]">
            <span className="text-xs font-black text-amber-600 uppercase">Perlu Dikirim</span>
            <p className="text-3xl font-black text-amber-700">{perluDikirim}</p>
          </div>
          <div className="bg-emerald-50 border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0_#111827]">
            <span className="text-xs font-black text-emerald-600 uppercase">Total Pendapatan</span>
            <p className="text-3xl font-black text-emerald-700">Rp {totalDana.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-2 font-black text-sm rounded-lg border-2 border-gray-900 transition-all ${filter === 'ALL' ? 'bg-violet-600 text-white shadow-[2px_2px_0_#111827]' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>
            Semua Pesanan
          </button>
          <button onClick={() => setFilter('PERLU_DIKIRIM')} className={`px-4 py-2 font-black text-sm rounded-lg border-2 border-gray-900 transition-all ${filter === 'PERLU_DIKIRIM' ? 'bg-amber-500 text-white shadow-[2px_2px_0_#111827]' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>
            Perlu Dikirim
          </button>
          <button onClick={() => setFilter('SELESAI')} className={`px-4 py-2 font-black text-sm rounded-lg border-2 border-gray-900 transition-all ${filter === 'SELESAI' ? 'bg-emerald-600 text-white shadow-[2px_2px_0_#111827]' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>
            Selesai
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-10 text-center shadow-[6px_6px_0_#111827]">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-900">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Belum Ada Pesanan</h3>
            <p className="text-gray-500 font-bold">Belum ada pesanan dengan kategori ini.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[8px_8px_0_#111827] transition-all flex flex-col md:flex-row">
                
                {/* Left Accent Bar */}
                <div className={`w-full md:w-3 ${sl(order.status) === 'paid' ? 'bg-amber-500' : ['confirmed', 'completed'].includes(sl(order.status)) ? 'bg-emerald-500' : sl(order.status) === 'disputed' ? 'bg-red-500' : 'bg-gray-300'} border-b-[3px] md:border-b-0 md:border-r-[3px] border-gray-900`} />

                <div className="flex-1 flex flex-col">
                  {/* Card Header */}
                  <div className="p-4 border-b-2 border-gray-900 flex flex-col sm:flex-row justify-between gap-3 bg-gray-50">
                    <div>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Kode Pesanan</span>
                      <h2 className="font-black text-gray-900">#ORD-{order.id}</h2>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      {getStatusBadge(order.status)}
                      <span className="text-sm font-bold text-gray-500">
                        {new Date(order.createdAt || order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col lg:flex-row justify-between gap-6 flex-1">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg border-2 border-gray-900 shrink-0 overflow-hidden shadow-[3px_3px_0_#111827]">
                        {order.listing?.accountGame?.gambar_game ? (
                          <img src={resolveImageUrl(order.listing.accountGame.gambar_game)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-400">G</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-lg">{order.listing?.nama_post || 'Judul Akun'}</h3>
                        <p className="text-sm font-bold text-gray-500">Game: {order.listing?.accountGame?.nama_game || '-'}</p>
                        <p className="text-sm font-bold text-gray-500">Pembeli: <span className="text-gray-700">{order.pembeli?.name || `ID #${order.id_pembeli || '-'}`}</span></p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Total Dana</span>
                        <p className="text-2xl font-black text-emerald-600">Rp {Number(order.harga || order.total_bayar || 0).toLocaleString('id-ID')}</p>
                      </div>

                      <Link href={`/reseller/orders/${order.id}`} className={`w-full text-center px-4 py-2.5 font-black text-sm rounded-lg border-2 border-gray-900 transition-all ${sl(order.status) === 'paid' ? 'bg-amber-500 text-white shadow-[3px_3px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px]' : 'bg-white text-gray-900 shadow-[3px_3px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px]'}`}>
                        {sl(order.status) === 'paid' ? 'Kirim Data Akun' : 'Detail Pesanan'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
