'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { orderAkunApi } from '@/lib/orderAkunApi'
import { useToast } from '@/lib/contexts/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

function formatRupiah(val: number | string) {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID')
}

export default function ResellerPostingsPage() {
  const { toast } = useToast()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchListings = async () => {
    setLoading(true)
    try {
      const data = await orderAkunApi.getMyListings()
      setListings(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('Fetch listings error:', error)
      toast(error.message || 'Gagal memuat daftar postingan', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await orderAkunApi.deleteListing(deleteId)
      toast('Postingan berhasil dihapus.', 'success')
      setDeleteId(null)
      fetchListings()
    } catch (err: any) {
      toast(err.message || 'Gagal menghapus postingan', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const sl = (s: string) => s?.toLowerCase()

  const getStatusBadge = (status: string) => {
    switch (sl(status)) {
      case 'active':
      case 'aktif':
        return <span className="px-2.5 py-1 bg-green-100 text-green-700 border-2 border-green-700 rounded-lg font-bold text-[11px]">Aktif</span>
      case 'sold':
      case 'terjual':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border-2 border-blue-700 rounded-lg font-bold text-[11px]">Terjual</span>
      case 'inactive':
      case 'nonaktif':
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 border-2 border-gray-600 rounded-lg font-bold text-[11px]">Nonaktif</span>
      case 'pending':
      case 'review':
        return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 border-2 border-yellow-700 rounded-lg font-bold text-[11px]">Review</span>
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border-2 border-gray-700 rounded-lg font-bold text-[11px]">{status}</span>
    }
  }

  const filteredListings = listings.filter(item => {
    if (filter === 'ALL') return true
    if (filter === 'ACTIVE') return ['active', 'aktif'].includes(sl(item.status_listing || item.status))
    if (filter === 'SOLD') return ['sold', 'terjual'].includes(sl(item.status_listing || item.status))
    if (filter === 'INACTIVE') return ['inactive', 'nonaktif'].includes(sl(item.status_listing || item.status))
    return true
  })

  const totalAktif = listings.filter(i => ['active', 'aktif'].includes(sl(i.status_listing || i.status))).length
  const totalTerjual = listings.filter(i => ['sold', 'terjual'].includes(sl(i.status_listing || i.status))).length

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 border-[3px] border-gray-900 rounded-2xl p-6 mb-8 shadow-[6px_6px_0_#111827] text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Postingan Akun</h1>
              <p className="font-bold text-blue-100 mt-1">Kelola semua postingan akun game yang kamu jual.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/reseller/jual-akun" className="px-4 py-2 bg-white text-gray-900 font-black text-sm rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-px hover:translate-x-px transition-all">
                + Jual Akun Baru
              </Link>
              <Link href="/reseller" className="px-4 py-2 bg-white/20 text-white font-black text-sm rounded-lg border-2 border-white/50 hover:bg-white/30 transition-all">
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0_#111827]">
            <span className="text-xs font-black text-gray-400 uppercase">Total Postingan</span>
            <p className="text-3xl font-black text-gray-900">{listings.length}</p>
          </div>
          <div className="bg-green-50 border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0_#111827]">
            <span className="text-xs font-black text-green-600 uppercase">Aktif</span>
            <p className="text-3xl font-black text-green-700">{totalAktif}</p>
          </div>
          <div className="bg-blue-50 border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0_#111827]">
            <span className="text-xs font-black text-blue-600 uppercase">Terjual</span>
            <p className="text-3xl font-black text-blue-700">{totalTerjual}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'ALL', label: 'Semua' },
            { value: 'ACTIVE', label: 'Aktif' },
            { value: 'SOLD', label: 'Terjual' },
            { value: 'INACTIVE', label: 'Nonaktif' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 font-black text-sm rounded-lg border-2 border-gray-900 transition-all ${
                filter === f.value
                  ? 'bg-indigo-600 text-white shadow-[2px_2px_0_#111827]'
                  : 'bg-white text-gray-900 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-10 text-center shadow-[6px_6px_0_#111827]">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-900">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Belum Ada Postingan</h3>
            <p className="text-gray-500 font-bold mb-6">Mulai jual akun game kamu sekarang!</p>
            <Link href="/reseller/jual-akun" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black uppercase text-sm rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all">
              Jual Akun Sekarang
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredListings.map((item) => {
              const status = item.status_listing || item.status || ''
              const isSold = ['sold', 'terjual'].includes(sl(status))
              return (
                <div key={item.id} className={`bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden transition-all ${isSold ? 'opacity-75' : 'hover:-translate-y-0.5'}`}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between p-4 border-b-[3px] border-gray-900 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gray-200 rounded-xl border-2 border-gray-900 shrink-0 overflow-hidden shadow-[2px_2px_0_#111827]">
                        {(item.screenshots?.[0] || item.accountGame?.gambar_game) ? (
                          <img src={resolveImageUrl(item.screenshots?.[0] || item.accountGame?.gambar_game)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-black text-gray-400">🎮</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-gray-900 truncate">{item.nama_post}</h3>
                        <p className="text-xs font-bold text-gray-500">{item.accountGame?.nama_game || 'Game'}</p>
                      </div>
                    </div>
                    {getStatusBadge(status)}
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-xs font-black text-gray-400 uppercase">Harga</span>
                        <p className="text-lg font-black text-blue-600">{formatRupiah(item.harga_jual || item.harga)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-400 uppercase">Dilihat</span>
                        <p className="text-sm font-black text-gray-700">{item.view_count || 0}x</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/accounts/${item.slug || item.id}`}
                        className="flex-1 text-center px-3 py-2 bg-white text-gray-900 font-black text-xs rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-px hover:translate-x-px transition-all uppercase"
                      >
                        Lihat
                      </Link>
                      {!isSold && (
                        <>
                          <Link
                            href={`/reseller/jual-akun?edit=${item.id}`}
                            className="flex-1 text-center px-3 py-2 bg-indigo-100 text-indigo-700 font-black text-xs rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-px hover:translate-x-px transition-all uppercase"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="px-3 py-2 bg-red-100 text-red-700 font-black text-xs rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-px hover:translate-x-px transition-all uppercase"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
      {deleteId && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteId(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <motion.div
            className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
          >
            <h3 className="text-lg font-black text-gray-900 uppercase mb-2">Hapus Postingan?</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">Postingan yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-white text-gray-900 font-black uppercase text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
              >
                Batal
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
