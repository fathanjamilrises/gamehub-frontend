'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { adminFetch } from '@/lib/adminFetch'
import { useToast } from '@/lib/contexts/ToastContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

interface WithdrawItem {
  id: number
  jumlah: number
  status: string
  catatan_reseller?: string
  catatan_admin?: string
  alasan_penolakan?: string
  bukti_transfer_url?: string
  createdAt: string
  updatedAt: string
  reseller?: {
    id: number
    nama_lengkap: string
    store_name?: string
  }
  bank_account?: {
    id: number
    nama_bank: string
    tipe: string
    nomor_rekening: string
    nama_pemilik: string
  }
}

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Diproses' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'completed', label: 'Selesai' },
  { value: 'rejected', label: 'Ditolak' },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 border-2 border-yellow-700 rounded-lg font-bold text-[11px]">Pending</span>
    case 'processing':
      return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border-2 border-blue-700 rounded-lg font-bold text-[11px]">Diproses</span>
    case 'approved':
      return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 border-2 border-indigo-700 rounded-lg font-bold text-[11px]">Disetujui</span>
    case 'completed':
      return <span className="px-2.5 py-1 bg-green-100 text-green-700 border-2 border-green-700 rounded-lg font-bold text-[11px]">Selesai</span>
    case 'rejected':
      return <span className="px-2.5 py-1 bg-red-100 text-red-700 border-2 border-red-700 rounded-lg font-bold text-[11px]">Ditolak</span>
    case 'cancelled':
      return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 border-2 border-gray-400 rounded-lg font-bold text-[11px]">Dibatalkan</span>
    default:
      return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 border-2 border-gray-400 rounded-lg font-bold text-[11px]">{status}</span>
  }
}

export default function AdminWithdrawalsPage() {
  const { success: showSuccess, error: showError } = useToast()
  const [withdrawals, setWithdrawals] = useState<WithdrawItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedWd, setSelectedWd] = useState<WithdrawItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [noteAdmin, setNoteAdmin] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [buktiUrl, setBuktiUrl] = useState('')

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (statusFilter) query.set('status', statusFilter)
      if (search) query.set('search', search)
      query.set('page', page.toString())
      const qs = query.toString()
      const res = await adminFetch(`/api-proxy/admin/withdraw${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const raw = data.data || data
      setWithdrawals(raw.withdrawals || raw.data || [])
      setTotalPages(raw.total_pages || raw.totalPages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter, page])

  const handleSearch = () => {
    setPage(1)
    fetchWithdrawals()
  }

  const doAction = async (action: string) => {
    if (!selectedWd) return
    setActionLoading(true)
    try {
      let body: any = {}
      let method = 'PUT'
      let url = `/api-proxy/admin/withdraw/${selectedWd.id}/${action}`

      if (action === 'process') {
        body = { catatan_admin: noteAdmin || undefined }
      } else if (action === 'approve') {
        body = { bukti_transfer_url: buktiUrl || undefined, catatan_admin: noteAdmin || undefined }
      } else if (action === 'complete') {
        if (!buktiUrl.trim()) {
          showError('Bukti transfer URL wajib diisi untuk menyelesaikan')
          setActionLoading(false)
          return
        }
        body = { bukti_transfer_url: buktiUrl, catatan_admin: noteAdmin || undefined }
      } else if (action === 'reject') {
        if (!rejectReason.trim()) {
          showError('Alasan penolakan wajib diisi')
          setActionLoading(false)
          return
        }
        body = { alasan_penolakan: rejectReason, catatan_admin: noteAdmin || undefined }
      }

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal memproses')
      }
      showSuccess(`Penarikan berhasil di-${action}`)
      setSelectedWd(null)
      setNoteAdmin('')
      setRejectReason('')
      setBuktiUrl('')
      fetchWithdrawals()
    } catch (err: any) {
      showError(err.message || 'Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Manajemen Penarikan</h1>
            <p className="text-sm text-gray-500">Kelola permintaan penarikan dana reseller</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cari reseller..."
              className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold">
              Cari
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                statusFilter === tab.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-10 h-10 border-[3px] border-gray-900 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-lg font-bold text-gray-500">Tidak ada data penarikan</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Reseller</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Rekening</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Jumlah</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tanggal</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map(wd => (
                    <tr key={wd.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-bold text-gray-900">#{wd.id}</td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-gray-900">{wd.reseller?.store_name || wd.reseller?.nama_lengkap || '-'}</p>
                      </td>
                      <td className="p-4">
                        {wd.bank_account ? (
                          <div>
                            <p className="text-xs font-bold text-gray-900">{wd.bank_account.nama_bank}</p>
                            <p className="text-xs text-gray-500">{wd.bank_account.nomor_rekening} - {wd.bank_account.nama_pemilik}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-black text-gray-900">Rp {wd.jumlah.toLocaleString('id-ID')}</td>
                      <td className="p-4">{getStatusBadge(wd.status)}</td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(wd.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => { setSelectedWd(wd); setNoteAdmin(''); setRejectReason(''); setBuktiUrl('') }}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-700"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-4 border-t-2 border-gray-200">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-xs font-bold disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-xs font-bold text-gray-600">{page} / {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-xs font-bold disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedWd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border-2 border-gray-200">
              <div className="bg-gray-900 p-5 text-white flex items-center justify-between">
                <h3 className="font-bold text-base">Detail Penarikan #{selectedWd.id}</h3>
                <button onClick={() => setSelectedWd(null)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30">✕</button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Jumlah</p>
                    <p className="text-lg font-black text-gray-900">Rp {selectedWd.jumlah.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedWd.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Reseller</p>
                  <p className="text-sm font-bold text-gray-900">{selectedWd.reseller?.store_name || selectedWd.reseller?.nama_lengkap || '-'}</p>
                </div>

                {selectedWd.bank_account && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Rekening Tujuan</p>
                    <p className="text-sm font-bold">{selectedWd.bank_account.nama_bank} ({selectedWd.bank_account.tipe})</p>
                    <p className="text-sm text-gray-700">{selectedWd.bank_account.nomor_rekening}</p>
                    <p className="text-xs text-gray-500">a.n. {selectedWd.bank_account.nama_pemilik}</p>
                  </div>
                )}

                {selectedWd.catatan_reseller && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Catatan Reseller</p>
                    <p className="text-sm text-gray-700">{selectedWd.catatan_reseller}</p>
                  </div>
                )}

                {selectedWd.alasan_penolakan && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-[10px] font-bold text-red-500 uppercase">Alasan Penolakan</p>
                    <p className="text-sm text-red-700">{selectedWd.alasan_penolakan}</p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Tanggal</p>
                  <p className="text-sm text-gray-700">{new Date(selectedWd.createdAt).toLocaleString('id-ID')}</p>
                </div>

                {/* Action Forms */}
                {(selectedWd.status === 'pending' || selectedWd.status === 'processing' || selectedWd.status === 'approved') && (
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Admin</label>
                      <input
                        type="text"
                        value={noteAdmin}
                        onChange={(e) => setNoteAdmin(e.target.value)}
                        placeholder="Opsional"
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                      />
                    </div>

                    {(selectedWd.status === 'approved' || selectedWd.status === 'processing') && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Bukti Transfer URL</label>
                        <input
                          type="text"
                          value={buktiUrl}
                          onChange={(e) => setBuktiUrl(e.target.value)}
                          placeholder="URL bukti transfer"
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Alasan Penolakan</label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Wajib jika menolak"
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedWd.status === 'pending' && (
                        <button
                          onClick={() => doAction('process')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          Proses
                        </button>
                      )}
                      {(selectedWd.status === 'pending' || selectedWd.status === 'processing') && (
                        <button
                          onClick={() => doAction('approve')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          Setujui
                        </button>
                      )}
                      {(selectedWd.status === 'approved' || selectedWd.status === 'processing') && (
                        <button
                          onClick={() => doAction('complete')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                          Selesai
                        </button>
                      )}
                      <button
                        onClick={() => doAction('reject')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
