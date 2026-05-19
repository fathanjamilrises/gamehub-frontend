'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { orderAkunApi } from '@/lib/orderAkunApi'
import { useToast } from '@/lib/contexts/ToastContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

export default function OrderDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { toast } = useToast()
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [catatanDispute, setCatatanDispute] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)

  const s = (status: string) => status?.toLowerCase()

  const getStatusBadge = (status: string) => {
    switch (s(status)) {
      case 'waiting_payment':
      case 'pending':
        return <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 border-2 border-yellow-700 rounded-lg font-black text-xs uppercase">Menunggu Pembayaran</span>
      case 'paid':
        return <span className="px-3 py-1.5 bg-blue-100 text-blue-800 border-2 border-blue-700 rounded-lg font-black text-xs uppercase">Dibayar (Escrow)</span>
      case 'delivered':
        return <span className="px-3 py-1.5 bg-purple-100 text-purple-800 border-2 border-purple-700 rounded-lg font-black text-xs uppercase">Data Dikirim</span>
      case 'confirmed':
        return <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border-2 border-emerald-700 rounded-lg font-black text-xs uppercase">Dikonfirmasi</span>
      case 'completed':
        return <span className="px-3 py-1.5 bg-green-100 text-green-800 border-2 border-green-700 rounded-lg font-black text-xs uppercase">Selesai</span>
      case 'disputed':
        return <span className="px-3 py-1.5 bg-red-100 text-red-800 border-2 border-red-700 rounded-lg font-black text-xs uppercase">Dispute</span>
      case 'refunded':
        return <span className="px-3 py-1.5 bg-orange-100 text-orange-800 border-2 border-orange-700 rounded-lg font-black text-xs uppercase">Dana Dikembalikan</span>
      case 'cancelled':
        return <span className="px-3 py-1.5 bg-gray-100 text-gray-600 border-2 border-gray-500 rounded-lg font-black text-xs uppercase">Dibatalkan</span>
      default:
        return <span className="px-3 py-1.5 bg-gray-100 text-gray-700 border-2 border-gray-700 rounded-lg font-black text-xs uppercase">{status}</span>
    }
  }

  useEffect(() => {
    if (!id) return
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const data = await orderAkunApi.getOrderDetail(Number(id))
        setOrder(data)
      } catch (error: any) {
        console.error('Fetch error:', error)
        toast(error.message || 'Gagal memuat detail pesanan', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, toast])

  const handleConfirm = async () => {
    if (!order) return
    setProcessing(true)
    try {
      await orderAkunApi.confirmReceive(order.id)
      toast('Pesanan dikonfirmasi! Dana akan diteruskan ke penjual.', 'success')
      const updated = await orderAkunApi.getOrderDetail(Number(id))
      setOrder(updated)
    } catch (err: any) {
      toast(err.message || 'Gagal mengonfirmasi pesanan', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDispute = async () => {
    if (!order || !catatanDispute) return
    setProcessing(true)
    try {
      await orderAkunApi.disputeOrder(order.id, catatanDispute)
      toast('Komplain berhasil diajukan. Admin akan meninjau dalam 1x24 jam.', 'warning')
      const updated = await orderAkunApi.getOrderDetail(Number(id))
      setOrder(updated)
      setShowDisputeForm(false)
    } catch (err: any) {
      toast(err.message || 'Gagal mengajukan komplain', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) return null

  const orderDate = order.createdAt || order.created_at
  const formattedDate = orderDate ? new Date(orderDate).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali ke Pesanan Saya
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">Pesanan #ORD-{order.id}</h1>
              <p className="text-sm font-bold text-gray-500 mt-1">Dibuat: {formattedDate}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Produk */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-4 border-b-[3px] border-gray-900 bg-blue-50">
                <h2 className="font-black text-gray-900 uppercase text-sm">Detail Produk</h2>
              </div>
              <div className="p-6">
                <div className="flex gap-5">
                  <div className="w-24 h-24 bg-gray-200 rounded-xl border-2 border-gray-900 shrink-0 overflow-hidden shadow-[3px_3px_0_#111827]">
                    {order.listing?.accountGame?.gambar_game && (
                      <img src={resolveImageUrl(order.listing.accountGame.gambar_game)} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 text-xl truncate">{order.listing?.nama_post || 'Akun Game'}</h3>
                    <p className="text-sm font-bold text-gray-500 mt-1">Game: {order.listing?.accountGame?.nama_game || '-'}</p>
                    <p className="text-sm font-bold text-gray-500">Penjual: {order.listing?.reseller?.store_name || order.listing?.reseller?.nama_lengkap || 'Toko'}</p>
                    {order.listing?.deskripsi && (
                      <p className="text-xs text-gray-400 font-bold mt-2 line-clamp-2">{order.listing.deskripsi}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rincian Pembayaran */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-4 border-b-[3px] border-gray-900 bg-gray-50">
                <h2 className="font-black text-gray-900 uppercase text-sm">Rincian Pembayaran</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500 text-sm">Harga Produk</span>
                  <span className="font-black text-gray-900">Rp {Number(order.harga || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-500 text-sm">Biaya Admin</span>
                  <span className="font-black text-gray-900">Rp {Number(order.fee_admin || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t-2 border-gray-900 pt-3 flex justify-between items-center">
                  <span className="font-black text-gray-900">Total Bayar</span>
                  <span className="font-black text-blue-600 text-xl">Rp {Number(order.total_bayar || order.harga || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-gray-500 text-sm">Metode</span>
                  <span className="font-black text-gray-900 text-sm">Xendit</span>
                </div>
              </div>
            </div>

            {/* Data Akun (Tampil jika delivered/confirmed/completed) */}
            {(['delivered', 'confirmed', 'completed'].includes(s(order.status))) && order.data_akun && (
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
                <div className="p-4 border-b-[3px] border-gray-900 bg-green-100">
                  <h2 className="font-black text-green-900 uppercase text-sm">Data Akun dari Penjual</h2>
                </div>
                <div className="p-6 bg-green-50">
                  <pre className="font-bold text-sm text-gray-900 whitespace-pre-wrap bg-white p-4 border-2 border-gray-900 rounded-xl shadow-[3px_3px_0_#111827]">
                    {typeof order.data_akun === 'object' ? JSON.stringify(order.data_akun, null, 2) : order.data_akun}
                  </pre>
                  {order.catatan_penjual && (
                    <div className="mt-4 p-3 bg-white border-2 border-gray-300 rounded-lg">
                      <span className="text-xs font-black text-gray-400 uppercase">Catatan Penjual:</span>
                      <p className="text-sm font-bold text-gray-700 mt-1">{order.catatan_penjual}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Dispute */}
            {s(order.status) === 'delivered' && showDisputeForm && (
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
                <div className="p-4 border-b-[3px] border-gray-900 bg-red-100">
                  <h2 className="font-black text-red-900 uppercase text-sm">Ajukan Dispute / Komplain</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm font-bold text-gray-500 mb-4">Jelaskan masalah yang kamu alami. Admin akan meninjau dalam 1x24 jam.</p>
                  <textarea
                    value={catatanDispute}
                    onChange={(e) => setCatatanDispute(e.target.value)}
                    placeholder="Contoh: Data login tidak valid, akun berbeda dari deskripsi, dll"
                    rows={4}
                    className="w-full resize-none border-2 border-gray-900 rounded-xl p-4 font-bold text-sm text-gray-900 focus:outline-none focus:border-red-500 transition-all shadow-[3px_3px_0_#111827] bg-white mb-4"
                  />
                  <div className="flex gap-3">
                    <button onClick={handleDispute} disabled={processing || !catatanDispute} className="px-5 py-2.5 bg-red-600 text-white font-black text-sm rounded-lg border-2 border-gray-900 shadow-[3px_3px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all disabled:opacity-50">
                      Kirim Komplain
                    </button>
                    <button onClick={() => setShowDisputeForm(false)} className="px-5 py-2.5 bg-white text-gray-900 font-black text-sm rounded-lg border-2 border-gray-900 shadow-[3px_3px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all">
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status & Tindakan */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden sticky top-24">
              <div className="p-4 border-b-[3px] border-gray-900 bg-gray-900">
                <h2 className="font-black text-white uppercase text-sm">Status & Tindakan</h2>
              </div>
              <div className="p-5 space-y-5">
                {/* Status indicator */}
                <div className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      s(order.status) === 'paid' ? 'bg-blue-500 animate-pulse' :
                      s(order.status) === 'delivered' ? 'bg-purple-500 animate-pulse' :
                      ['confirmed', 'completed'].includes(s(order.status)) ? 'bg-green-500' :
                      s(order.status) === 'disputed' ? 'bg-red-500 animate-pulse' :
                      'bg-yellow-500 animate-pulse'
                    }`} />
                    <span className="font-black text-sm text-gray-900">
                      {s(order.status) === 'waiting_payment' || s(order.status) === 'pending' ? 'Menunggu Pembayaran' :
                       s(order.status) === 'paid' ? 'Menunggu Pengiriman Data' :
                       s(order.status) === 'delivered' ? 'Data Akun Sudah Dikirim' :
                       s(order.status) === 'confirmed' ? 'Dikonfirmasi Pembeli' :
                       s(order.status) === 'completed' ? 'Transaksi Selesai' :
                       s(order.status) === 'disputed' ? 'Dalam Proses Mediasi' :
                       s(order.status) === 'refunded' ? 'Dana Dikembalikan' :
                       s(order.status) === 'cancelled' ? 'Dibatalkan' : order.status}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {(s(order.status) === 'waiting_payment' || s(order.status) === 'pending') && (order.payment_url || order.xendit_invoice_url || order.invoice_url) && (
                  <a href={order.payment_url || order.xendit_invoice_url || order.invoice_url} rel="noopener noreferrer" className="w-full block text-center py-3 bg-yellow-400 text-gray-900 font-black uppercase tracking-wider text-sm rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all">
                    Bayar Sekarang
                  </a>
                )}

                {s(order.status) === 'paid' && (
                  <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <svg className="w-8 h-8 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="font-bold text-blue-700 text-sm">Menunggu penjual mengirim data akun...</p>
                  </div>
                )}

                {s(order.status) === 'delivered' && !showDisputeForm && (
                  <div className="space-y-3">
                    <button onClick={handleConfirm} disabled={processing} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-wider text-sm rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all disabled:opacity-50">
                      Konfirmasi Akun Diterima
                    </button>
                    <button onClick={() => setShowDisputeForm(true)} className="w-full py-3 bg-white hover:bg-red-50 text-red-600 font-black uppercase tracking-wider text-sm rounded-xl border-2 border-red-300 shadow-[3px_3px_0_#fecaca] hover:shadow-[1px_1px_0_#fecaca] hover:translate-y-[2px] hover:translate-x-[2px] transition-all">
                      Ada Masalah? Dispute
                    </button>
                    <p className="text-[11px] font-bold text-gray-400 text-center">Auto-konfirmasi dalam 3 hari jika tidak ada respons.</p>
                  </div>
                )}

                {s(order.status) === 'confirmed' && (
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                    <p className="font-bold text-emerald-700 text-sm">Akun dikonfirmasi. Dana akan diteruskan ke penjual.</p>
                  </div>
                )}

                {s(order.status) === 'completed' && (
                  <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <p className="font-bold text-green-700 text-sm">Transaksi selesai. Dana telah diteruskan ke penjual.</p>
                  </div>
                )}

                {s(order.status) === 'disputed' && (
                  <div className="text-center p-4 bg-red-50 rounded-xl border-2 border-red-200">
                    <p className="font-bold text-red-700 text-sm">Pesanan dalam proses mediasi admin (1x24 jam).</p>
                  </div>
                )}

                {s(order.status) === 'refunded' && (
                  <div className="text-center p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                    <p className="font-bold text-orange-700 text-sm">Dana telah dikembalikan ke pembeli.</p>
                  </div>
                )}

                {s(order.status) === 'cancelled' && (
                  <div className="text-center p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <p className="font-bold text-gray-500 text-sm">Pesanan ini telah dibatalkan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info Pesanan */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-4 border-b-[3px] border-gray-900 bg-gray-50">
                <h2 className="font-black text-gray-900 uppercase text-sm">Info Pesanan</h2>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Kode</span>
                  <span className="font-black text-gray-900">#{order.invoice_number || `ORD-${order.id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Tanggal</span>
                  <span className="font-black text-gray-900">{formattedDate}</span>
                </div>
                {order.catatan_pembeli && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-500">Catatan:</span>
                    <p className="font-bold text-gray-900 mt-1">{order.catatan_pembeli}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
