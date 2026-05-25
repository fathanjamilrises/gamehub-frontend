'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { adminFetch } from '@/lib/adminFetch'
import { useToast } from '@/lib/contexts/ToastContext'
import Image from 'next/image'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string | null): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

interface Reseller {
  id: number
  id_user: number
  nama_lengkap: string
  no_hp: string
  alamat: string | null
  ktp_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  user?: {
    email: string
    username: string
  }
}

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const { success: showSuccess, error: showError } = useToast()

  const fetchResellers = async () => {
    try {
      setLoading(true)
      const res = await adminFetch('/api-proxy/admin/resellers')
      const data = await res.json()
      if (res.ok) {
        setResellers(data.data || data.resellers || data || [])
      } else {
        showError(data.message || 'Gagal memuat data reseller')
      }
    } catch (err) {
      showError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResellers()
  }, [])

  const handleUpdateStatus = async (id: number, newStatus: 'approved' | 'rejected') => {
    setActionLoading(true)
    try {
      const res = await adminFetch(`/api-proxy/admin/resellers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess(`Status reseller berhasil diubah menjadi ${newStatus === 'approved' ? 'Disetujui' : 'Ditolak'}`)
        setIsModalOpen(false)
        fetchResellers()
      } else {
        showError(data.message || 'Gagal mengubah status')
      }
    } catch (err) {
      showError('Terjadi kesalahan saat menyimpan')
    } finally {
      setActionLoading(false)
    }
  }

  const openDetail = (reseller: Reseller) => {
    setSelectedReseller(reseller)
    setIsModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-block px-2.5 py-1 bg-green-100 text-green-800 border-2 border-green-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            Aktif
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-block px-2.5 py-1 bg-red-100 text-red-800 border-2 border-red-700 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            Ditolak
          </span>
        )
      default:
        return (
          <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 border-2 border-amber-600 rounded-lg font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_#111827]">
            Pending
          </span>
        )
    }
  }

  // Client-side filtering & search
  const filteredResellers = resellers.filter((r) => {
    const matchesStatus = statusFilter ? r.status === statusFilter : true
    const q = search.toLowerCase()
    const matchesSearch = search
      ? r.nama_lengkap.toLowerCase().includes(q) ||
        r.no_hp.includes(q) ||
        (r.user?.email || '').toLowerCase().includes(q) ||
        (r.user?.username || '').toLowerCase().includes(q) ||
        `#${r.id}`.includes(q)
      : true
    return matchesStatus && matchesSearch
  })

  // Quick stats calculation
  const totalCount = resellers.length
  const pendingCount = resellers.filter((r) => r.status === 'pending').length
  const approvedCount = resellers.filter((r) => r.status === 'approved').length
  const rejectedCount = resellers.filter((r) => r.status === 'rejected').length

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
              👥 KELOLA RESELLER GAME
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
              Manajemen Reseller
            </h1>
            <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Kelola, verifikasi, setujui, atau tolak pendaftaran akun reseller baru di platform.
            </p>
          </div>
          <button
            onClick={fetchResellers}
            className="flex items-center gap-2 px-5 py-3 bg-[#ff90e8] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Pendaftar', value: loading ? '—' : totalCount, icon: '👥', color: 'bg-cyan-300' },
            { label: 'Menunggu Verifikasi', value: loading ? '—' : pendingCount, icon: '⏳', color: 'bg-[#ffc900]' },
            { label: 'Reseller Aktif', value: loading ? '—' : approvedCount, icon: '✅', color: 'bg-[#86efac]' },
            { label: 'Pendaftaran Ditolak', value: loading ? '—' : rejectedCount, icon: '❌', color: 'bg-[#ff90e8]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden">
              <div className={"absolute top-0 right-0 w-12 h-12 rounded-bl-2xl border-b-[3px] border-l-[3px] border-gray-900 " + stat.color} />
              <p className="text-3xl mb-1">{stat.icon}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters & Search section */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'Semua' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Aktif' },
              { value: 'rejected', label: 'Ditolak' },
            ].map((tab) => {
              const isSelected = statusFilter === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
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

          {/* Search bar */}
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
              placeholder="CARI NAMA, USERNAME, EMAIL..."
              className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase tracking-wider focus:outline-none focus:shadow-[3px_3px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Resellers Table Card */}
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[8px_8px_0px_#111827] relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900 z-10" />

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-[3px] border-gray-900">
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-20">
                    ID
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">
                    Reseller Info
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-52">
                    Kontak
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center w-36">
                    Status
                  </th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest text-center w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-[3px] divide-gray-900">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-gray-900 border-t-purple-600 rounded-full animate-spin" />
                        <p className="font-black text-gray-900 uppercase tracking-widest text-xs">
                          Memuat data reseller...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredResellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <p className="text-4xl mb-3">👥</p>
                      <p className="font-black text-gray-900 uppercase tracking-wider text-base">
                        Tidak ada data reseller
                      </p>
                      <p className="text-xs font-bold text-gray-500 mt-1">
                        {search || statusFilter
                          ? 'Coba ubah kata kunci pencarian atau filter status.'
                          : 'Belum ada pendaftar reseller saat ini.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredResellers.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50/50 transition-colors border-b-[3px] border-gray-900 last:border-b-0"
                    >
                      {/* ID Column */}
                      <td className="p-4 text-sm font-black text-gray-900 border-r-[3px] border-gray-900 font-mono">
                        #{r.id}
                      </td>

                      {/* Reseller Info Column */}
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <div className="flex items-center gap-3">
                          {/* Avatar block */}
                          <div className="w-10 h-10 border-2 border-gray-900 bg-amber-300 rounded-full flex items-center justify-center font-black shadow-[1.5px_1.5px_0_#111827] shrink-0 text-sm">
                            {r.nama_lengkap[0]?.toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-black text-gray-900">
                              {r.nama_lengkap}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span className="inline-block bg-purple-100 border border-gray-900 text-gray-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#111827] uppercase">
                                ID User #{r.id_user}
                              </span>
                              {r.user?.username && (
                                <span className="inline-block bg-blue-100 border border-gray-900 text-gray-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#111827] uppercase">
                                  @{r.user.username}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-1">
                              {r.user?.email || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="p-4 border-r-[3px] border-gray-900 text-xs font-bold text-gray-700">
                        <div className="space-y-1">
                          <p className="font-mono text-sm font-black text-gray-900">📞 {r.no_hp}</p>
                          <p className="text-[10px] text-gray-400 line-clamp-1">📍 {r.alamat || 'Tidak ada alamat'}</p>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="p-4 text-center border-r-[3px] border-gray-900">
                        {getStatusBadge(r.status)}
                      </td>

                      {/* Action Column */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openDetail(r)}
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
        </div>

        {/* Modal Detail & Konfirmasi */}
        {isModalOpen && selectedReseller && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#ff90e8] border-b-[3px] border-gray-900 p-5 flex items-center justify-between z-20">
                <div>
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                    Detail Pendaftar Reseller #{selectedReseller.id}
                  </h2>
                  <p className="text-[9px] font-bold text-gray-950 uppercase tracking-wider mt-0.5">
                    Tinjau informasi pendaftaran & dokumen KTP
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Details */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 border-2 border-gray-900 rounded-xl p-4 shadow-[3px_3px_0_#111827] space-y-3">
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">Nama Lengkap</span>
                        <p className="text-sm font-black text-gray-900 mt-1">{selectedReseller.nama_lengkap}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">Nomor HP / Kontak</span>
                        <p className="text-sm font-black text-blue-600 font-mono tracking-wider mt-1">📞 {selectedReseller.no_hp}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">Alamat Lengkap</span>
                        <p className="text-xs font-bold text-gray-700 mt-1 leading-relaxed">{selectedReseller.alamat || 'Tidak ada alamat'}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border-2 border-gray-900 rounded-xl p-4 shadow-[3px_3px_0_#111827] space-y-2">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block leading-none">Detail Akun</span>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Username</span>
                        <p className="text-xs font-black text-gray-900">@{selectedReseller.user?.username || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Email</span>
                        <p className="text-xs font-black text-gray-900">{selectedReseller.user?.email || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">ID User</span>
                        <p className="text-xs font-black text-gray-900 font-mono">#{selectedReseller.id_user}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Status Pendaftaran</span>
                      <div>{getStatusBadge(selectedReseller.status)}</div>
                    </div>
                  </div>

                  {/* Right Column: KTP Display */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">Kartu Tanda Penduduk (KTP)</span>
                    {selectedReseller.ktp_url ? (
                      <div className="border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_#111827] bg-gray-100">
                        <div className="relative w-full aspect-video bg-gray-100 flex items-center justify-center">
                          <Image
                            src={resolveImageUrl(selectedReseller.ktp_url)}
                            alt="Foto KTP"
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>
                        <div className="p-3 bg-gray-900 text-center border-t-2 border-gray-900">
                          <a
                            href={resolveImageUrl(selectedReseller.ktp_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-black text-[#ffc900] hover:text-white uppercase tracking-wider transition-colors"
                          >
                            Buka Gambar Penuh ↗
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-400 rounded-2xl p-12 flex flex-col items-center justify-center bg-gray-50 text-center gap-2">
                        <span className="text-3xl">🪪</span>
                        <p className="text-xs font-bold text-gray-500">Tidak ada foto KTP terunggah</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons (Only show if pending) */}
                {selectedReseller.status === 'pending' && (
                  <div className="pt-6 border-t-[3px] border-gray-900 flex gap-4">
                    <button
                      onClick={() => handleUpdateStatus(selectedReseller.id, 'rejected')}
                      disabled={actionLoading}
                      className="flex-1 bg-white text-red-600 hover:bg-red-50 font-black text-xs py-3.5 rounded-xl border-[3px] border-red-600 shadow-[4px_4px_0px_#dc2626] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#dc2626] transition-all uppercase tracking-wider"
                    >
                      ❌ Tolak Pendaftaran
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReseller.id, 'approved')}
                      disabled={actionLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black text-xs py-3.5 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] transition-all uppercase tracking-wider"
                    >
                      {actionLoading ? 'Memproses...' : '✅ Setujui Reseller'}
                    </button>
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
