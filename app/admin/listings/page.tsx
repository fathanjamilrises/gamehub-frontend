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

interface Listing {
  id: number
  nama_post: string
  slug: string
  harga_jual: string
  status_listing: string
  tipe_transaksi: string
  view_count: number
  createdAt: string
  accountGame?: { id: number; nama_game: string }
  reseller?: { id: number; nama_lengkap: string }
  screenshots?: any[]
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const { success: showSuccess, error: showError } = useToast()

  const fetchListings = async () => {
    try {
      setLoading(true)
      const res = await adminFetch('/api-proxy/admin/jual-beli-akun')
      const data = await res.json()
      if (res.ok) {
        setListings(data.data || [])
      } else {
        showError(data.message || 'Gagal memuat listing')
      }
    } catch (err) {
      showError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  const handleApprove = async (id: number, approve: boolean) => {
    setActionLoading(id)
    try {
      const res = await adminFetch(`/api-proxy/admin/jual-beli-akun/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve })
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess(approve ? 'Listing berhasil di-approve!' : 'Listing berhasil di-reject!')
        fetchListings()
      } else {
        showError(data.message || 'Gagal mengubah status')
      }
    } catch (err) {
      showError('Terjadi kesalahan')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus listing ini?')) return
    setActionLoading(id)
    try {
      const res = await adminFetch(`/api-proxy/admin/jual-beli-akun/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showSuccess('Listing berhasil dihapus')
        fetchListings()
      } else {
        const data = await res.json()
        showError(data.message || 'Gagal menghapus')
      }
    } catch (err) {
      showError('Terjadi kesalahan')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-lg border-2 border-green-700 uppercase">Aktif</span>
      case 'sold':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-lg border-2 border-red-700 uppercase">Terjual</span>
      case 'rejected':
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[10px] font-black rounded-lg border-2 border-gray-700 uppercase">Ditolak</span>
      default:
        return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded-lg border-2 border-yellow-600 uppercase">Pending</span>
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Listing Akun</h1>
            <p className="text-sm font-bold text-gray-500">Kelola dan approve listing jual-beli akun game.</p>
          </div>
          <button
            onClick={fetchListings}
            className="bg-[#ffc900] text-gray-900 border-[3px] border-gray-900 px-4 py-2 rounded-xl text-sm font-black shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[5px_5px_0px_#111827]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-[3px] border-gray-900">
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">ID</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">Judul</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">Game</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">Harga</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center">Status</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm font-bold text-gray-500">Memuat data...</td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm font-bold text-gray-500">Belum ada listing.</td>
                  </tr>
                ) : (
                  listings.map((item) => (
                    <tr key={item.id} className="border-b-[3px] border-gray-900 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-bold text-gray-900 border-r-[3px] border-gray-900">#{item.id}</td>
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <p className="text-sm font-black text-gray-900 line-clamp-1">{item.nama_post}</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString('id-ID')}
                          {item.reseller && ` • ${item.reseller.nama_lengkap}`}
                        </p>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-600 border-r-[3px] border-gray-900">
                        {item.accountGame?.nama_game || '-'}
                      </td>
                      <td className="p-4 text-sm font-black text-green-600 border-r-[3px] border-gray-900">
                        Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center border-r-[3px] border-gray-900">
                        {getStatusBadge(item.status_listing)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {item.status_listing === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(item.id, true)}
                                disabled={actionLoading === item.id}
                                className="bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase disabled:opacity-50"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleApprove(item.id, false)}
                                disabled={actionLoading === item.id}
                                className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase disabled:opacity-50"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={actionLoading === item.id}
                            className="bg-gray-800 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
