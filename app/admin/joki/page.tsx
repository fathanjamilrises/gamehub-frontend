'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { adminFetch } from '@/lib/adminFetch'
import { useToast } from '@/lib/contexts/ToastContext'
import { WorkerProfile, JokiOrder } from '@/lib/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

export default function AdminJokiPage() {
  const { success: showSuccess, error: showError } = useToast()
  
  const [activeTab, setActiveTab] = useState<'workers' | 'orders'>('workers')
  const [workers, setWorkers] = useState<WorkerProfile[]>([])
  const [orders, setOrders] = useState<JokiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Modal states
  const [assigningOrder, setAssigningOrder] = useState<JokiOrder | null>(null)
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      // Fetch workers
      let fetchedWorkers: WorkerProfile[] = []
      try {
        const rw = await adminFetch('/api-proxy/admin/workers')
        if (rw.ok) {
          const dw = await rw.json()
          fetchedWorkers = dw.data || []
        } else {
          const errData = await rw.json().catch(() => ({}))
          showError(errData.message || errData.error || 'Gagal memuat data worker dari server')
        }
      } catch (err) {
        console.error('Error fetching workers:', err)
        showError('Gagal menghubungi server untuk data worker')
      }
      setWorkers(fetchedWorkers)

      // Fetch orders
      let fetchedOrders: JokiOrder[] = []
      try {
        const ro = await adminFetch('/api-proxy/admin/joki-orders')
        if (ro.ok) {
          const do_ = await ro.json()
          fetchedOrders = do_.data || []
        } else {
          const errData = await ro.json().catch(() => ({}))
          showError(errData.message || errData.error || 'Gagal memuat data transaksi joki dari server')
        }
      } catch (err) {
        console.error('Error fetching orders:', err)
        showError('Gagal menghubungi server untuk data transaksi joki')
      }
      setOrders(fetchedOrders)

    } catch (err) {
      console.error(err)
      showError('Gagal memuat data admin joki')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  // Reset pagination and search when changing tab
  const handleTabChange = (tab: 'workers' | 'orders') => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSearch('')
  }

  const handleApproveWorker = async (id: number) => {
    try {
      const res = await adminFetch(`/api-proxy/admin/workers/${id}/approve`, { method: 'PATCH' })
      if (res.ok) {
        showSuccess('Worker disetujui!')
        fetchAdminData()
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal menyetujui worker')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal menyetujui worker')
    }
  }

  const handleOpenAssignModal = (order: JokiOrder) => {
    setAssigningOrder(order)
    setSelectedWorkerId('')
  }

  const handleAssignWorker = async () => {
    if (!assigningOrder || !selectedWorkerId) return
    setAssignLoading(true)
    try {
      const res = await adminFetch(`/api-proxy/admin/joki-orders/${assigningOrder.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: selectedWorkerId })
      })
      if (res.ok) {
        showSuccess('Worker berhasil ditugaskan!')
        setAssigningOrder(null)
        fetchAdminData()
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal menugaskan worker')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal menugaskan worker')
    } finally {
      setAssignLoading(false)
    }
  }

  // Filtering data
  const filteredWorkers = workers.filter(w => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      w.nama_lengkap?.toLowerCase().includes(q) ||
      w.user?.username?.toLowerCase().includes(q) ||
      w.no_hp?.toLowerCase().includes(q) ||
      w.bio?.toLowerCase().includes(q)
    )
  })

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      o.invoice_number?.toLowerCase().includes(q) ||
      o.nama_games?.toLowerCase().includes(q) ||
      o.rank_saat_ini?.toLowerCase().includes(q) ||
      o.rank_target?.toLowerCase().includes(q) ||
      String(o.harga).includes(q) ||
      o.status?.toLowerCase().includes(q)
    )
  })

  // Dynamic statistics
  const totalWorkers = workers.length
  const pendingWorkers = workers.filter(w => w.status === 'pending').length
  const totalOrders = orders.length
  const activeOrders = orders.filter(o => o.status === 'in_progress').length

  // Pagination helper
  const items = activeTab === 'workers' ? filteredWorkers : filteredOrders
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, items.length)
  const paginatedItems = items.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
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

  function getWorkerStatusBadge(status: string) {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
        return (
          <span className="inline-block px-2.5 py-1 bg-green-100 text-green-800 border-2 border-green-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            Aktif
          </span>
        )
      case 'pending':
        return (
          <span className="inline-block px-2.5 py-1 bg-yellow-100 text-yellow-800 border-2 border-yellow-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            Pending
          </span>
        )
      default:
        return (
          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 border-2 border-gray-600 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            {status}
          </span>
        )
    }
  }

  function getOrderStatusBadge(status: string) {
    switch (status?.toLowerCase()) {
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
      case 'in_progress':
        return (
          <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-800 border-2 border-purple-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            Dalam Proses
          </span>
        )
      case 'done':
        return (
          <span className="inline-block px-2.5 py-1 bg-teal-100 text-teal-800 border-2 border-teal-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            Selesai Worker
          </span>
        )
      case 'confirmed':
        return (
          <span className="inline-block px-2.5 py-1 bg-green-100 text-green-800 border-2 border-green-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            Selesai
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

  // Get active workers for assignment dropdown
  const activeWorkersList = workers.filter(w => w.status === 'active' || w.status === 'approved')

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
              ⚡ KELOLA JASA JOKI
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
              Kelola Jasa Joki
            </h1>
            <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Atur calon worker dan pantau semua transaksi joki.
            </p>
          </div>
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-2 px-5 py-3 bg-[#ff90e8] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Worker', value: loading ? '—' : totalWorkers, icon: '👥', color: 'bg-cyan-300' },
            { label: 'Worker Pending', value: loading ? '—' : pendingWorkers, icon: '⏳', color: 'bg-[#ffc900]' },
            { label: 'Transaksi Joki', value: loading ? '—' : totalOrders, icon: '⚡', color: 'bg-[#ff90e8]' },
            { label: 'Joki Aktif', value: loading ? '—' : activeOrders, icon: '🎮', color: 'bg-[#86efac]' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden`}
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

        {/* Tabs Selection */}
        <div className="flex gap-3">
          <button
            onClick={() => handleTabChange('workers')}
            className={`px-5 py-3 font-black text-xs md:text-sm rounded-xl border-[3px] border-gray-900 transition-all uppercase tracking-wider ${
              activeTab === 'workers'
                ? 'bg-[#ffc900] text-gray-900 shadow-[4px_4px_0px_#111827] translate-y-[-2px] translate-x-[-2px]'
                : 'bg-white text-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px]'
            }`}
          >
            👥 Kelola Worker
          </button>
          <button
            onClick={() => handleTabChange('orders')}
            className={`px-5 py-3 font-black text-xs md:text-sm rounded-xl border-[3px] border-gray-900 transition-all uppercase tracking-wider ${
              activeTab === 'orders'
                ? 'bg-cyan-300 text-gray-900 shadow-[4px_4px_0px_#111827] translate-y-[-2px] translate-x-[-2px]'
                : 'bg-white text-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px]'
            }`}
          >
            ⚡ Transaksi Joki
          </button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff90e8] rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />

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
                placeholder={activeTab === 'workers' ? "CARI NAMA, USERNAME, NO HP, ATAU BIO WORKER..." : "CARI INVOICE, GAME, RANK, HARGA..."}
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
            {activeTab === 'workers' ? (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-[3px] border-gray-900">
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">
                      Info Worker
                    </th>
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">
                      Bio
                    </th>
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-36">
                      Statistik
                    </th>
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center w-32">
                      Status
                    </th>
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest text-center w-32">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-10 h-10 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
                          <p className="font-black text-gray-900 uppercase tracking-widest text-xs">
                            Memuat data worker...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <p className="text-4xl mb-3">👥</p>
                        <p className="font-black text-gray-900 uppercase tracking-wider text-base">
                          Tidak ada worker ditemukan
                        </p>
                        <p className="text-xs font-bold text-gray-500 mt-1">
                          {search ? 'Coba ubah kata kunci pencarian.' : 'Belum ada data worker saat ini.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    (paginatedItems as WorkerProfile[]).map((worker) => (
                      <tr key={worker.id} className="border-b-[3px] border-gray-900 last:border-b-0 hover:bg-gray-50/80 transition-colors">
                        <td className="p-4 border-r-[3px] border-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 border-[2px] border-gray-900 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-[1px_1px_0px_#111827]">
                              {worker.foto_url ? (
                                <img src={resolveImageUrl(worker.foto_url)} alt={worker.nama_lengkap} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-black bg-[#ffc900]">
                                  👤
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-gray-900 text-sm truncate">{worker.nama_lengkap || 'Unknown'}</p>
                              <p className="text-xs text-gray-500 font-bold">@{worker.user?.username || 'user'}</p>
                              <p className="text-xs text-blue-600 font-bold">{worker.no_hp || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 border-r-[3px] border-gray-900 text-xs font-bold text-gray-600 max-w-[250px] whitespace-normal break-words leading-relaxed">
                          {worker.bio || '—'}
                        </td>
                        <td className="p-4 border-r-[3px] border-gray-900 text-xs font-bold text-gray-700 leading-normal">
                          <div className="flex items-center gap-1">⭐ <span>{Number(worker.rating || 0).toFixed(1)}</span></div>
                          <div className="mt-0.5 text-gray-500">{worker.total_order || 0} Order</div>
                        </td>
                        <td className="p-4 border-r-[3px] border-gray-900 text-center">
                          {getWorkerStatusBadge(worker.status)}
                        </td>
                        <td className="p-4 text-center">
                          {worker.status === 'pending' ? (
                            <button
                              onClick={() => handleApproveWorker(worker.id)}
                              className="bg-[#86efac] text-gray-900 text-[10px] font-black px-2.5 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-green-400 transition-all uppercase"
                            >
                              Setujui
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
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-[3px] border-gray-900">
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-44">
                      Invoice
                    </th>
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">
                      Game / Layanan
                    </th>
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">
                      Target Rank
                    </th>
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center w-36">
                      Status
                    </th>
                    <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest text-center w-40">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-10 h-10 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
                          <p className="font-black text-gray-900 uppercase tracking-widest text-xs">
                            Memuat data transaksi...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <p className="text-4xl mb-3">⚡</p>
                        <p className="font-black text-gray-900 uppercase tracking-wider text-base">
                          Tidak ada transaksi ditemukan
                        </p>
                        <p className="text-xs font-bold text-gray-500 mt-1">
                          {search ? 'Coba ubah kata kunci pencarian.' : 'Belum ada transaksi joki saat ini.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    (paginatedItems as JokiOrder[]).map((order) => (
                      <tr key={order.id} className="border-b-[3px] border-gray-900 last:border-b-0 hover:bg-gray-50/80 transition-colors">
                        <td className="p-4 border-r-[3px] border-gray-900">
                          <p className="font-black text-gray-900 text-sm font-mono">{order.invoice_number}</p>
                          <p className="text-xs text-blue-600 font-bold mt-0.5">
                            Rp {order.harga.toLocaleString('id-ID')}
                          </p>
                        </td>
                        <td className="p-4 border-r-[3px] border-gray-900">
                          <p className="font-black text-gray-900 text-sm uppercase">{order.nama_games}</p>
                          <span className="inline-block bg-cyan-50 border border-cyan-400 text-cyan-800 text-[9px] font-black px-1.5 py-0.5 rounded mt-1 uppercase">
                            JASA JOKI
                          </span>
                        </td>
                        <td className="p-4 border-r-[3px] border-gray-900 text-xs font-bold font-mono text-blue-600 leading-normal">
                          {order.rank_saat_ini} ➡️ {order.rank_target}
                        </td>
                        <td className="p-4 border-r-[3px] border-gray-900 text-center">
                          {getOrderStatusBadge(order.status)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenAssignModal(order)}
                            className="bg-white text-gray-900 text-[10px] font-black px-2.5 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-50 transition-all uppercase"
                          >
                            Ubah / Assign Worker
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer / Pagination */}
          {!loading && items.length > 0 && (
            <div className="px-5 py-4 border-t-[3px] border-gray-900 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Summary count */}
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                Menampilkan {startIndex + 1} - {endIndex} dari {items.length} {activeTab === 'workers' ? 'worker' : 'transaksi'}
                {search ? ' (difilter)' : ''}
              </p>

              {/* Pagination controls */}
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

      {/* Assign Worker Modal */}
      {assigningOrder && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setAssigningOrder(null)}
        >
          <div
            className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b-[3px] border-gray-900 bg-cyan-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase">
                  Tugaskan Worker Joki
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                  Order: {assigningOrder.invoice_number}
                </p>
              </div>
              <button
                onClick={() => setAssigningOrder(null)}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Order Info */}
              <div className="bg-gray-50 border-2 border-gray-900 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs font-bold text-gray-700 shadow-[3px_3px_0_#111827]">
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">Game</span>
                  <p className="text-gray-950 font-black">{assigningOrder.nama_games}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">Harga</span>
                  <p className="text-blue-600 font-black">
                    Rp {assigningOrder.harga.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Progress</span>
                  <p className="text-gray-950 font-black uppercase font-mono">
                    {assigningOrder.rank_saat_ini} ➡️ {assigningOrder.rank_target}
                  </p>
                </div>
              </div>

              {/* Selection Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900">
                  Pilih Worker Aktif
                </label>
                {activeWorkersList.length > 0 ? (
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all"
                  >
                    <option value="">-- Pilih Worker --</option>
                    {activeWorkersList.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.nama_lengkap} (ID: {w.id}) - ⭐ {Number(w.rating || 0).toFixed(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-red-500 font-bold bg-red-50 border-2 border-red-200 p-3 rounded-lg">
                    Tidak ada worker aktif yang terdaftar saat ini.
                  </p>
                )}
                
                <div className="pt-2 text-center text-xs font-bold text-gray-400">ATAU</div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Masukkan ID Worker Manual
                  </label>
                  <input
                    type="text"
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 12"
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAssignWorker}
                  disabled={assignLoading || !selectedWorkerId}
                  className="flex-1 py-3.5 bg-cyan-300 text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                >
                  {assignLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      Memproses...
                    </div>
                  ) : (
                    'Tugaskan Worker'
                  )}
                </button>
                <button
                  onClick={() => setAssigningOrder(null)}
                  className="px-6 py-3.5 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
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

