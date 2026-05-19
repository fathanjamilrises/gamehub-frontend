'use client'

import { useState, useEffect } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { adminFetch } from '@/lib/adminFetch'
import { useToast } from '@/lib/contexts/ToastContext'
import Image from 'next/image'

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
  const { success: showSuccess, error: showError } = useToast()

  const fetchResellers = async () => {
    try {
      setLoading(true)
      const res = await adminFetch('/api-proxy/admin/resellers')
      const data = await res.json()
      if (res.ok) {
        setResellers(data.data || data.resellers || data)
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
        showSuccess(`Status berhasil diubah menjadi ${newStatus}`)
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
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md border-2 border-green-700 uppercase">Aktif</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md border-2 border-red-700 uppercase">Ditolak</span>
      default:
        return <span className="px-2 py-1 bg-[#ffc900]/20 text-[#ffc900] text-xs font-bold rounded-md border-2 border-[#ffc900] uppercase">Pending</span>
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Manajemen Reseller</h1>
            <p className="text-sm font-bold text-gray-500">Kelola dan verifikasi pendaftaran reseller baru.</p>
          </div>
          <button
            onClick={fetchResellers}
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
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">Info User</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900">Kontak</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest border-r-[3px] border-gray-900 text-center">Status</th>
                  <th className="p-4 text-xs font-black text-gray-900 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm font-bold text-gray-500">Memuat data...</td>
                  </tr>
                ) : resellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm font-bold text-gray-500">Belum ada data pendaftar reseller.</td>
                  </tr>
                ) : (
                  resellers.map((r) => (
                    <tr key={r.id} className="border-b-[3px] border-gray-900 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-bold text-gray-900 border-r-[3px] border-gray-900">#{r.id}</td>
                      <td className="p-4 border-r-[3px] border-gray-900">
                        <p className="text-sm font-black text-gray-900">{r.nama_lengkap}</p>
                        <p className="text-[10px] font-bold text-gray-500">{r.user?.email || `User ID: ${r.id_user}`}</p>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-600 border-r-[3px] border-gray-900">
                        {r.no_hp}
                      </td>
                      <td className="p-4 text-center border-r-[3px] border-gray-900">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openDetail(r)}
                          className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] hover:translate-y-px hover:shadow-none transition-all uppercase"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b-[3px] border-gray-900 p-5 flex items-center justify-between z-20">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Detail Pendaftar</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 border-2 border-gray-900 rounded-lg hover:bg-gray-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Lengkap</p>
                      <p className="text-sm font-bold text-gray-900 bg-gray-50 p-2.5 rounded-lg border-2 border-gray-200">{selectedReseller.nama_lengkap}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nomor HP</p>
                      <p className="text-sm font-bold text-gray-900 bg-gray-50 p-2.5 rounded-lg border-2 border-gray-200">{selectedReseller.no_hp}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alamat</p>
                      <p className="text-sm font-bold text-gray-900 bg-gray-50 p-2.5 rounded-lg border-2 border-gray-200">{selectedReseller.alamat || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Saat Ini</p>
                      <div className="mt-1">{getStatusBadge(selectedReseller.status)}</div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Foto KTP</p>
                    {selectedReseller.ktp_url ? (
                      <div className="border-2 border-gray-900 rounded-xl overflow-hidden shadow-[3px_3px_0px_#111827]">
                        <div className="relative w-full aspect-video bg-gray-100">
                          <Image 
                            src={selectedReseller.ktp_url} 
                            alt="Foto KTP" 
                            fill 
                            unoptimized
                            className="object-contain"
                          />
                        </div>
                        <div className="p-2 bg-gray-900 text-center">
                          <a href={selectedReseller.ktp_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white hover:text-[#ffc900]">Buka Gambar Penuh ↗</a>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-400 rounded-xl p-8 flex items-center justify-center bg-gray-50">
                        <p className="text-xs font-bold text-gray-500">Tidak ada foto KTP</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons (Only show if pending) */}
                {selectedReseller.status === 'pending' && (
                  <div className="pt-6 border-t-[3px] border-gray-900 flex gap-3">
                    <button
                      onClick={() => handleUpdateStatus(selectedReseller.id, 'rejected')}
                      disabled={actionLoading}
                      className="flex-1 bg-white text-red-600 font-black text-sm py-3 rounded-xl border-[3px] border-red-600 shadow-[4px_4px_0px_#dc2626] hover:translate-y-px hover:shadow-[2px_2px_0px_#dc2626] transition-all uppercase tracking-wider"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReseller.id, 'approved')}
                      disabled={actionLoading}
                      className="flex-1 bg-green-500 text-white font-black text-sm py-3 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:translate-y-px hover:shadow-[2px_2px_0px_#111827] transition-all uppercase tracking-wider"
                    >
                      {actionLoading ? 'Memproses...' : 'Setujui Reseller'}
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
