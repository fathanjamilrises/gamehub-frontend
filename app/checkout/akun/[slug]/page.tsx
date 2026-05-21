'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { authFetch } from '@/lib/authApi'
import { orderAkunApi } from '@/lib/orderAkunApi'
import { useToast } from '@/lib/contexts/ToastContext'
import { useAuth } from '@/lib/hooks/useAuth'
import { savePendingPaymentRedirect, saveReceiptSnapshot, mapReceiptSnapshotFromOrder } from '@/lib/paymentReceipt'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

export default function AkunCheckoutPage() {
  const params = useParams()
  const slug = params?.slug as string
  const router = useRouter()
  const { toast } = useToast()
  
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [catatan, setCatatan] = useState('')

  useEffect(() => {
    if (!slug) return
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const res = await authFetch(`/api-proxy/jual-beli-akun/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setListing(data.data || data)
        } else {
          toast('Listing tidak ditemukan atau sudah tidak tersedia', 'error')
          router.push('/')
        }
      } catch (error) {
        console.error('Fetch error:', error)
        toast('Gagal memuat detail pesanan', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [slug, router, toast])

  const handleCheckout = async () => {
    if (!listing) return
    setProcessing(true)
    try {
      const result = (await orderAkunApi.checkout(listing.id, catatan)) as any
      console.log('[Checkout] Order result:', result)

      const order = result.order ?? result.data?.order ?? result.data ?? result
      const orderId = String(order.id || order.invoice_number || '')
      const orderCode = order.invoice_number || orderId || 'ORD-SUCCESS'

      // Simpan snapshot nota
      try {
        const snapshot = mapReceiptSnapshotFromOrder({
          ...order,
          nama_games: listing.accountGame?.nama_game || listing.nama_game || 'Game',
          nama_produk: listing.nama_akun || listing.judul || 'Akun Game',
          harga_produk: listing.harga_jual,
          image_url: listing.accountGame?.gambar_game || '',
          status: order.status || 'pending_payment',
        })
        saveReceiptSnapshot(snapshot)
      } catch (snapErr) {
        console.error('Failed to save receipt snapshot:', snapErr)
      }

      const paymentUrl = result.payment?.invoice_url || result.payment_url || result.xendit_invoice_url || result.invoice_url || order.payment_url || order.xendit_invoice_url
      if (paymentUrl) {
        savePendingPaymentRedirect(orderCode, orderId)
        toast('Pesanan berhasil dibuat! Mengalihkan ke pembayaran...', 'success')
        window.location.href = paymentUrl
      } else {
        toast('Pesanan berhasil dibuat!', 'success')
        window.location.href = `/payment/success?orderCode=${encodeURIComponent(orderCode)}&status=pending`
      }
    } catch (err: any) {
      toast(err.message || 'Gagal membuat pesanan', 'error')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-purple-600 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
            <p className="font-black text-gray-900 uppercase tracking-wider text-sm">Menyiapkan Pesanan...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!listing) return null

  // Resolve thumbnail
  let thumbnail = ''
  if (listing.screenshots) {
    const raw = listing.screenshots
    let parsed: any[] = []
    if (typeof raw === 'string') { try { parsed = JSON.parse(raw) } catch {} }
    else if (Array.isArray(raw)) parsed = raw
    if (parsed.length > 0) {
      thumbnail = typeof parsed[0] === 'string' ? resolveImageUrl(parsed[0]) : resolveImageUrl(parsed[0]?.url_gambar)
    }
  }
  if (!thumbnail && listing.accountGame?.gambar_game) {
    thumbnail = resolveImageUrl(listing.accountGame.gambar_game)
  }

  const harga = Number(listing.harga_jual) || 0
  const feeAdmin = 0 
  const totalBayar = harga + feeAdmin

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <Link href={`/accounts/${slug}`} className="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
            Checkout Pesanan
          </h1>
          <p className="font-bold text-gray-500 mt-2 text-lg">Langkah terakhir untuk mendapatkan akun ini.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Bagian Detail Akun */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card Produk */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-4 border-b-[3px] border-gray-900 bg-purple-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <h2 className="font-black text-purple-900 uppercase tracking-widest text-sm">Informasi Pesanan</h2>
              </div>
              
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Thumbnail */}
                <div className="w-full md:w-48 h-32 md:h-48 bg-gray-200 rounded-xl border-[3px] border-gray-900 overflow-hidden shrink-0 relative">
                  {thumbnail ? (
                    <img src={thumbnail} alt={listing.nama_post} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border-2 border-gray-900 shadow-[2px_2px_0_#111827]">
                    {listing.accountGame?.nama_game || 'Game'}
                  </div>
                </div>

                {/* Info Utama */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2 leading-tight">{listing.nama_post}</h3>
                    <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border-2 border-gray-900 mb-4">
                      <div className="w-6 h-6 bg-gray-300 rounded-full border border-gray-900 overflow-hidden">
                        {listing.reseller?.user?.avatar ? (
                          <img src={resolveImageUrl(listing.reseller.user.avatar)} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-full h-full text-gray-500 bg-gray-200" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-700">Penjual: <span className="text-gray-900">{listing.reseller?.store_name || listing.reseller?.user?.name || 'Toko'}</span></span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-black text-xs uppercase tracking-widest block mb-1">Harga Akun</span>
                    <span className="text-3xl font-black text-blue-600 drop-shadow-[2px_2px_0_#111827]">Rp {harga.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Catatan */}
            <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-4 border-b-[3px] border-gray-900 bg-yellow-400">
                <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">Catatan untuk Penjual (Opsional)</h2>
              </div>
              <div className="p-6 bg-gray-50">
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tulis pesan untuk penjual (misal: mohon proses secepatnya ya min, no WA saya 0812...)"
                  rows={3}
                  className="w-full resize-none border-2 border-gray-900 rounded-xl p-4 font-bold text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-[4px_4px_0_#111827] bg-white"
                />
              </div>
            </div>

            {/* Info Keamanan */}
            <div className="bg-green-50 border-2 border-green-500 p-4 rounded-xl flex items-start gap-4 shadow-[4px_4px_0_#22c55e]">
              <svg className="w-8 h-8 text-green-600 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <div>
                <h4 className="font-black text-green-800 uppercase tracking-wider text-sm mb-1">Transaksi Aman via Escrow</h4>
                <p className="text-sm text-green-700 font-medium leading-relaxed">
                  Dana Anda akan <span className="font-bold">ditahan oleh sistem GameHub</span> dan baru diteruskan ke penjual setelah Anda mengonfirmasi bahwa data akun sudah diterima dan sesuai dengan deskripsi.
                </p>
              </div>
            </div>
          </div>

          {/* Bagian Ringkasan Pembayaran */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_#111827] overflow-hidden">
              <div className="p-5 border-b-[3px] border-gray-900 bg-gray-900">
                <h2 className="font-black text-white uppercase tracking-widest text-lg">Ringkasan Pembayaran</h2>
              </div>
              
              <div className="p-6 space-y-4 bg-gray-50">
                <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                  <span>Harga Akun</span>
                  <span className="text-gray-900">Rp {harga.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                  <span>Biaya Layanan / Admin</span>
                  <span className="text-gray-900">{feeAdmin > 0 ? `Rp ${feeAdmin.toLocaleString('id-ID')}` : 'Gratis'}</span>
                </div>

                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between items-end">
                    <span className="font-black text-gray-900 uppercase text-sm">Total Bayar</span>
                    <span className="font-black text-blue-600 text-2xl drop-shadow-[1px_1px_0_#111827]">
                      Rp {totalBayar.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-lg rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <div className="w-6 h-6 border-4 border-gray-900 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Bayar Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
