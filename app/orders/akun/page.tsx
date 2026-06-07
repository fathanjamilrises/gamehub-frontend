'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function OrdersAkunPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const data = (await orderAkunApi.getMyOrders()) as any
        setOrders(Array.isArray(data) ? data : (data.orders || data.data || []))
      } catch (error: any) {
        console.error('Fetch orders error:', error)
        toast(error.message || 'Gagal memuat riwayat pesanan', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [toast])

  const s = (status: string) => status?.toLowerCase()

  const getStatusBadge = (status: string) => {
    switch (s(status)) {
      case 'waiting_payment':
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border-2 border-yellow-700 rounded-md font-bold text-xs">Menunggu Pembayaran</span>
      case 'paid':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 border-2 border-blue-700 rounded-md font-bold text-xs">Dibayar (Escrow)</span>
      case 'delivered':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 border-2 border-purple-700 rounded-md font-bold text-xs">Data Dikirim</span>
      case 'confirmed':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border-2 border-emerald-700 rounded-md font-bold text-xs">Dikonfirmasi</span>
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 border-2 border-green-700 rounded-md font-bold text-xs">Selesai</span>
      case 'disputed':
        return <span className="px-3 py-1 bg-red-100 text-red-700 border-2 border-red-700 rounded-md font-bold text-xs">Dispute</span>
      case 'refunded':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 border-2 border-orange-700 rounded-md font-bold text-xs">Dana Dikembalikan</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 border-2 border-gray-600 rounded-md font-bold text-xs">Dibatalkan</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 border-2 border-gray-700 rounded-md font-bold text-xs">{status}</span>
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
          <button className="px-8 py-3.5 bg-blue-600 text-white font-black text-sm uppercase tracking-wider border-r-[3px] border-gray-900 hover:bg-blue-700 transition-colors">
            Beli Akun
          </button>
          <Link href="/orders/joki" className="px-8 py-3.5 bg-white text-gray-900 font-black text-sm uppercase tracking-wider hover:bg-blue-50 transition-colors">
            Jasa Joki
          </Link>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 11h14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-wide mb-3">Belum Ada Pesanan Akun</h3>
            <p className="text-gray-500 font-bold mb-8">Kamu belum pernah melakukan pembelian akun game.</p>
            <Link
              href="/accounts"
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl border-[3px] border-gray-900 hover:bg-blue-700 transition-all font-black uppercase tracking-wider shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px]"
            >
              Jelajahi Akun
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[6px_6px_0_#111827] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_#111827]">
                <div className="p-5 sm:p-7">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b-[3px] border-dashed border-gray-200">
                    <div>
                      <p className="text-lg font-black text-gray-900 uppercase tracking-widest">#{order.invoice_number || `ORD-${order.id}`}</p>
                      <p className="text-sm font-bold text-gray-500 mt-1">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-20 h-20 rounded-xl border-[3px] border-gray-900 overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center shadow-[3px_3px_0_#111827]">
                      {order.listing?.accountGame?.gambar_game ? (
                        <img src={resolveImageUrl(order.listing.accountGame.gambar_game)} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-3xl font-black text-gray-400">A</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-900 text-xl uppercase truncate">{order.listing?.nama_post || 'Akun Game'}</h3>
                      <p className="text-sm font-bold text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg border-2 border-gray-200 inline-block">Game: {order.listing?.accountGame?.nama_game || '-'}</p>
                      <p className="text-sm font-bold text-gray-500 mt-2">Penjual: {order.listing?.reseller?.store_name || 'Toko'}</p>
                    </div>
                    <div className="sm:text-right flex flex-col sm:items-end justify-center gap-2 mt-4 sm:mt-0">
                      <p className="font-black text-2xl text-blue-600 drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">Rp {Number(order.total_bayar || order.harga || 0).toLocaleString('id-ID')}</p>
                      <div className="flex gap-2 mt-2">
                        {(s(order.status) === 'waiting_payment' || s(order.status) === 'pending') && (order.payment_url || order.xendit_invoice_url || order.invoice_url) && (
                          <a href={order.payment_url || order.xendit_invoice_url || order.invoice_url} rel="noopener noreferrer" className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg border-[3px] border-gray-900 text-sm font-black uppercase tracking-wider hover:bg-yellow-500 transition-colors shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[1px] hover:translate-x-[1px]">
                            Bayar
                          </a>
                        )}
                        <Link href={`/my-orders/${order.id}`} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg border-[3px] border-blue-800 text-sm font-black uppercase tracking-wider hover:bg-blue-200 transition-colors shadow-[2px_2px_0_#1e40af] hover:shadow-[1px_1px_0_#1e40af] hover:translate-y-[1px] hover:translate-x-[1px]">
                          Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
