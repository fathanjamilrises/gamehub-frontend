'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { adminFetch } from '@/lib/adminFetch'
import { useToast } from '@/lib/contexts/ToastContext'

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
    is_verified?: boolean
  }
}

interface UnverifiedBank {
  id: number
  nama_bank: string
  tipe: string
  nomor_rekening: string
  nama_pemilik: string
  kode_bank?: string
  is_primary: boolean
  createdAt: string
  reseller?: {
    id: number
    nama_lengkap: string
    store_name?: string
  }
}

const PAGE_TABS = [
  { value: 'withdrawals', label: '💸 Penarikan' },
  { value: 'banks', label: '🏦 Verifikasi Rekening' },
]

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
  const [activeTab, setActiveTab] = useState('withdrawals')

  // ── Withdrawals state
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

  // ── Unverified banks state
  const [unverifiedBanks, setUnverifiedBanks] = useState<UnverifiedBank[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState<UnverifiedBank | null>(null)
  const [bankNoteAdmin, setBankNoteAdmin] = useState('')
  const [bankActionLoading, setBankActionLoading] = useState(false)

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (statusFilter) query.set('status', statusFilter)
      if (search) query.set('search', search)
      query.set('page', page.toString())
      const qs = query.toString()
      const res = await adminFetch(`/api-proxy/admin/withdraw${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      console.log('[admin/withdraw] raw response:', JSON.stringify(data).slice(0, 500))
      // Flatten all known response shapes
      const inner = data.data ?? data
      const list: any[] = (
        inner.withdrawals ??
        inner.rows ??
        inner.data ??
        (Array.isArray(inner) ? inner : null) ??
        []
      )
      const total: number = inner.total ?? inner.count ?? data.total ?? data.count ?? list.length
      const computedPages = Math.ceil(total / 10)
      const pages: number = inner.total_pages ?? inner.totalPages ?? data.total_pages ?? data.totalPages ?? (computedPages > 0 ? computedPages : 1)
      setWithdrawals(list)
      setTotalPages(pages)
    } catch (err) {
      console.error('[admin/withdraw] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnverifiedBanks = async () => {
    setBanksLoading(true)
    try {
      const res = await adminFetch('/api-proxy/admin/withdraw/banks/unverified')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      console.log('[admin/banks/unverified] raw response:', JSON.stringify(data).slice(0, 400))
      const inner = data.data ?? data
      const list: any[] = (
        inner.banks ??
        inner.rows ??
        inner.data ??
        (Array.isArray(inner) ? inner : null) ??
        []
      )
      setUnverifiedBanks(list)
    } catch (err) {
      console.error('[admin/banks/unverified] fetch error:', err)
    } finally {
      setBanksLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter, page])

  useEffect(() => {
    if (activeTab === 'banks') fetchUnverifiedBanks()
  }, [activeTab])

  const handleSearch = () => {
    setPage(1)
    fetchWithdrawals()
  }

  const doVerifyBank = async (isVerified: boolean) => {
    if (!selectedBank) return
    setBankActionLoading(true)
    try {
      const res = await adminFetch(`/api-proxy/admin/withdraw/banks/${selectedBank.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: isVerified, catatan_admin: bankNoteAdmin || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal')
      }
      showSuccess(isVerified ? '✅ Rekening berhasil diverifikasi!' : '❌ Rekening ditolak')
      setSelectedBank(null)
      setBankNoteAdmin('')
      fetchUnverifiedBanks()
    } catch (err: any) {
      showError(err.message || 'Terjadi kesalahan')
    } finally {
      setBankActionLoading(false)
    }
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
            <p className="text-sm text-gray-500">Kelola permintaan penarikan dana & verifikasi rekening reseller</p>
          </div>
        </div>

        {/* Main Page Tabs */}
        <div className="flex gap-2 border-b-2 border-gray-200 pb-0">
          {PAGE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2.5 text-sm font-bold rounded-t-lg border-2 border-b-0 transition-all ${
                activeTab === tab.value
                  ? 'bg-white border-gray-900 text-gray-900 -mb-[2px]'
                  : 'bg-gray-100 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.value === 'banks' && unverifiedBanks.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {unverifiedBanks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: PENARIKAN ── */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
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

            {/* Withdrawals Table */}
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
                                <p className="text-xs text-gray-500">{wd.bank_account.nomor_rekening} · {wd.bank_account.nama_pemilik}</p>
                                {wd.bank_account.is_verified === false && (
                                  <span className="text-[10px] font-bold text-orange-600">⚠ Belum Verif</span>
                                )}
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
          </div>
        )}

        {/* ── TAB: VERIFIKASI REKENING ── */}
        {activeTab === 'banks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Rekening yang perlu diverifikasi sebelum reseller bisa menarik dana</p>
              <button onClick={fetchUnverifiedBanks} className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-xs font-bold hover:border-gray-900">
                🔄 Refresh
              </button>
            </div>

            {banksLoading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-10 h-10 border-[3px] border-gray-900 border-t-purple-600 rounded-full animate-spin" />
              </div>
            ) : unverifiedBanks.length === 0 ? (
              <div className="py-16 text-center bg-green-50 rounded-xl border-2 border-green-200">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-lg font-bold text-green-700">Semua rekening sudah terverifikasi</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unverifiedBanks.map(bank => (
                  <div key={bank.id} className="bg-white border-2 border-orange-300 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold text-orange-600 uppercase mb-1">⏳ Menunggu Verifikasi</p>
                        <p className="text-base font-black text-gray-900">{bank.nama_bank}</p>
                        <p className="text-sm font-bold text-gray-700">{bank.nomor_rekening}</p>
                        <p className="text-xs text-gray-500">a.n. {bank.nama_pemilik}</p>
                        <p className="text-[10px] text-gray-400 capitalize mt-0.5">{bank.tipe}{bank.kode_bank ? ` · Kode: ${bank.kode_bank}` : ''}</p>
                      </div>
                      {bank.is_primary && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full">Utama</span>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Reseller</p>
                      <p className="text-sm font-bold text-gray-900">{bank.reseller?.store_name || bank.reseller?.nama_lengkap || '-'}</p>
                      <p className="text-[10px] text-gray-400">
                        Didaftarkan: {new Date(bank.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => { setSelectedBank(bank); setBankNoteAdmin('') }}
                        className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-700"
                      >
                        Tinjau
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verifikasi Bank Modal */}
        {selectedBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border-2 border-gray-200">
              <div className="bg-orange-500 p-5 text-white flex items-center justify-between">
                <h3 className="font-bold text-base">Verifikasi Rekening</h3>
                <button onClick={() => setSelectedBank(null)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Detail Rekening</p>
                  <p className="text-base font-black text-gray-900">{selectedBank.nama_bank}</p>
                  <p className="text-sm font-bold text-gray-700">{selectedBank.nomor_rekening}</p>
                  <p className="text-xs text-gray-500">a.n. {selectedBank.nama_pemilik}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{selectedBank.tipe}{selectedBank.kode_bank ? ` · Kode: ${selectedBank.kode_bank}` : ''}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-[10px] font-bold text-blue-500 uppercase">Reseller</p>
                  <p className="text-sm font-bold text-gray-900">{selectedBank.reseller?.store_name || selectedBank.reseller?.nama_lengkap || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Admin (Opsional)</label>
                  <input
                    type="text"
                    value={bankNoteAdmin}
                    onChange={(e) => setBankNoteAdmin(e.target.value)}
                    placeholder="Catatan untuk reseller"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => doVerifyBank(false)}
                    disabled={bankActionLoading}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-red-700"
                  >
                    {bankActionLoading ? '...' : '❌ Tolak'}
                  </button>
                  <button
                    onClick={() => doVerifyBank(true)}
                    disabled={bankActionLoading}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-green-700"
                  >
                    {bankActionLoading ? '...' : '✅ Verifikasi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Withdraw Modal */}
        {selectedWd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
