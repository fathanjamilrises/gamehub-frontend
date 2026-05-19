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
      return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 border-2 border-yellow-700 rounded-lg font-bold text-[11px]">Menunggu Bayar</span>
    case 'paid':
      return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border-2 border-blue-700 rounded-lg font-bold text-[11px]">Dibayar</span>
    case 'delivered':
      return <span className="px-2.5 py-1 bg-violet-100 text-violet-700 border-2 border-violet-700 rounded-lg font-bold text-[11px]">Dikirim</span>
    case 'confirmed':
      return <span className="px-2.5 py-1 bg-teal-100 text-teal-700 border-2 border-teal-700 rounded-lg font-bold text-[11px]">Dikonfirmasi</span>
    case 'completed':
      return <span className="px-2.5 py-1 bg-green-100 text-green-700 border-2 border-green-700 rounded-lg font-bold text-[11px]">Selesai</span>
    case 'disputed':
      return <span className="px-2.5 py-1 bg-red-100 text-red-700 border-2 border-red-700 rounded-lg font-bold text-[11px]">Dispute</span>
    case 'refunded':
      return <span className="px-2.5 py-1 bg-orange-100 text-orange-700 border-2 border-orange-700 rounded-lg font-bold text-[11px]">Refund</span>
    case 'cancelled':
      return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 border-2 border-gray-600 rounded-lg font-bold text-[11px]">Dibatalkan</span>
    default:
      return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border-2 border-gray-700 rounded-lg font-bold text-[11px]">{status}</span>
  }
}

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  // Resolve modal
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
        keputusan === 'refund' ? 'Dispute diselesaikan — dana dikembalikan ke pembeli.' : 'Dispute diselesaikan — dana diteruskan ke penjual.',
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

  const disputeCount = orders.filter(o => sl(o.status) === 'disputed').length

  return (
    <AdminShell>
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
          📦 KELOLA PESANAN AKUN
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">Pesanan Akun</h1>
        <p className="text-gray-600 font-bold text-sm mt-2">Kelola semua transaksi jual beli akun game.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-[3px] border-gray-900 rounded-xl p-4 shadow-[4px_4px_0px_#111827]">
          <p className="text-xs font-black text-gray-400 uppercase">Total</p>
          <p className="text-2xl font-black text-gray-900">{orders.length}</p>
        </div>
        <div className={`border-[3px] border-gray-900 rounded-xl p-4 shadow-[4px_4px_0px_#111827] ${disputeCount > 0 ? 'bg-red-50' : 'bg-white'}`}>
          <p className="text-xs font-black text-red-500 uppercase">Dispute</p>
          <p className="text-2xl font-black text-red-600">{disputeCount}</p>
        </div>
        <div className="bg-white border-[3px] border-gray-900 rounded-xl p-4 shadow-[4px_4px_0px_#111827]">
          <p className="text-xs font-black text-blue-500 uppercase">Dibayar</p>
          <p className="text-2xl font-black text-blue-600">{orders.filter(o => sl(o.status) === 'paid').length}</p>
        </div>
        <div className="bg-white border-[3px] border-gray-900 rounded-xl p-4 shadow-[4px_4px_0px_#111827]">
          <p className="text-xs font-black text-green-500 uppercase">Selesai</p>
          <p className="text-2xl font-black text-green-600">{orders.filter(o => ['confirmed', 'completed'].includes(sl(o.status))).length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
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

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-12 text-center shadow-[6px_6px_0_#111827]">
          <p className="text-xl font-black text-gray-900 mb-1">Tidak Ada Pesanan</p>
          <p className="text-sm font-bold text-gray-500">Belum ada pesanan dengan filter ini.</p>
        </div>
      ) : (
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-[3px] border-gray-900 bg-gray-50">
                  <th className="text-left px-4 py-3 font-black text-xs text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 font-black text-xs text-gray-500 uppercase tracking-wider">Produk</th>
                  <th className="text-left px-4 py-3 font-black text-xs text-gray-500 uppercase tracking-wider">Pembeli</th>
                  <th className="text-left px-4 py-3 font-black text-xs text-gray-500 uppercase tracking-wider">Penjual</th>
                  <th className="text-left px-4 py-3 font-black text-xs text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="text-left px-4 py-3 font-black text-xs text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-black text-xs text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-4 py-3 font-black text-xs text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {orders.map((order: any) => (
                  <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${sl(order.status) === 'disputed' ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-3 font-black text-gray-900">#{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {order.listing?.accountGame?.gambar_game && (
                          <img src={resolveImageUrl(order.listing.accountGame.gambar_game)} className="w-8 h-8 rounded border border-gray-300 object-cover" />
                        )}
                        <span className="font-bold text-gray-900 truncate max-w-[150px]">{order.listing?.nama_post || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700">{order.pembeli?.name || order.pembeli?.username || `#${order.id_pembeli}`}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">{order.penjual?.name || order.penjual?.username || `#${order.id_penjual}`}</td>
                    <td className="px-4 py-3 font-black text-blue-600">Rp {Number(order.harga || order.total_bayar || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 font-bold text-gray-500 text-xs">{new Date(order.createdAt || order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      {sl(order.status) === 'disputed' ? (
                        <button
                          onClick={() => { setResolveOrder(order); setKeputusan('release'); setCatatanAdmin('') }}
                          className="px-3 py-1.5 bg-red-600 text-white font-black text-xs rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-px hover:translate-x-px transition-all"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs font-bold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setResolveOrder(null)}>
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b-[3px] border-gray-900 bg-red-50">
              <h2 className="text-lg font-black text-gray-900 uppercase">Resolve Dispute #ORD-{resolveOrder.id}</h2>
              <p className="text-xs font-bold text-gray-500 mt-1">Produk: {resolveOrder.listing?.nama_post || '-'}</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Dispute Info */}
              {resolveOrder.catatan_dispute && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                  <span className="text-xs font-black text-red-500 uppercase">Alasan Dispute dari Pembeli:</span>
                  <p className="text-sm font-bold text-gray-700 mt-1">{resolveOrder.catatan_dispute}</p>
                </div>
              )}

              {/* Keputusan */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-2">Keputusan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setKeputusan('release')}
                    className={`p-4 rounded-xl border-2 border-gray-900 font-black text-sm transition-all ${
                      keputusan === 'release'
                        ? 'bg-green-100 text-green-800 shadow-[3px_3px_0_#111827]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-lg mb-1">✅</p>
                    Release Dana
                    <p className="text-[10px] font-bold text-gray-400 mt-1">Dana ke penjual</p>
                  </button>
                  <button
                    onClick={() => setKeputusan('refund')}
                    className={`p-4 rounded-xl border-2 border-gray-900 font-black text-sm transition-all ${
                      keputusan === 'refund'
                        ? 'bg-orange-100 text-orange-800 shadow-[3px_3px_0_#111827]'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-lg mb-1">💰</p>
                    Refund Pembeli
                    <p className="text-[10px] font-bold text-gray-400 mt-1">Dana kembali ke pembeli</p>
                  </button>
                </div>
              </div>

              {/* Catatan Admin */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase block mb-1">Catatan Admin</label>
                <textarea
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder="Jelaskan alasan keputusan Anda..."
                  rows={3}
                  className="w-full resize-none border-2 border-gray-900 rounded-xl p-4 font-bold text-sm text-gray-900 focus:outline-none focus:border-blue-600 transition-all shadow-[4px_4px_0_#111827] bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleResolve}
                  disabled={processing || !catatanAdmin.trim()}
                  className={`flex-1 py-3 font-black uppercase tracking-wider text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50 ${
                    keputusan === 'refund'
                      ? 'bg-orange-500 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {processing ? 'Memproses...' : keputusan === 'refund' ? 'Refund Pembeli' : 'Release ke Penjual'}
                </button>
                <button
                  onClick={() => setResolveOrder(null)}
                  className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
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
