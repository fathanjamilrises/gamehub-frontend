'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { adminFetch } from '@/lib/adminFetch'
import { useToast } from '@/lib/contexts/ToastContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

const sl = (s: string) => s?.toLowerCase()

const STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'waiting_payment', label: 'Menunggu Bayar' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'delivered', label: 'Dikirim' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'completed', label: 'Selesai' },
  { value: 'disputed', label: 'Dispute' },
  { value: 'refunded', label: 'Refund' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

function getStatusBadge(status: string) {
  switch (sl(status)) {
    case 'waiting_payment':
    case 'pending':
      return (
        <span className="inline-block px-2.5 py-1 bg-yellow-100 text-yellow-800 border-2 border-yellow-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Menunggu Bayar
        </span>
      )
    case 'paid':
      return (
        <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 border-2 border-blue-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Dibayar
        </span>
      )
    case 'delivered':
      return (
        <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-800 border-2 border-purple-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Dikirim
        </span>
      )
    case 'confirmed':
      return (
        <span className="inline-block px-2.5 py-1 bg-teal-100 text-teal-800 border-2 border-teal-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Dikonfirmasi
        </span>
      )
    case 'completed':
      return (
        <span className="inline-block px-2.5 py-1 bg-green-100 text-green-800 border-2 border-green-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Selesai
        </span>
      )
    case 'disputed':
      return (
        <span className="inline-block px-2.5 py-1 bg-red-100 text-red-800 border-2 border-red-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827] animate-pulse">
          Dispute
        </span>
      )
    case 'refunded':
      return (
        <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-800 border-2 border-orange-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Refund
        </span>
      )
    case 'cancelled':
      return (
        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 border-2 border-gray-600 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Dibatalkan
        </span>
      )
    default:
      return (
        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 border-2 border-gray-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          {status}
        </span>
      )
  }
}

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Resolve modal states
  const [resolveOrder, setResolveOrder] = useState<any>(null)
  const [keputusan, setKeputusan] = useState<'refund' | 'release'>('release')
  const [catatanAdmin, setCatatanAdmin] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const query = filter ? `?status=${filter}` : ''
      const res = await adminFetch(`/api-proxy/admin/akun-orders${query}`)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()
      const list = data.data?.orders || data.data || data.orders || []
      setOrders(Array.isArray(list) ? list : [])
    } catch (err: any) {
      toast(err.message || 'Gagal memuat pesanan', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    setCurrentPage(1)
  }, [filter])

  const handleResolve = async () => {
    if (!resolveOrder || !catatanAdmin.trim()) return
    setProcessing(true)
    try {
      const res = await adminFetch(`/api-proxy/admin/akun-orders/${resolveOrder.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keputusan, catatan_admin: catatanAdmin }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || 'Gagal menyelesaikan dispute')
      }
      toast(
        keputusan === 'refund'
          ? 'Dispute diselesaikan — dana dikembalikan ke pembeli.'
          : 'Dispute diselesaikan — dana diteruskan ke penjual.',
        'success'
      )
      setResolveOrder(null)
      setCatatanAdmin('')
      fetchOrders()
    } catch (err: any) {
      toast(err.message || 'Gagal menyelesaikan dispute', 'error')
    } finally {
      setProcessing(false)
    }
  }

  // Filter orders by search input at the client level
  const filteredOrders = orders.filter((order: any) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    const idMatch = String(order.id).includes(q)
    const productMatch = (order.listing?.nama_post || '').toLowerCase().includes(q)
    const gameMatch = (order.listing?.accountGame?.nama_game || '').toLowerCase().includes(q)
    const buyerMatch = (
      order.buyer?.username ||
      order.buyer?.name ||
      order.buyer?.email ||
      ''
    )
      .toLowerCase()
      .includes(q)
    const sellerMatch = (
      order.reseller?.nama_lengkap ||
      order.reseller?.store_name ||
      order.reseller?.username ||
      order.reseller?.email ||
      ''
    )
      .toLowerCase()
      .includes(q)
    return idMatch || productMatch || gameMatch || buyerMatch || sellerMatch
  })

  // Dynamic statistics
  const totalCount = orders.length
  const disputeCount = orders.filter((o) => sl(o.status) === 'disputed').length
  const paidCount = orders.filter((o) => sl(o.status) === 'paid').length
  const completedCount = orders.filter((o) => ['confirmed', 'completed'].includes(sl(o.status))).length

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredOrders.length)
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Page numbers generator for navigation buttons
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
              📦 KELOLA PESANAN AKUN
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
              Pesanan Akun
            </h1>
            <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Kelola semua transaksi jual beli akun game, pantau status pembayaran, dan selesaikan dispute.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-5 py-3 bg-[#ff90e8] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Pesanan', value: loading ? '—' : totalCount, icon: '📦', color: 'bg-cyan-300' },
            { label: 'Pesanan Dispute', value: loading ? '—' : disputeCount, icon: '⚠️', color: 'bg-red-300' },
            { label: 'Pesanan Dibayar', value: loading ? '—' : paidCount, icon: '💳', color: 'bg-[#ffc900]' },
            { label: 'Pesanan Selesai', value: loading ? '—' : completedCount, icon: '✅', color: 'bg-[#86efac]' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden ${
                stat.label === 'Pesanan Dispute' && disputeCount > 0 ? 'bg-red-50/75 animate-pulse' : ''
              }`}
            >
              <div className={`absolute top-0 right-0 w-12 h-12 rounded-bl-2xl border-b-[3px] border-l-[3px] border-gray-900 ${stat.color}`} />
              <p className="text-3xl mb-1">{stat.icon}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilter(opt.value)
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 font-black text-xs rounded-lg border-2 border-gray-900 transition-all uppercase tracking-wider ${
                filter === opt.value
                  ? 'bg-gray-900 text-white shadow-none'
                  : 'bg-white text-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-px hover:translate-x-px'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Main Table Card */}
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />

          {/* Search bar inside container */}
          <div className="p-5 md:p-6 border-b-[3px] border-gray-900 relative z-10">
            <div className="relative w-full max-w-md">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="CARI ID, PRODUK, GAME, SELLER, ATAU BUYER..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-black uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-[3px] border-gray-900">
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-20">
                    ID
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">
                    Produk / Detail Akun
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-44">
                    Pembeli
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-44">
                    Penjual
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-40">
                    Harga Jual
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center w-36">
                    Status
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center w-36">
                    Tanggal
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest text-center w-28">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
                        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">
                          Memuat data pesanan...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center">
                      <p className="text-4xl mb-3">📦</p>
                      <p className="font-black text-gray-900 uppercase tracking-wider text-base">
                        Tidak ada pesanan ditemukan
                      </p>
                      <p className="text-xs font-bold text-gray-500 mt-1">
                        {search || filter
                          ? 'Coba ubah kata kunci pencarian atau filter status.'
                          : 'Belum ada pesanan terdaftar saat ini.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order: any) => (
                    <tr
                      key={order.id}
                      className={`border-b-[3px] border-gray-900 last:border-b-0 hover:bg-gray-50/80 transition-colors ${
                        sl(order.status) === 'disputed' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* ID Column */}
                      <td className="p-4 text-sm font-black text-gray-900 border-r-[3px] border-gray-900 font-mono">
                        #{order.id}
                      </td>

                      {/* Product Detail Column */}
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 border-[2px] border-gray-900 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-[1px_1px_0px_#111827]">
                            {order.listing?.accountGame?.gambar_game ? (
                              <img
                                src={resolveImageUrl(order.listing.accountGame.gambar_game)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-black bg-[#ffc900]">
                                🎮
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate max-w-[200px]">
                              {order.listing?.nama_post || '-'}
                            </p>
                            <span className="inline-block bg-cyan-50 border border-cyan-400 text-cyan-800 text-[9px] font-black px-1.5 py-0.5 rounded mt-1 uppercase">
                              {order.listing?.accountGame?.nama_game || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Buyer Column */}
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <div className="text-xs font-bold text-gray-900">
                          {order.buyer?.username || order.buyer?.name || `User #${order.id_user}`}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">
                          {order.buyer?.email || '—'}
                        </div>
                      </td>

                      {/* Seller Column */}
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <div className="text-xs font-bold text-gray-900">
                          {order.reseller?.nama_lengkap || order.reseller?.store_name || `Reseller #${order.id_reseller}`}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">
                          {order.reseller?.email || order.reseller?.user?.email || '—'}
                        </div>
                      </td>

                      {/* Price Column */}
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <span className="text-sm font-black text-blue-600">
                          Rp {Number(order.harga || order.total_bayar || 0).toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="p-4 text-center border-r-[3px] border-gray-900">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Date Column */}
                      <td className="p-4 text-center border-r-[3px] border-gray-900 font-bold text-gray-500 text-xs">
                        {new Date(order.createdAt || order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action Column */}
                      <td className="p-4 text-center">
                        {sl(order.status) === 'disputed' ? (
                          <button
                            onClick={() => {
                              setResolveOrder(order)
                              setKeputusan('release')
                              setCatatanAdmin('')
                            }}
                            className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-red-700 transition-all uppercase"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          {!loading && filteredOrders.length > 0 && (
            <div className="px-5 py-4 border-t-[3px] border-gray-900 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Summary */}
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                Menampilkan {startIndex + 1} - {endIndex} dari {filteredOrders.length} pesanan
                {search || filter ? ' (difilter)' : ''}
              </p>

              {/* Controls */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border-2 border-gray-900 rounded-lg text-xs font-black uppercase text-gray-900 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-px transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                  >
                    Prev
                  </button>

                  {getPageNumbers().map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof p === 'number' && setCurrentPage(p)}
                      disabled={p === '...'}
                      className={`px-3 py-1.5 border-2 border-gray-900 rounded-lg text-xs font-black transition-all ${
                        currentPage === p
                          ? 'bg-[#ffc900] text-gray-900 shadow-none'
                          : p === '...'
                          ? 'bg-transparent border-none text-gray-500 cursor-default'
                          : 'bg-white text-gray-900 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-px'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border-2 border-gray-900 rounded-lg text-xs font-black uppercase text-gray-900 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-px transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Items Per Page Selector */}
              <div className="flex items-center justify-end gap-2 shrink-0">
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                  Tampilkan:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border-2 border-gray-900 rounded-lg px-2.5 py-1 text-xs font-black bg-white focus:outline-none focus:shadow-[2px_2px_0_#2563eb] transition-all"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Dispute Modal */}
      {resolveOrder && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setResolveOrder(null)}
        >
          <div
            className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b-[3px] border-gray-900 bg-red-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase">
                  Resolve Dispute #ORD-{resolveOrder.id}
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                  ID Transaksi: #{resolveOrder.id}
                </p>
              </div>
              <button
                onClick={() => setResolveOrder(null)}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Order Context Grid */}
              <div className="bg-gray-50 border-2 border-gray-900 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs font-bold text-gray-700 shadow-[3px_3px_0_#111827]">
                <div className="col-span-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Akun Game / Produk</span>
                  <p className="text-gray-950 font-black truncate">{resolveOrder.listing?.nama_post || '-'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">Game</span>
                  <p className="text-gray-950 font-black">{resolveOrder.listing?.accountGame?.nama_game || '-'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">Total Dana</span>
                  <p className="text-blue-600 font-black">
                    Rp {Number(resolveOrder.harga || resolveOrder.total_bayar || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">Penjual</span>
                  <p className="text-gray-950 truncate">
                    {resolveOrder.reseller?.nama_lengkap || resolveOrder.reseller?.store_name || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">Pembeli</span>
                  <p className="text-gray-950 truncate">
                    {resolveOrder.buyer?.username || resolveOrder.buyer?.name || '-'}
                  </p>
                </div>
              </div>

              {/* Dispute Reason Info */}
              {resolveOrder.catatan_dispute && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                  <span className="text-xs font-black text-red-600 uppercase tracking-wide">
                    Alasan Dispute Pembeli:
                  </span>
                  <p className="text-sm font-bold text-gray-700 mt-1 leading-relaxed">
                    {resolveOrder.catatan_dispute}
                  </p>
                </div>
              )}

              {/* Decisions Decision Selection */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2.5">
                  Pilih Keputusan Admin
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Release to Seller */}
                  <button
                    type="button"
                    onClick={() => setKeputusan('release')}
                    className={`p-4 rounded-xl border-[3px] border-gray-900 font-black text-sm transition-all relative overflow-hidden ${
                      keputusan === 'release'
                        ? 'bg-green-200 text-green-950 shadow-[4px_4px_0_#111827] translate-y-[-2px] translate-x-[-2px]'
                        : 'bg-white text-gray-600 hover:bg-gray-50/80 shadow-[2px_2px_0_#111827] hover:translate-y-px'
                    }`}
                  >
                    <p className="text-2xl mb-1">✅</p>
                    <span className="uppercase tracking-wider">Release Dana</span>
                    <p className="text-[8px] font-black text-green-800/80 mt-1 leading-none">
                      DANA AKAN DITERUSKAN KE PENJUAL
                    </p>
                  </button>

                  {/* Refund to Buyer */}
                  <button
                    type="button"
                    onClick={() => setKeputusan('refund')}
                    className={`p-4 rounded-xl border-[3px] border-gray-900 font-black text-sm transition-all relative overflow-hidden ${
                      keputusan === 'refund'
                        ? 'bg-orange-200 text-orange-950 shadow-[4px_4px_0_#111827] translate-y-[-2px] translate-x-[-2px]'
                        : 'bg-white text-gray-600 hover:bg-gray-50/80 shadow-[2px_2px_0_#111827] hover:translate-y-px'
                    }`}
                  >
                    <p className="text-2xl mb-1">💰</p>
                    <span className="uppercase tracking-wider">Refund Pembeli</span>
                    <p className="text-[8px] font-black text-orange-800/80 mt-1 leading-none">
                      DANA KEMBALI KE SALDO PEMBELI
                    </p>
                  </button>
                </div>
              </div>

              {/* Catatan Admin Form */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                  Catatan Alasan Admin
                </label>
                <textarea
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder="Berikan alasan keputusan ini (wajib)..."
                  rows={3}
                  className="w-full resize-none border-[3px] border-gray-900 rounded-xl p-4 font-bold text-sm text-gray-900 focus:outline-none focus:border-blue-600 transition-all shadow-[4px_4px_0_#111827] bg-white placeholder:text-gray-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleResolve}
                  disabled={processing || !catatanAdmin.trim()}
                  className={`flex-1 py-3.5 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 ${
                    keputusan === 'refund'
                      ? 'bg-orange-500 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {processing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses...
                    </div>
                  ) : keputusan === 'refund' ? (
                    'Proses Refund Pembeli'
                  ) : (
                    'Proses Release ke Penjual'
                  )}
                </button>
                <button
                  onClick={() => setResolveOrder(null)}
                  className="px-6 py-3.5 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
