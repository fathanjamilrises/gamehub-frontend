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

export default function SellerOrderDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [dataAkun, setDataAkun] = useState('')
  const [catatanPenjual, setCatatanPenjual] = useState('')

  const sl = (status: string) => status?.toLowerCase()

  useEffect(() => {
    if (!id) return
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const data = await orderAkunApi.getSellerOrderDetail(Number(id))
        setOrder(data)

        // Jika sudah dikirim, isi form dengan data yang ada
        if (data.data_akun) {
          setDataAkun(typeof data.data_akun === 'object' ? JSON.stringify(data.data_akun, null, 2) : data.data_akun)
        }
        if (data.catatan_penjual) {
          setCatatanPenjual(data.catatan_penjual)
        }
      } catch (error: any) {
        console.error('Fetch error:', error)
        toast(error.message || 'Gagal memuat detail pesanan', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, toast])

  const handleDeliver = async () => {
    if (!order || !dataAkun) return
    setProcessing(true)
    try {
      // Coba parse data akun sebagai JSON jika memungkinkan
      let parsedData = dataAkun
      try {
        parsedData = JSON.parse(dataAkun)
      } catch (e) {
        // Jika bukan JSON valid, kirim sebagai string biasa
      }

      await orderAkunApi.deliverAccount(order.id, parsedData, catatanPenjual)
      toast('Data akun berhasil dikirim ke pembeli!', 'success')
      const updated = await orderAkunApi.getSellerOrderDetail(Number(id))
      setOrder(updated)
    } catch (err: any) {
      toast(err.message || 'Gagal mengirim data akun', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (sl(status)) {
      case 'waiting_payment':
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 border-2 border-amber-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#b45309]">Menunggu Pembayaran</span>
      case 'paid':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border-2 border-emerald-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#047857]">Perlu Dikirim</span>
      case 'delivered':
        return <span className="px-3 py-1 bg-violet-100 text-violet-700 border-2 border-violet-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#6d28d9]">Data Dikirim</span>
      case 'confirmed':
        return <span className="px-3 py-1 bg-teal-100 text-teal-700 border-2 border-teal-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#0f766e]">Dikonfirmasi</span>
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 border-2 border-green-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#15803d]">Selesai</span>
      case 'disputed':
        return <span className="px-3 py-1 bg-red-100 text-red-700 border-2 border-red-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#b91c1c]">Dispute</span>
      case 'refunded':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 border-2 border-orange-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#c2410c]">Refund</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 border-2 border-gray-700 rounded-lg font-bold text-xs shadow-[2px_2px_0_#374151]">{status}</span>
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <Link href="/reseller/orders" className="inline-flex items-center gap-2 text-sm font-black text-violet-600 hover:text-violet-700 transition-colors uppercase tracking-widest mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali ke Daftar Pesanan
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase">Detail Pesanan #ORD-{order.id}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-bold text-gray-500">Status Pesanan:</span>
                {getStatusBadge(order.status)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Total Pendapatan</span>
              <p className="text-3xl font-black text-emerald-600">Rp {Number(order.harga || order.total_bayar || 0).toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Column (Details & Form) */}
          <div className="md:col-span-2 space-y-6">

            {/* Detail Produk Card */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-4 border-b-[3px] border-gray-900 bg-gradient-to-r from-violet-100 to-purple-100 font-black text-gray-900 uppercase text-sm">Produk yang Dipesan</div>
              <div className="p-6 flex gap-5">
                <div className="w-24 h-24 bg-gray-200 rounded-xl border-2 border-gray-900 shrink-0 overflow-hidden shadow-[3px_3px_0_#111827]">
                  {order.listing?.accountGame?.gambar_game ? (
                    <img src={resolveImageUrl(order.listing.accountGame.gambar_game)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-gray-400">G</div>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-xl">{order.listing?.nama_post || 'Judul Akun'}</h3>
                  <p className="text-sm font-bold text-gray-500 mt-1">Game: <span className="text-gray-700">{order.listing?.accountGame?.nama_game || '-'}</span></p>
                  <p className="text-sm font-bold text-gray-500">Tanggal Order: <span className="text-gray-700">{new Date(order.createdAt || order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></p>
                </div>
              </div>
            </div>

            {/* Catatan Pembeli Card */}
            {order.catatan_pembeli && (
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
                <div className="p-4 border-b-[3px] border-gray-900 bg-amber-50 font-black text-amber-700 uppercase text-sm">Catatan dari Pembeli</div>
                <div className="p-6 bg-amber-50/50">
                  <p className="text-sm font-bold text-gray-700">{order.catatan_pembeli}</p>
                </div>
              </div>
            )}

            {/* Form Input Data Akun Card */}
            {sl(order.status) === 'paid' && (
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
                <div className="p-4 border-b-[3px] border-gray-900 bg-emerald-100 text-emerald-900 font-black uppercase text-sm">Kirim Data Akun</div>
                <div className="p-6">
                  <div className="mb-5">
                    <label className="text-xs font-black text-gray-400 uppercase block mb-1">Data Akun (Email, Password, PIN, dll)</label>
                    <textarea
                      value={dataAkun}
                      onChange={(e) => setDataAkun(e.target.value)}
                      placeholder={'Masukkan data akun di sini...\nContoh:\nEmail: akun@gmail.com\nPassword: pass123\nPIN: 1234\nRecovery Email: backup@gmail.com'}
                      rows={6}
                      className="w-full resize-none border-2 border-gray-900 rounded-xl p-4 font-bold text-sm text-gray-900 focus:outline-none focus:border-violet-600 transition-all shadow-[4px_4px_0_#111827] bg-white"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="text-xs font-black text-gray-400 uppercase block mb-1">Catatan untuk Pembeli (Opsional)</label>
                    <textarea
                      value={catatanPenjual}
                      onChange={(e) => setCatatanPenjual(e.target.value)}
                      placeholder="Tambahkan instruksi atau catatan untuk pembeli (misal: mohon langsung ganti password)"
                      rows={3}
                      className="w-full resize-none border-2 border-gray-900 rounded-xl p-4 font-bold text-sm text-gray-900 focus:outline-none focus:border-violet-600 transition-all shadow-[4px_4px_0_#111827] bg-white"
                    />
                  </div>

                  <button
                    onClick={handleDeliver}
                    disabled={processing || !dataAkun}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-sm rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? 'Memproses...' : 'Kirim Data Akun ke Pembeli'}
                  </button>
                </div>
              </div>
            )}

            {/* Data Akun yang Telah Dikirim (Read-only) */}
            {['delivered', 'confirmed', 'completed'].includes(sl(order.status)) && order.data_akun && (
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
                <div className="p-4 border-b-[3px] border-gray-900 bg-violet-100 text-violet-900 font-black uppercase text-sm">Data Akun yang Telah Dikirim</div>
                <div className="p-6 bg-violet-50">
                  <pre className="font-bold text-sm text-gray-900 whitespace-pre-wrap bg-white p-4 border-2 border-gray-900 rounded-xl shadow-[4px_4px_0_#111827]">
                    {typeof order.data_akun === 'object' ? JSON.stringify(order.data_akun, null, 2) : order.data_akun}
                  </pre>
                  {order.catatan_penjual && (
                    <div className="mt-4">
                      <span className="text-xs font-black text-gray-400 uppercase">Catatan Anda:</span>
                      <p className="text-sm font-bold text-gray-700">{order.catatan_penjual}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Info untuk Dispute */}
            {sl(order.status) === 'disputed' && (
              <div className="bg-red-50 border-[3px] border-red-600 rounded-2xl shadow-[6px_6px_0_#b91c1c] p-6">
                <h3 className="font-black text-red-700 uppercase text-sm mb-2">Pesanan Dalam Dispute</h3>
                <p className="text-sm font-bold text-red-600">Pembeli mengajukan komplain. Admin sedang meninjau pesanan ini.</p>
                {order.catatan_dispute && (
                  <div className="mt-3 bg-white border-2 border-red-300 rounded-xl p-4">
                    <span className="text-xs font-black text-gray-400 uppercase">Alasan Dispute:</span>
                    <p className="text-sm font-bold text-gray-700 mt-1">{order.catatan_dispute}</p>
                  </div>
                )}
              </div>
            )}

            {/* Status Info untuk Refunded */}
            {sl(order.status) === 'refunded' && (
              <div className="bg-orange-50 border-[3px] border-orange-600 rounded-2xl shadow-[6px_6px_0_#c2410c] p-6">
                <h3 className="font-black text-orange-700 uppercase text-sm mb-2">Dana Dikembalikan</h3>
                <p className="text-sm font-bold text-orange-600">Admin memutuskan untuk mengembalikan dana ke pembeli.</p>
                {order.catatan_admin && (
                  <div className="mt-3 bg-white border-2 border-orange-300 rounded-xl p-4">
                    <span className="text-xs font-black text-gray-400 uppercase">Catatan Admin:</span>
                    <p className="text-sm font-bold text-gray-700 mt-1">{order.catatan_admin}</p>
                  </div>
                )}
              </div>
            )}

            {/* Status Info untuk Completed */}
            {['confirmed', 'completed'].includes(sl(order.status)) && (
              <div className="bg-green-50 border-[3px] border-green-600 rounded-2xl shadow-[6px_6px_0_#15803d] p-6">
                <h3 className="font-black text-green-700 uppercase text-sm mb-2">Transaksi Selesai</h3>
                <p className="text-sm font-bold text-green-600">Pembeli telah mengkonfirmasi penerimaan akun. Dana akan diteruskan ke Anda.</p>
              </div>
            )}
          </div>

          {/* Right Column (Info) */}
          <div className="md:col-span-1 space-y-6">

            {/* Info Pembeli Card */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-4 border-b-[3px] border-gray-900 bg-gray-900 font-black text-white uppercase text-sm">Info Pembeli</div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-xs font-black text-gray-400 uppercase">Nama Pembeli</span>
                  <p className="font-black text-gray-900">{order.buyer?.username || order.buyer?.name || 'User'}</p>
                </div>
                <div>
                  <span className="text-xs font-black text-gray-400 uppercase">ID Pembeli</span>
                  <p className="font-bold text-gray-700">#{order.id_user}</p>
                </div>
              </div>
            </div>

            {/* Nota Card */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-4 border-b-[3px] border-gray-900 bg-blue-100 font-black text-blue-900 uppercase text-sm">Nota Transaksi</div>
              <div className="p-6">
                <p className="text-sm font-bold text-gray-600 mb-4">Lihat bukti pembayaran dan rincian transaksi ini.</p>
                <Link href={`/payment/success/akun?id=${order.id}`} target="_blank" className="w-full block text-center py-2 bg-white text-gray-900 font-black text-sm rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[1px] hover:translate-x-[1px] transition-all">
                  Lihat Nota
                </Link>
              </div>
            </div>

            {/* Bantuan Card */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] p-6">
              <h4 className="font-black text-gray-900 mb-2">Butuh Bantuan?</h4>
              <p className="text-sm font-bold text-gray-600 mb-4">Jika ada kendala dengan pesanan ini, silakan hubungi admin GameHub.</p>
              <a href="https://wa.me/your-number" target="_blank" rel="noopener noreferrer" className="w-full block text-center py-2 bg-white text-gray-900 font-black text-sm rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_#111827] hover:shadow-[1px_1px_0_#111827] hover:translate-y-[1px] hover:translate-x-[1px] transition-all">
                Hubungi Admin
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
