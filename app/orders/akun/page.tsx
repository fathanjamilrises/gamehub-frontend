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
              <h1 className="text-lg font-bold text-gray-900">Pesanan Saya</h1>
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
        <div className="flex gap-0 mb-6 border-2 border-gray-900 rounded-lg overflow-hidden w-fit">
          <Link href="/orders" className="px-6 py-3 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors border-r-2 border-gray-900">
            Top Up / Voucher
          </Link>
          <button className="px-6 py-3 bg-blue-600 text-white font-bold text-sm border-r-2 border-gray-900">
            Beli Akun
          </button>
          <Link href="/orders/joki" className="px-6 py-3 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
            Jasa Joki
          </Link>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-gray-900 p-12 text-center" style={{ boxShadow: '4px 4px 0 #1e293b' }}>
            <div className="w-24 h-24 bg-blue-50 border-2 border-gray-900 rounded-md flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 11h14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Pesanan Akun</h3>
            <p className="text-gray-500 mb-6">Kamu belum pernah melakukan pembelian akun game.</p>
            <Link href="/accounts" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md border-2 border-gray-900 hover:bg-blue-700 transition-all font-bold">
              Jelajahi Akun
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-lg border-2 border-gray-900 overflow-hidden transition-all hover:-translate-y-0.5" style={{ boxShadow: '4px 4px 0 #1e293b' }}>
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">#{order.invoice_number || `ORD-${order.id}`}</p>
                      <p className="text-sm text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-md border-2 border-gray-900 overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {order.listing?.accountGame?.gambar_game ? (
                        <img src={resolveImageUrl(order.listing.accountGame.gambar_game)} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-300">A</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{order.listing?.nama_post || 'Akun Game'}</h3>
                      <p className="text-sm text-gray-500 mt-1">Game: {order.listing?.accountGame?.nama_game || '-'}</p>
                      <p className="text-sm text-gray-500">Penjual: {order.listing?.reseller?.store_name || 'Toko'}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-bold text-gray-900">Rp {Number(order.total_bayar || order.harga || 0).toLocaleString('id-ID')}</p>
                      <div className="flex gap-2">
                        {(s(order.status) === 'waiting_payment' || s(order.status) === 'pending') && (order.payment_url || order.xendit_invoice_url || order.invoice_url) && (
                          <a href={order.payment_url || order.xendit_invoice_url || order.invoice_url} rel="noopener noreferrer" className="px-3 py-1.5 bg-yellow-300 text-gray-900 rounded-md border-2 border-gray-900 text-xs font-bold hover:bg-yellow-400 transition-colors">
                            Bayar
                          </a>
                        )}
                        <Link href={`/my-orders/${order.id}`} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md border-2 border-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors">
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
