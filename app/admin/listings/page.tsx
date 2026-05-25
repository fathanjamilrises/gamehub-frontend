'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { adminFetch } from '@/lib/adminFetch'
import { chatApi } from '@/lib/chatApi'
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
  accountGame?: { id: number; nama_game: string; gambar_game?: string }
  reseller?: { id: number; nama_lengkap: string; no_hp?: string }
  server_region?: string
  is_negotiable?: boolean | number
  harga_nego_min?: string | number
  deskripsi_detail?: string
  kondisi_akun?: { rank?: string; level?: string }
  metode_kontak?: { whatsapp?: string }
  screenshots?: any
}

export default function AdminListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        if (selectedListing?.id === id) {
          setIsModalOpen(false)
        }
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
        if (selectedListing?.id === id) {
          setIsModalOpen(false)
        }
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

  const handleLiveChat = async (idListing: number) => {
    setChatLoading(true)
    try {
      const room = await chatApi.openRoom(idListing)
      router.push(`/admin/chat/${room.id}`)
    } catch (err: any) {
      showError(err.message || 'Gagal memulai live chat')
    } finally {
      setChatLoading(false)
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

  const getFirstScreenshot = (item: Listing): string => {
    const raw = item.screenshots
    if (!raw) return ''
    let parsed: any[] = []
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw) } catch {}
    } else if (Array.isArray(raw)) {
      parsed = raw
    }
    const first = parsed[0]
    if (typeof first === 'string') return resolveImageUrl(first)
    if (first?.url_gambar) return resolveImageUrl(first.url_gambar)
    return ''
  }

  const openDetail = (item: Listing) => {
    setSelectedListing(item)
    setIsModalOpen(true)
  }

  const filteredListings = listings.filter((item) => {
    const q = search.toLowerCase()
    const idMatch = String(item.id).includes(q)
    const titleMatch = item.nama_post.toLowerCase().includes(q)
    const gameMatch = (item.accountGame?.nama_game || '').toLowerCase().includes(q)
    const resellerMatch = (item.reseller?.nama_lengkap || '').toLowerCase().includes(q)
    return idMatch || titleMatch || gameMatch || resellerMatch
  })

  // Dynamic statistics
  const totalCount = listings.length
  const pendingCount = listings.filter((item) => item.status_listing === 'pending').length
  const activeCount = listings.filter((item) => item.status_listing === 'active').length
  const soldCount = listings.filter((item) => item.status_listing === 'sold').length

  // Parse screenshots list for the selected listing
  const getSelectedScreenshots = (): string[] => {
    if (!selectedListing) return []
    let imgs: string[] = []
    const raw = selectedListing.screenshots
    if (raw) {
      let parsed: any[] = []
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch {}
      } else if (Array.isArray(raw)) {
        parsed = raw
      }
      imgs = parsed.map((sc: any) => {
        if (typeof sc === 'string') return resolveImageUrl(sc)
        if (sc?.url_gambar) return resolveImageUrl(sc.url_gambar)
        return ''
      }).filter(Boolean)
    }
    if (imgs.length === 0 && selectedListing.accountGame?.gambar_game) {
      imgs = [resolveImageUrl(selectedListing.accountGame.gambar_game)]
    }
    return imgs
  }

  const selectedImgs = getSelectedScreenshots()

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
              📦 KELOLA LISTING AKUN
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">Listing Akun</h1>
            <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Kelola, verifikasi, approve, reject, dan hapus listing jual-beli akun game.
            </p>
          </div>
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 px-5 py-3 bg-[#ff90e8] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Listing', value: loading ? '—' : totalCount, icon: '📦', color: 'bg-cyan-300' },
            { label: 'Pending Review', value: loading ? '—' : pendingCount, icon: '⏳', color: 'bg-[#ffc900]' },
            { label: 'Listing Aktif', value: loading ? '—' : activeCount, icon: '✅', color: 'bg-[#86efac]' },
            { label: 'Akun Terjual', value: loading ? '—' : soldCount, icon: '💰', color: 'bg-[#ff90e8]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden">
              <div className={"absolute top-0 right-0 w-12 h-12 rounded-bl-2xl border-b-[3px] border-l-[3px] border-gray-900 " + stat.color} />
              <p className="text-3xl mb-1">{stat.icon}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
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
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="CARI JUDUL, GAME, RESELLER, ATAU ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-black uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-[3px] border-gray-900">
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-16">ID</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">Judul / Detail Listing</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-44">Game</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 w-40">Harga</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center w-28">Status</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest text-center w-60">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
                        <p className="font-black text-gray-900 uppercase tracking-widest text-sm">Memuat data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <p className="text-4xl mb-3">📦</p>
                      <p className="font-black text-gray-900 uppercase tracking-wider text-base">Tidak ada listing ditemukan</p>
                      <p className="text-sm font-bold text-gray-500 mt-1">{search ? 'Coba kata kunci pencarian lain.' : 'Belum ada data listing saat ini.'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((item) => (
                    <tr key={item.id} className="border-b-[3px] border-gray-900 last:border-b-0 hover:bg-gray-50/80 transition-colors">
                      {/* ID Column */}
                      <td className="p-4 text-sm font-bold text-gray-900 border-r-[3px] border-gray-900 font-mono">
                        #{item.id}
                      </td>

                      {/* Title & Preview Column */}
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 border-[2px] border-gray-900 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-[1px_1px_0px_#111827]">
                            {getFirstScreenshot(item) ? (
                              <img src={getFirstScreenshot(item)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-black bg-[#ffc900]">🎮</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              onClick={() => openDetail(item)}
                              className="text-sm font-black text-gray-900 hover:text-blue-600 cursor-pointer truncate"
                            >
                              {item.nama_post}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold text-gray-500 mt-0.5">
                              <span>📅 {new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                              {item.reseller && (
                                <>
                                  <span>•</span>
                                  <span className="text-purple-600 font-extrabold uppercase">👤 {item.reseller.nama_lengkap}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Game Column */}
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <span className="inline-block bg-cyan-100 text-cyan-800 text-[10px] font-black px-2.5 py-1 rounded-md border-2 border-cyan-800 uppercase shadow-[1.5px_1.5px_0px_#111827]">
                          {item.accountGame?.nama_game || '-'}
                        </span>
                        {item.server_region && (
                          <span className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mt-1.5">
                            🌍 {item.server_region}
                          </span>
                        )}
                      </td>

                      {/* Price Column */}
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <span className="text-sm font-black text-green-600">
                          Rp {Number(item.harga_jual).toLocaleString('id-ID')}
                        </span>
                        {item.is_negotiable ? (
                          <span className="block text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-600 px-1 py-0.5 rounded mt-1.5 w-max">
                            Bisa Nego
                          </span>
                        ) : (
                          <span className="block text-[9px] font-black text-gray-400 bg-gray-50 border border-gray-300 px-1 py-0.5 rounded mt-1.5 w-max">
                            Nett
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="p-4 text-center border-r-[3px] border-gray-900">
                        {getStatusBadge(item.status_listing)}
                      </td>

                      {/* Actions Column */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            onClick={() => openDetail(item)}
                            className="bg-cyan-300 text-gray-900 text-[10px] font-black px-2.5 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase"
                          >
                            Detail
                          </button>
                          
                          {item.status_listing === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(item.id, true)}
                                disabled={actionLoading === item.id}
                                className="bg-green-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase disabled:opacity-50"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleApprove(item.id, false)}
                                disabled={actionLoading === item.id}
                                className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase disabled:opacity-50"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={actionLoading === item.id}
                            className="bg-red-50 text-red-600 text-[10px] font-black px-2.5 py-1.5 rounded-lg border-2 border-red-600 shadow-[2px_2px_0px_#dc2626] hover:translate-y-px hover:shadow-none transition-all uppercase disabled:opacity-50"
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

          {/* Table Footer Count */}
          {!loading && filteredListings.length > 0 && (
            <div className="px-5 py-3 border-t-[3px] border-gray-900 bg-gray-50">
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                Menampilkan {filteredListings.length} dari {listings.length} listing akun
              </p>
            </div>
          )}
        </div>

        {/* ── Modal Detail Listing ── */}
        {isModalOpen && selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#111827] w-full max-w-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
              {/* Modal Gradient Top border line */}
              <div className="h-3 bg-gradient-to-r from-cyan-300 via-[#ff90e8] to-[#ffc900] border-b-[3px] border-gray-900" />
              
              {/* Modal Header */}
              <div className="p-5 border-b-[3px] border-gray-900 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                    Detail Listing #{selectedListing.id}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                    Diposting pada {new Date(selectedListing.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Modal Content Scrollable Area */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* 1. Screenshots Gallery */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">📸 Screenshots Akun</p>
                  {selectedImgs.length > 0 ? (
                    <div className="border-2 border-gray-900 rounded-xl overflow-hidden bg-gray-950 p-2.5 shadow-[3px_3px_0px_#111827]">
                      <div className="flex gap-3 overflow-x-auto snap-x scrollbar-thin pb-1">
                        {selectedImgs.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="shrink-0 snap-center">
                            <img
                              src={img}
                              alt={`Screenshot ${i + 1}`}
                              className="h-44 w-auto object-contain rounded-lg border-2 border-gray-900 hover:scale-[1.02] transition-transform"
                            />
                          </a>
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold text-center mt-2">
                        Klik gambar untuk memperbesar di tab baru ↗
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-400 rounded-xl p-8 flex items-center justify-center bg-gray-50">
                      <p className="text-xs font-bold text-gray-500">Tidak ada gambar screenshots</p>
                    </div>
                  )}
                </div>

                {/* 2. Specs Information */}
                <div className="bg-white border-2 border-gray-900 rounded-xl p-5 shadow-[3px_3px_0px_#111827] space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">📋 Spesifikasi Akun</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Judul Listing</p>
                      <p className="text-xs font-black text-gray-900 mt-0.5">{selectedListing.nama_post}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Game</p>
                      <span className="inline-block bg-cyan-50 border border-cyan-500 text-cyan-800 text-[10px] font-black px-2 py-0.5 rounded-md mt-0.5 uppercase">
                        {selectedListing.accountGame?.nama_game || '-'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Server / Region</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">{selectedListing.server_region || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Rank Akun</p>
                      <p className="text-xs font-black text-gray-900 mt-0.5">{selectedListing.kondisi_akun?.rank || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Level Akun</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">{selectedListing.kondisi_akun?.level || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Tipe / Views</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">
                        {selectedListing.tipe_transaksi === 'jual' ? 'DIJUAL' : selectedListing.tipe_transaksi || '-'} • 👁 {selectedListing.view_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Pricing Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 border-2 border-gray-900 rounded-xl p-4 shadow-[3px_3px_0px_#111827]">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harga Jual</p>
                    <p className="text-xl font-black text-green-600 mt-0.5">
                      Rp {Number(selectedListing.harga_jual).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Negosiasi</p>
                    <p className="text-xs font-black mt-1">
                      {selectedListing.is_negotiable ? (
                        <span className="text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                          Bisa Nego {selectedListing.harga_nego_min ? `(Min: Rp ${Number(selectedListing.harga_nego_min).toLocaleString('id-ID')})` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded">
                          Harga Pas (Nett)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 4. Description */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">📝 Deskripsi Detail</p>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedListing.deskripsi_detail || 'Tidak ada deskripsi detail.'}
                    </p>
                  </div>
                </div>

                {/* 5. Reseller / WhatsApp Contact */}
                <div className="bg-white border-2 border-gray-900 rounded-xl p-4 shadow-[3px_3px_0px_#111827]">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">🏪 Informasi Penjual</p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-gray-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827]">
                        <span className="text-white font-black text-lg">
                          {(selectedListing.reseller?.nama_lengkap || 'R').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">
                          {selectedListing.reseller?.nama_lengkap || 'Unknown Reseller'}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500">
                          Reseller ID: #{selectedListing.reseller?.id || '-'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLiveChat(selectedListing.id)}
                      disabled={chatLoading}
                      className="inline-flex items-center gap-2 bg-[#ffc900] text-gray-900 border-2 border-gray-900 px-4 py-2 rounded-xl text-xs font-black shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase disabled:opacity-50"
                    >
                      {chatLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                          Membuka Chat...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Live Chat Penjual
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Operations) */}
              <div className="p-5 border-t-[3px] border-gray-900 bg-gray-50 flex gap-3 z-20">
                {selectedListing.status_listing === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedListing.id, false)}
                      disabled={actionLoading === selectedListing.id}
                      className="flex-1 bg-white text-red-600 font-black text-sm py-3 rounded-xl border-[3px] border-red-600 shadow-[4px_4px_0px_#dc2626] hover:translate-y-px hover:shadow-[2px_2px_0px_#dc2626] transition-all uppercase tracking-wider disabled:opacity-50"
                    >
                      Reject Listing
                    </button>
                    <button
                      onClick={() => handleApprove(selectedListing.id, true)}
                      disabled={actionLoading === selectedListing.id}
                      className="flex-1 bg-green-500 text-white font-black text-sm py-3 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:translate-y-px hover:shadow-[2px_2px_0px_#111827] transition-all uppercase tracking-wider disabled:opacity-50"
                    >
                      Approve Listing
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDelete(selectedListing.id)}
                    disabled={actionLoading === selectedListing.id}
                    className="flex-1 bg-red-50 text-red-600 font-black text-sm py-3 rounded-xl border-[3px] border-red-600 shadow-[4px_4px_0px_#dc2626] hover:translate-y-px hover:shadow-[2px_2px_0px_#dc2626] transition-all uppercase tracking-wider disabled:opacity-50 text-center"
                  >
                    Hapus Listing Ini
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
