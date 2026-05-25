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
  switch (status?.toLowerCase()) {
    case 'pending':
      return (
        <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 border-2 border-amber-600 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Pending
        </span>
      )
    case 'processing':
      return (
        <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 border-2 border-blue-600 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Diproses
        </span>
      )
    case 'approved':
      return (
        <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-800 border-2 border-purple-600 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Disetujui
        </span>
      )
    case 'completed':
      return (
        <span className="inline-block px-2.5 py-1 bg-green-100 text-green-800 border-2 border-green-600 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Selesai
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-block px-2.5 py-1 bg-red-100 text-red-800 border-2 border-red-600 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
          Ditolak
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

export default function AdminWithdrawalsPage() {
  const { success: showSuccess, error: showError } = useToast()
  const [activeTab, setActiveTab] = useState('withdrawals')

  // ── Withdrawals state
  const [withdrawals, setWithdrawals] = useState<WithdrawItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
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
      setTotalCount(total)
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
        method: 'PUT',
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

  // Calculate quick values
  const totalAmountThisPage = withdrawals.reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0)
  const pendingRequestsCount = withdrawals.filter(w => ['pending', 'processing'].includes(w.status?.toLowerCase())).length

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
              💸 KELOLA KEUANGAN RESELLER
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
              Manajemen Penarikan
            </h1>
            <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Kelola permintaan penarikan dana (withdraw) & verifikasi rekening bank reseller terdaftar.
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'withdrawals') fetchWithdrawals()
              else fetchUnverifiedBanks()
            }}
            className="flex items-center gap-2 px-5 py-3 bg-[#ff90e8] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Pengajuan', value: loading ? '—' : totalCount, icon: '💸', color: 'bg-cyan-300' },
            { label: 'Pending Review', value: loading ? '—' : pendingRequestsCount, icon: '⏳', color: 'bg-[#ffc900]' },
            { label: 'Total Penarikan (Halaman Ini)', value: loading ? '—' : `Rp ${totalAmountThisPage.toLocaleString('id-ID')}`, icon: '💰', color: 'bg-[#86efac]' },
            { label: 'Belum Terverifikasi', value: banksLoading ? '—' : unverifiedBanks.length, icon: '🏦', color: 'bg-[#ff90e8]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden">
              <div className={"absolute top-0 right-0 w-12 h-12 rounded-bl-2xl border-b-[3px] border-l-[3px] border-gray-900 " + stat.color} />
              <p className="text-3xl mb-1">{stat.icon}</p>
              <p className="text-xl md:text-2xl font-black text-gray-900 truncate pr-6">{stat.value}</p>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Page Tabs */}
        <div className="flex flex-wrap gap-3">
          {PAGE_TABS.map((tab) => {
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-5 py-3 font-black text-xs md:text-sm rounded-xl border-[3px] border-gray-900 transition-all uppercase tracking-wider flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#ffc900] text-gray-900 shadow-[4px_4px_0px_#111827] translate-y-[-2px] translate-x-[-2px]'
                    : 'bg-white text-gray-700 shadow-[2px_2px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] hover:translate-y-[-2px] hover:translate-x-[-2px]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.value === 'banks' && unverifiedBanks.length > 0 && (
                  <span className="bg-red-650 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-gray-900 shadow-[1px_1px_0_#111827]">
                    {unverifiedBanks.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── TAB: PENARIKAN ── */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                {STATUS_TABS.map((tab) => {
                  const isSelected = statusFilter === tab.value
                  return (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setStatusFilter(tab.value)
                        setPage(1)
                      }}
                      className={`px-3.5 py-2 font-black text-xs rounded-lg border-2 border-gray-900 transition-all uppercase tracking-wider ${
                        isSelected
                          ? 'bg-gray-900 text-white shadow-none'
                          : 'bg-white text-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-px hover:translate-x-px'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full max-w-md shrink-0">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="CARI RESELLER..."
                  className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-24 py-3 text-xs font-black uppercase tracking-wider focus:outline-none focus:shadow-[3px_3px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-gray-805 transition-colors"
                >
                  Cari
                </button>
              </div>
            </div>

            {/* Withdrawals Table Card */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b-[3px] border-gray-900">
                      <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-20">
                        ID
                      </th>
                      <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">
                        Reseller
                      </th>
                      <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">
                        Detail Rekening
                      </th>
                      <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-48">
                        Jumlah Penarikan
                      </th>
                      <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center w-32">
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
                  <tbody className="divide-y-[3px] divide-gray-900">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-16 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-gray-900 border-t-purple-600 rounded-full animate-spin" />
                            <p className="font-black text-gray-900 uppercase tracking-widest text-xs">
                              Memuat data penarikan...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-16 text-center">
                          <p className="text-4xl mb-3">💸</p>
                          <p className="font-black text-gray-900 uppercase tracking-wider text-base">
                            Tidak ada data penarikan
                          </p>
                          <p className="text-xs font-bold text-gray-500 mt-1">
                            {search || statusFilter
                              ? 'Coba ubah kata kunci pencarian atau filter status.'
                              : 'Belum ada pengajuan penarikan saat ini.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((wd) => (
                        <tr
                          key={wd.id}
                          className="hover:bg-gray-50/50 transition-colors border-b-[3px] border-gray-900 last:border-b-0"
                        >
                          {/* ID Column */}
                          <td className="p-4 text-sm font-black text-gray-900 border-r-[3px] border-gray-900 font-mono">
                            #{wd.id}
                          </td>

                          {/* Reseller Column */}
                          <td className="p-4 border-r-[3px] border-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-gray-900">
                                {wd.reseller?.store_name || wd.reseller?.nama_lengkap || '-'}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="inline-block bg-purple-100 border border-gray-900 text-gray-900 text-[9px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#111827] uppercase">
                                ID Reseller #{wd.reseller?.id || '-'}
                              </span>
                            </div>
                          </td>

                          {/* Bank Detail Column */}
                          <td className="p-4 border-r-[3px] border-gray-900">
                            {wd.bank_account ? (
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-block bg-blue-100 border border-gray-900 text-gray-900 px-2 py-0.5 rounded font-black text-[9px] uppercase shadow-[1px_1px_0px_#111827]">
                                    {wd.bank_account.nama_bank}
                                  </span>
                                  <span className="inline-block bg-amber-100 border border-gray-900 text-gray-900 px-2 py-0.5 rounded font-black text-[9px] uppercase shadow-[1px_1px_0px_#111827]">
                                    {wd.bank_account.tipe}
                                  </span>
                                </div>
                                <p className="text-xs font-black text-blue-600 font-mono tracking-wider">
                                  {wd.bank_account.nomor_rekening}
                                </p>
                                <p className="text-xs text-gray-700 font-bold">
                                  a.n. {wd.bank_account.nama_pemilik}
                                </p>
                                {wd.bank_account.is_verified === false && (
                                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 border border-gray-900 text-[8px] font-black rounded shadow-[1px_1px_0px_#111827] uppercase">
                                    ⚠️ Belum Terverifikasi
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-gray-400">—</span>
                            )}
                          </td>

                          {/* Amount Column */}
                          <td className="p-4 border-r-[3px] border-gray-900">
                            <span className="text-sm font-black text-emerald-600 font-mono">
                              Rp {Number(wd.jumlah).toLocaleString('id-ID')}
                            </span>
                          </td>

                          {/* Status Column */}
                          <td className="p-4 text-center border-r-[3px] border-gray-900">
                            {getStatusBadge(wd.status)}
                          </td>

                          {/* Date Column */}
                          <td className="p-4 text-center border-r-[3px] border-gray-900 font-bold text-gray-500 text-xs">
                            {new Date(wd.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Action Column */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedWd(wd)
                                setNoteAdmin(wd.catatan_admin || '')
                                setRejectReason(wd.alasan_penolakan || '')
                                setBuktiUrl(wd.bukti_transfer_url || '')
                              }}
                              className="bg-cyan-300 hover:bg-cyan-400 text-gray-900 text-[10px] font-black px-3.5 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer / Pagination */}
              {!loading && withdrawals.length > 0 && totalPages > 1 && (
                <div className="px-5 py-4 border-t-[3px] border-gray-900 bg-gray-50 flex items-center justify-between gap-4">
                  <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                    Halaman {page} dari {totalPages}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 bg-white border-2 border-gray-900 rounded-lg text-xs font-black uppercase text-gray-900 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-px transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                    >
                      Prev
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 bg-white border-2 border-gray-900 rounded-lg text-xs font-black uppercase text-gray-900 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-px transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: VERIFIKASI REKENING ── */}
        {activeTab === 'banks' && (
          <div className="space-y-6">
            <div className="bg-orange-50 border-[3px] border-gray-900 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[4px_4px_0_#111827]">
              <div>
                <h3 className="font-black text-gray-900 text-sm uppercase">Perlu Verifikasi Rekening</h3>
                <p className="text-xs font-bold text-gray-650 mt-0.5">
                  Daftar rekening bank baru yang didaftarkan reseller. Verifikasi kecocokan nama untuk mencegah kesalahan transfer dana.
                </p>
              </div>
              <button
                onClick={fetchUnverifiedBanks}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-gray-900 rounded-xl text-xs font-black uppercase text-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0"
              >
                🔄 Refresh
              </button>
            </div>

            {banksLoading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-10 h-10 border-[3px] border-gray-900 border-t-orange-600 rounded-full animate-spin" />
              </div>
            ) : unverifiedBanks.length === 0 ? (
              <div className="py-16 text-center bg-green-50 rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827]">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-black text-green-800 uppercase tracking-wide text-base">
                  Semua rekening sudah terverifikasi
                </p>
                <p className="text-xs font-bold text-gray-500 mt-1">
                  Belum ada rekening baru yang menunggu proses peninjauan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {unverifiedBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="bg-[#e0f2fe] border-[3px] border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0px_#111827] flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-[8px_8px_0_#111827] transition-all relative overflow-hidden"
                  >
                    {/* Hologram card chip illustration */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-8 bg-amber-400 border-2 border-gray-900 rounded-md relative overflow-hidden shadow-[1.5px_1.5px_0_#111827] shrink-0">
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 border-collapse">
                          <div className="border-r border-b border-gray-900/30" />
                          <div className="border-r border-b border-gray-900/30" />
                          <div className="border-b border-gray-900/30" />
                          <div className="border-r border-gray-900/30" />
                          <div className="border-r border-gray-900/30" />
                          <div className="border-gray-900/30" />
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-block bg-white border border-gray-900 text-gray-900 text-[9px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#111827] uppercase">
                          {bank.nama_bank}
                        </span>
                        {bank.is_primary && (
                          <span className="inline-block bg-purple-400 border border-gray-900 text-gray-900 text-[9px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#111827] uppercase">
                            ⭐ Utama
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-lg font-black text-gray-900 font-mono tracking-widest">
                        {bank.nomor_rekening}
                      </p>
                      <div className="mt-2 flex flex-col">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Nama Pemilik</span>
                        <span className="text-sm font-black text-gray-900 uppercase">{bank.nama_pemilik}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 font-bold capitalize mt-2 border-t border-gray-900/10 pt-2">
                        Tipe: {bank.tipe} {bank.kode_bank ? `· Kode: ${bank.kode_bank}` : ''}
                      </p>
                    </div>

                    {/* Reseller Info section inside card */}
                    <div className="bg-white/60 border-2 border-dashed border-gray-900/30 rounded-xl p-3.5 mt-4 space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase">
                        <span>Pemohon Reseller</span>
                        <span className="bg-purple-100 text-gray-900 border border-gray-900 px-1 py-0.2 rounded font-mono">ID #{bank.reseller?.id}</span>
                      </div>
                      <p className="text-xs font-black text-gray-800">{bank.reseller?.store_name || bank.reseller?.nama_lengkap || '-'}</p>
                      <p className="text-[9px] font-bold text-gray-500">
                        {new Date(bank.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedBank(bank)
                        setBankNoteAdmin('')
                      }}
                      className="w-full mt-5 py-3 bg-[#ff90e8] hover:bg-[#ff7ae4] text-gray-900 font-black text-xs uppercase tracking-wider rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[3px] hover:translate-x-[3px] transition-all"
                    >
                      🔍 Tinjau Rekening
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verifikasi Bank Modal */}
        {selectedBank && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedBank(null)}
          >
            <div
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b-[3px] border-gray-900 bg-[#ffc900] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-gray-900 uppercase">
                    Verifikasi Rekening Bank
                  </h2>
                  <p className="text-[9px] font-bold text-gray-950 uppercase tracking-wider mt-0.5">
                    Tinjau detail akun bank reseller
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBank(null)}
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Detail Rekening */}
                <div className="bg-gray-50 border-2 border-gray-900 rounded-xl p-4 shadow-[3px_3px_0_#111827] space-y-1.5 text-sm font-bold text-gray-800">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Detail Rekening</span>
                  <p className="text-lg font-black text-gray-950 leading-none">{selectedBank.nama_bank}</p>
                  <p className="text-sm font-black text-blue-600 tracking-wider leading-none mt-1">{selectedBank.nomor_rekening}</p>
                  <p className="text-xs text-gray-700 leading-none mt-1">a.n. {selectedBank.nama_pemilik}</p>
                  <p className="text-[10px] text-gray-400 capitalize pt-1 mt-1 border-t border-gray-200">
                    Tipe: {selectedBank.tipe} {selectedBank.kode_bank ? `· Kode: ${selectedBank.kode_bank}` : ''}
                  </p>
                </div>

                {/* Reseller Info */}
                <div className="bg-blue-50 border-2 border-gray-900 rounded-xl p-3 shadow-[3px_3px_0_#111827]">
                  <span className="text-[9px] font-black text-blue-500 uppercase block leading-none">Reseller Pemohon</span>
                  <p className="text-sm font-black text-gray-900 mt-1 leading-none">
                    {selectedBank.reseller?.store_name || selectedBank.reseller?.nama_lengkap || '-'}
                  </p>
                </div>

                {/* Catatan Admin */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Catatan Admin (Opsional)
                  </label>
                  <input
                    type="text"
                    value={bankNoteAdmin}
                    onChange={(e) => setBankNoteAdmin(e.target.value)}
                    placeholder="Berikan catatan verifikasi..."
                    className="w-full border-[3px] border-gray-900 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-purple-600 focus:bg-white placeholder:text-gray-400 bg-gray-50 shadow-[3px_3px_0_#111827]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => doVerifyBank(false)}
                    disabled={bankActionLoading}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111827] transition-all disabled:opacity-50"
                  >
                    {bankActionLoading ? '...' : '❌ Tolak'}
                  </button>
                  <button
                    onClick={() => doVerifyBank(true)}
                    disabled={bankActionLoading}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111827] transition-all disabled:opacity-50"
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
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedWd(null)}
          >
            <div
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b-[3px] border-gray-900 bg-[#ff90e8] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-gray-900 uppercase">
                    Detail Penarikan #{selectedWd.id}
                  </h2>
                  <p className="text-[9px] font-bold text-gray-950 uppercase tracking-wider mt-0.5">
                    Kelola permohonan penarikan dana reseller
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWd(null)}
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border-2 border-gray-900 rounded-xl shadow-[3px_3px_0_#111827]">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Jumlah</span>
                    <p className="text-xl font-black text-emerald-600 leading-none mt-1 font-mono">Rp {Number(selectedWd.jumlah).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Status</span>
                    <div className="mt-1">{getStatusBadge(selectedWd.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border-2 border-gray-900 rounded-xl p-3 shadow-[3px_3px_0_#111827]">
                    <span className="text-[9px] font-black text-blue-500 uppercase block">Reseller Pemohon</span>
                    <p className="text-sm font-black text-gray-955 mt-1 leading-none">
                      {selectedWd.reseller?.store_name || selectedWd.reseller?.nama_lengkap || '-'}
                    </p>
                  </div>
                  <div className="bg-purple-50 border-2 border-gray-900 rounded-xl p-3 shadow-[3px_3px_0_#111827]">
                    <span className="text-[9px] font-black text-purple-550 uppercase block">Tanggal Pengajuan</span>
                    <p className="text-xs font-black text-gray-955 mt-1.5 leading-none">
                      {new Date(selectedWd.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {selectedWd.bank_account && (
                  <div className="bg-gray-50 p-4 border-2 border-gray-900 rounded-xl shadow-[3px_3px_0_#111827]">
                    <span className="text-[9px] font-black text-gray-400 uppercase block leading-none">Rekening Tujuan Transfer</span>
                    <p className="text-sm font-black text-gray-950 mt-2 leading-none">
                      {selectedWd.bank_account.nama_bank} ({selectedWd.bank_account.tipe})
                    </p>
                    <p className="text-sm font-black text-blue-600 tracking-wider mt-1.5 leading-none">
                      {selectedWd.bank_account.nomor_rekening}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-none font-bold">
                      a.n. {selectedWd.bank_account.nama_pemilik}
                    </p>
                  </div>
                )}

                {selectedWd.catatan_reseller && (
                  <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg">
                    <span className="text-[9px] font-black text-amber-600 uppercase block">Catatan Reseller</span>
                    <p className="text-xs font-bold text-gray-700 mt-1 leading-relaxed">{selectedWd.catatan_reseller}</p>
                  </div>
                )}

                {selectedWd.alasan_penolakan && (
                  <div className="bg-red-50 p-3.5 border border-red-200 rounded-xl">
                    <span className="text-[9px] font-black text-red-550 uppercase block">Alasan Penolakan</span>
                    <p className="text-xs font-bold text-red-700 mt-1 leading-relaxed">{selectedWd.alasan_penolakan}</p>
                  </div>
                )}

                {selectedWd.bukti_transfer_url && (
                  <div className="bg-green-50 p-3.5 border border-green-200 rounded-xl">
                    <span className="text-[9px] font-black text-green-550 uppercase block">Bukti Transfer</span>
                    <a
                      href={selectedWd.bukti_transfer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black text-blue-600 hover:underline mt-1 block truncate"
                    >
                      🔗 Lihat Bukti Pembayaran
                    </a>
                  </div>
                )}

                {/* Action Forms */}
                {(selectedWd.status === 'pending' || selectedWd.status === 'processing' || selectedWd.status === 'approved') && (
                  <div className="border-t-2 border-gray-200 pt-4 space-y-4">
                    {/* Catatan Admin input */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Catatan Admin (Opsional)
                      </label>
                      <input
                        type="text"
                        value={noteAdmin}
                        onChange={(e) => setNoteAdmin(e.target.value)}
                        placeholder="Berikan catatan admin jika diperlukan..."
                        className="w-full border-[3px] border-gray-900 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-purple-600 focus:bg-white placeholder:text-gray-400 bg-gray-50 shadow-[3px_3px_0_#111827]"
                      />
                    </div>

                    {/* Bukti Transfer URL input */}
                    {(selectedWd.status === 'approved' || selectedWd.status === 'processing') && (
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                          Bukti Transfer URL <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={buktiUrl}
                          onChange={(e) => setBuktiUrl(e.target.value)}
                          placeholder="Masukkan link/url bukti pembayaran..."
                          className="w-full border-[3px] border-gray-900 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-purple-600 focus:bg-white placeholder:text-gray-400 bg-gray-50 shadow-[3px_3px_0_#111827]"
                        />
                      </div>
                    )}

                    {/* Alasan Penolakan input */}
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Alasan Penolakan (Wajib jika menolak)
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Tulis alasan jika Anda menolak penarikan..."
                        className="w-full border-[3px] border-gray-900 rounded-xl p-3 text-sm font-bold focus:outline-none focus:border-purple-600 focus:bg-white placeholder:text-gray-400 bg-gray-50 shadow-[3px_3px_0_#111827]"
                      />
                    </div>

                    {/* Action buttons list */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {selectedWd.status === 'pending' && (
                        <button
                          onClick={() => doAction('process')}
                          disabled={actionLoading}
                          className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] transition-all rounded-xl text-xs font-black uppercase"
                        >
                          ⚙️ Proses
                        </button>
                      )}
                      {(selectedWd.status === 'pending' || selectedWd.status === 'processing') && (
                        <button
                          onClick={() => doAction('approve')}
                          disabled={actionLoading}
                          className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] transition-all rounded-xl text-xs font-black uppercase"
                        >
                          ✓ Setujui
                        </button>
                      )}
                      {(selectedWd.status === 'approved' || selectedWd.status === 'processing') && (
                        <button
                          onClick={() => doAction('complete')}
                          disabled={actionLoading}
                          className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] transition-all rounded-xl text-xs font-black uppercase"
                        >
                          ✅ Selesai
                        </button>
                      )}
                      <button
                        onClick={() => doAction('reject')}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] transition-all rounded-xl text-xs font-black uppercase"
                      >
                        ❌ Tolak
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
