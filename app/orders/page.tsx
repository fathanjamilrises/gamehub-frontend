'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatRupiah } from '@/lib/types'
import { Order } from '@/lib/dummy/orders'
import { authFetch } from '@/lib/authApi'
import { clearPendingPaymentRedirect, getPendingPaymentRedirect } from '@/lib/paymentReceipt'

const API_BASE = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '') : ''
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '')

function normalizeOrderImageSrc(value: unknown): string {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  if (trimmed.startsWith('/')) {
    return `${BACKEND_ORIGIN}${trimmed}`
  }

  return `${BACKEND_ORIGIN}/${trimmed.replace(/^\.?\//, '')}`
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const pendingRedirect = getPendingPaymentRedirect()
    if (!pendingRedirect) return
    const isFreshRedirect = Date.now() - pendingRedirect.createdAt < 1000 * 60 * 60

    if (!isFreshRedirect) return

    clearPendingPaymentRedirect()
    router.replace(`/payment/success?orderCode=${encodeURIComponent(pendingRedirect.orderCode)}&status=success`)
  }, [router])

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)

      try {
        const res = await authFetch('/api-proxy/orders')
        const data = await res.json()

        if (res.ok && data.success) {
          const rawOrders = Array.isArray(data.data) ? data.data : (data.data?.orders || [])
          
          const mappedOrders: Order[] = rawOrders.map((item: any) => ({
            id: String(item.id),
            orderCode: item.invoice_number,
            date: item.createdAt,
            status: 
              item.status === 'success' ? 'completed' : 
              item.status === 'waiting_payment' ? 'pending_payment' : 
              item.status,
            game: {
              name: item.nama_games || 'Game',
              publisher: '',
              image: normalizeOrderImageSrc(item.image_url)
            },
            item: {
              name: item.nama_produk || 'Item',
              amount: 0,
              price: parseInt(item.harga_produk) || 0
            },
            playerId: item.id_player,
            serverId: item.id_server,
            nickname: item.nickname,
            payment: {
              method: 'Xendit',
              total: parseInt(item.harga_produk) || 0,
              fee: 0
            },
            xenditInvoiceUrl: item.xendit_invoice_url
          }))

          // Apply client-side filtering if needed, but for now show all from API
          let filtered = mappedOrders
          if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            filtered = mappedOrders.filter(o => 
              o.orderCode.toLowerCase().includes(lowerQuery) || 
              o.game.name.toLowerCase().includes(lowerQuery)
            )
          }
          if (filterStatus !== 'all') {
            filtered = filtered.filter(o => o.status === filterStatus)
          }

          setOrders(filtered)
        }
      } catch (err) {
        console.error('Fetch orders error:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchOrders()
  }, [filterStatus, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled in useEffect
  }

  const checkPaymentStatus = async (orderCode: string) => {
    // Mock payment check - simulate success for demo
    alert('Pembayaran berhasil! Pesanan akan segera diproses.')
  }

  const viewReceipt = (order: Order) => {
    setSelectedOrder(order)
    setShowReceipt(true)
  }

  const hasOrderImage = (image: string) => image.trim() !== ''

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md border-2 border-green-700 bg-green-100 text-green-700 text-sm font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Selesai
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md border-2 border-yellow-700 bg-yellow-100 text-yellow-700 text-sm font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Menunggu
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md border-2 border-blue-700 bg-blue-100 text-blue-700 text-sm font-bold">
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Diproses
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md border-2 border-red-700 bg-red-100 text-red-700 text-sm font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Dibatalkan
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
              <h1 className="text-lg font-bold text-gray-900">Riwayat Pesanan</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-gray-700 font-medium hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:block">Beranda</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-gray-700 font-medium hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:block">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="flex gap-0 mb-6 border-2 border-gray-900 rounded-lg overflow-hidden w-fit">
          <button className="px-6 py-3 bg-blue-600 text-white font-bold text-sm border-r-2 border-gray-900">
            Top Up / Voucher
          </button>
          <Link href="/orders/akun" className="px-6 py-3 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors border-r-2 border-gray-900">
            Beli Akun
          </Link>
          <Link href="/orders/joki" className="px-6 py-3 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
            Jasa Joki
          </Link>
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-lg border-2 border-gray-900 p-4 mb-6 nb-shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'completed', label: 'Selesai' },
                { value: 'processing', label: 'Diproses' },
                { value: 'pending', label: 'Menunggu' },
                { value: 'cancelled', label: 'Dibatalkan' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all border-2 border-gray-900 ${
                    filterStatus === filter.value
                      ? 'bg-blue-600 text-white nb-shadow-sm'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 sm:ml-auto">
              <input
                type="text"
                placeholder="Cari kode pesanan atau game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 sm:w-64 px-4 py-2 border-2 border-gray-900 rounded-lg text-sm focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#2563eb]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white text-gray-900 rounded-lg border-2 border-gray-900 hover:bg-gray-50 transition-colors nb-shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-gray-900 p-12 text-center nb-shadow">
            <div className="w-24 h-24 bg-blue-50 border-2 border-gray-900 rounded-md flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Pesanan</h3>
            <p className="text-gray-500 mb-6">Yuk mulai top up game favoritmu!</p>
            <Link
              href="/topup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md border-2 border-gray-900 hover:bg-blue-700 transition-all font-bold nb-shadow-sm hover:-translate-y-px"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Mulai Top Up
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border-2 border-gray-900 overflow-hidden nb-shadow transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1e293b]"
              >
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{order.orderCode}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      {(order.status === 'pending' || order.status === 'pending_payment') && (
                        <button
                          onClick={() => checkPaymentStatus(order.orderCode)}
                          className="px-4 py-2 bg-yellow-300 text-gray-900 rounded-md border-2 border-gray-900 text-sm font-bold hover:bg-yellow-400 transition-colors"
                        >
                          Cek Status
                        </button>
                      )}
                      <button
                        onClick={() => viewReceipt(order)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md border-2 border-blue-600 text-sm font-bold hover:bg-blue-100 transition-colors"
                      >
                        Lihat Nota
                      </button>
                    </div>
                  </div>

                  {/* Processing progress bar */}
                  {order.status === 'processing' && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        <span className="text-xs text-blue-600 font-bold">Sedang diproses... Diamond akan masuk dalam beberapa detik</span>
                      </div>
                      <div className="h-2 bg-gray-100 border border-gray-900 rounded-md overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-md animate-pulse" style={{ width: '70%' }} />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-md border-2 border-gray-900 overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {hasOrderImage(order.game.image) ? (
                        <Image
                          src={order.game.image}
                          alt={order.game.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-300">
                          {order.game.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{order.game.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md border border-gray-900 text-sm font-medium">
                          {order.item.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        ID: {order.playerId}
                        {order.serverId && ` | Server: ${order.serverId}`}
                        {order.nickname && ` · ${order.nickname}`}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-bold text-gray-900">{formatRupiah(order.payment.total)}</p>
                      <p className="text-sm text-gray-500">{order.payment.method}</p>
                      {order.xenditInvoiceUrl && order.status !== 'completed' && (
                        <a
                          href={order.xenditInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 font-bold hover:underline"
                        >
                          Bayar →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Receipt Modal */}
      {showReceipt && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50"
            onClick={() => setShowReceipt(false)}
          />
          <div className="relative bg-white rounded-lg border-2 border-gray-900 nb-shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Receipt Header */}
            <div className="bg-blue-600 px-6 py-4 border-b-2 border-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white border-2 border-gray-900 rounded-md flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">G</span>
                  </div>
                  <span className="text-white font-bold">GameHub.ID</span>
                </div>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 text-center">
                <p className="text-white/80 text-sm font-bold uppercase tracking-widest">NOTA PEMBELIAN</p>
                <p className="text-white font-bold text-lg">{selectedOrder.orderCode}</p>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="text-center pb-4 border-b-2 border-gray-900">
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Game Info */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-md border-2 border-gray-900 overflow-hidden flex-shrink-0 bg-gray-100">
                  {hasOrderImage(selectedOrder.game.image) ? (
                    <Image
                      src={selectedOrder.game.image}
                      alt={selectedOrder.game.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-300">
                        {selectedOrder.game.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedOrder.game.name}</h3>
                  <p className="text-sm text-gray-500">{selectedOrder.game.publisher}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    ID: {selectedOrder.playerId}
                    {selectedOrder.serverId && ` | Server: ${selectedOrder.serverId}`}
                    {selectedOrder.nickname && ` · ${selectedOrder.nickname}`}
                  </p>
                </div>
              </div>

              {/* Item Details */}
              <div className="bg-gray-50 border-2 border-gray-900 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item</span>
                  <span className="font-bold text-gray-900">{selectedOrder.item.name}</span>
                </div>
                {selectedOrder.item.bonus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bonus</span>
                    <span className="font-bold text-green-600">{selectedOrder.item.bonus}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode Pembayaran</span>
                  <span className="font-bold text-gray-900">{selectedOrder.payment.method}</span>
                </div>
                <div className="border-t-2 border-gray-900 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatRupiah(selectedOrder.payment.total)}
                  </span>
                </div>
              </div>

              {/* Status Pesanan */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Status Pesanan</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-gray-900 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">Pesanan Dibuat</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedOrder.date)}</p>
                    </div>
                  </div>
                  {selectedOrder.status === 'completed' && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-600 border border-gray-900 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">Selesai — Diamond Masuk</p>
                        {selectedOrder.processedAt && (
                          <p className="text-xs text-gray-500">{formatDate(selectedOrder.processedAt)}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse border border-gray-900 flex-shrink-0" />
                      <p className="text-sm text-blue-600 font-bold">Sedang diproses...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Link Xendit */}
              {selectedOrder.xenditInvoiceUrl && selectedOrder.status !== 'completed' && (
                <a
                  href={selectedOrder.xenditInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md border-2 border-gray-900 text-sm font-bold text-center transition-all nb-shadow-sm hover:-translate-y-px"
                >
                  Lanjutkan Pembayaran →
                </a>
              )}

              {/* Footer */}
              <div className="text-center pt-4 border-t-2 border-gray-900">
                <p className="text-xs text-gray-500">
                  Terima kasih telah berbelanja di GameHub.ID
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tanggal: {formatDate(selectedOrder.date)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
