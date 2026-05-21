'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { orderAkunApi } from '@/lib/orderAkunApi'
import { useToast } from '@/lib/contexts/ToastContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function AccountPaymentSuccessContent() {
  const searchParams = useSearchParams()
  const id = searchParams?.get('id')
  const xenditId = searchParams?.get('xendit_id')
  const externalId = searchParams?.get('external_id')
  const { toast } = useToast()
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ambil order ID dari localStorage (disimpan saat checkout)
    const savedOrderId = localStorage.getItem('last_akun_order_id')
    const savedTime = localStorage.getItem('last_akun_order_time')
    const isValidSaved = savedOrderId && savedTime && (Date.now() - Number(savedTime) < 60 * 60 * 1000) // within 1 hour

    // Tentukan order ID yang akan digunakan
    const isRealUrlId = id && id.length < 10 && !isNaN(Number(id))
    const targetOrderId = isRealUrlId ? id : (isValidSaved ? savedOrderId : null)

    if (!targetOrderId && !id && !xenditId) return

    let pollCount = 0
    let pollTimer: NodeJS.Timeout | null = null
    let cancelled = false

    // Panggil backend GET /api/payment/success untuk sync status pembayaran dari Xendit
    const verifyPayment = async () => {
      try {
        // Bangun external_id sesuai format backend: AKN-{timestamp}-{random}
        // Tapi kita mungkin tidak tahu exact external_id, jadi coba ambil dari order dulu
        let extId = ''
        
        // Coba ambil xendit_external_id dari order detail terlebih dahulu
        if (targetOrderId) {
          try {
            const orderData = await orderAkunApi.getOrderDetail(Number(targetOrderId))
            extId = (orderData as any)?.xendit_external_id || `AKN-${targetOrderId}`
          } catch {
            extId = `AKN-${targetOrderId}`
          }
        }
        
        const params = new URLSearchParams()
        if (extId) params.set('external_id', extId)
        if (id && id.length >= 10) params.set('id', id)
        if (xenditId) params.set('id', xenditId)
        
        // Panggil backend untuk sync status pembayaran dari Xendit
        await fetch(`/api-proxy/akun-orders/verify-payment`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ external_id: extId, xendit_id: xenditId || id }),
        }).catch(() => {})
      } catch (e) {
        console.log('[PaymentSuccess] Verify payment call failed (non-critical):', e)
      }
    }

    const fetchOrder = async (): Promise<any> => {
      // Prioritas 1: gunakan targetOrderId (dari localStorage atau URL)
      if (targetOrderId) {
        try {
          const data = await orderAkunApi.getOrderDetail(Number(targetOrderId))
          if (data) return data
        } catch {}
      }

      // Prioritas 2: cari dari list orders
      try {
        const buyerData = await orderAkunApi.getMyOrders() as any
        const buyerOrders = Array.isArray(buyerData) ? buyerData : (buyerData.orders || [])
        
        if (buyerOrders.length === 0) return null

        // Cari berdasarkan savedOrderId
        if (targetOrderId) {
          const byId = buyerOrders.find((o: any) => o.id?.toString() === targetOrderId.toString())
          if (byId) return byId
        }

        // Fallback: order waiting_payment/paid terbaru
        const pendingOrders = buyerOrders
          .filter((o: any) => {
            const st = o.status?.toLowerCase()
            return st === 'waiting_payment' || st === 'pending' || st === 'paid'
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.created_at || 0).getTime()
            const dateB = new Date(b.createdAt || b.created_at || 0).getTime()
            return dateB - dateA
          })
        if (pendingOrders.length > 0) return pendingOrders[0]
      } catch (e) {
        console.error('Fetch orders error:', e)
      }

      return null
    }

    const pollForStatus = async () => {
      if (cancelled) return

      const data = await fetchOrder()
      if (cancelled) return

      if (!data) {
        pollCount++
        if (pollCount >= 6) {
          setLoading(false)
          toast('Pesanan tidak ditemukan. Cek di halaman Riwayat Pesanan.', 'error')
          return
        }
        pollTimer = setTimeout(pollForStatus, 3000)
        return
      }

      // Tampilkan nota segera saat order ditemukan
      setOrder(data)
      setLoading(false)
      localStorage.removeItem('last_akun_order_id')
      localStorage.removeItem('last_akun_order_time')

      const status = data.status?.toLowerCase()
      // Jika masih waiting_payment, poll di background untuk update status
      if (status === 'waiting_payment' || status === 'pending') {
        pollCount++
        if (pollCount < 10) {
          pollTimer = setTimeout(async () => {
            if (cancelled) return
            const updated = await fetchOrder()
            if (updated && !cancelled) setOrder(updated)
            const updatedStatus = updated?.status?.toLowerCase()
            if (!cancelled && (updatedStatus === 'waiting_payment' || updatedStatus === 'pending') && pollCount < 10) {
              pollTimer = setTimeout(pollForStatus, 4000)
            }
          }, 4000)
        }
      }
    }

    setLoading(true)
    
    // Pertama: panggil verifyPayment untuk sync status dari Xendit ke backend
    // Kemudian mulai polling untuk mendapatkan data order terbaru
    const start = async () => {
      await verifyPayment()
      if (!cancelled) {
        pollTimer = setTimeout(pollForStatus, 1500)
      }
    }
    start()

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [id, xenditId, externalId, toast])

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'waiting_payment':
        return 'Menunggu Pembayaran'
      case 'paid':
        return 'Dibayar (Escrow)'
      case 'delivered':
        return 'Data Dikirim'
      case 'confirmed':
        return 'Dikonfirmasi'
      case 'completed':
        return 'Selesai'
      case 'disputed':
        return 'Dispute'
      case 'refunded':
        return 'Dana Dikembalikan'
      case 'cancelled':
        return 'Dibatalkan'
      default:
        return status
    }
  }

  const getStatusClasses = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'waiting_payment':
        return 'border-yellow-700 bg-yellow-100 text-yellow-700'
      case 'paid':
        return 'border-blue-700 bg-blue-100 text-blue-700'
      case 'delivered':
        return 'border-purple-700 bg-purple-100 text-purple-700'
      case 'confirmed':
        return 'border-teal-700 bg-teal-100 text-teal-700'
      case 'completed':
        return 'border-green-700 bg-green-100 text-green-700'
      case 'disputed':
        return 'border-red-700 bg-red-100 text-red-700'
      case 'refunded':
        return 'border-orange-700 bg-orange-100 text-orange-700'
      case 'cancelled':
        return 'border-gray-600 bg-gray-100 text-gray-600'
      default:
        return 'border-gray-900 bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
        <p className="font-black text-gray-900 uppercase tracking-wider text-sm">Memverifikasi pembayaran...</p>
        <p className="text-xs font-bold text-gray-500">Mohon tunggu, sedang mengecek status dari Xendit</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-8 text-center max-w-md shadow-[6px_6px_0_#111827]">
          <h3 className="text-xl font-black text-gray-900 mb-2">Nota Tidak Ditemukan</h3>
          <p className="text-gray-500 font-bold mb-6">Detail pesanan tidak dapat dimuat atau ID tidak valid.</p>
          <Link href="/my-orders" className="inline-flex px-6 py-3 bg-blue-600 text-white font-black uppercase text-sm rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_#111827] hover:shadow-[2px_2px_0_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all">
            Ke Riwayat Pesanan
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#ffffff_35%)] px-4 py-6 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 print:max-w-none print:gap-0">
        
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">GameHub.ID</p>
            <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">Nota Pembayaran Akun</h1>
            <p className="text-sm text-gray-600">Kode pesanan #ORD-{order.id}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => window.print()} className="rounded-md border-2 border-gray-900 bg-blue-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-blue-700">
              Cetak Nota
            </button>
            <Link href="/my-orders" className="rounded-md border-2 border-gray-900 bg-white px-5 py-3 text-center text-sm font-black text-gray-900 transition-all hover:bg-gray-50">
              Lihat Riwayat
            </Link>
          </div>
        </div>

        {/* Card Nota */}
        <div className="overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-white nb-shadow-lg print:rounded-none print:border-0 print:shadow-none">
          
          {/* Top Banner */}
          <div className="border-b-[3px] border-gray-900 bg-blue-600 px-5 py-5 text-white sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Bukti Pembayaran</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">#ORD-{order.id}</h2>
                <p className="mt-2 max-w-xl text-sm text-white/80">
                  Simpan atau cetak halaman ini sebagai bukti transaksi setelah pembayaran selesai.
                </p>
              </div>
              <div className={`inline-flex rounded-md border-2 px-4 py-2 text-sm font-black ${getStatusClasses(order.status)}`}>
                {getStatusLabel(order.status)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] print:grid-cols-2">
            
            {/* Left Column */}
            <div className="space-y-6">
              
              {/* Product Info */}
              <section className="rounded-xl border-2 border-gray-900 bg-gray-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-gray-900 bg-white">
                    {order.listing?.accountGame?.gambar_game ? (
                      <img
                        src={resolveImageUrl(order.listing.accountGame.gambar_game)}
                        alt={order.listing?.nama_post}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-black text-gray-300">G</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Game & Akun</p>
                    <h3 className="mt-1 text-xl font-black text-gray-900">{order.listing?.nama_post || 'Akun Game'}</h3>
                    <p className="text-sm text-gray-500">Game: {order.listing?.accountGame?.nama_game || '-'}</p>
                    <div className="mt-3 text-sm text-gray-700">
                      <p>Penjual: <span className="font-bold text-gray-900">{order.listing?.reseller?.store_name || 'Toko'}</span></p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Order Details */}
              <section className="rounded-xl border-2 border-gray-900 bg-white p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Rincian Pesanan</p>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <span>Produk</span>
                    <span className="text-right font-bold text-gray-900">Pembelian Akun</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Tanggal</span>
                    <span className="text-right font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Status Pesanan</span>
                    <span className="text-right font-bold text-gray-900">{getStatusLabel(order.status)}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Payment Details */}
              <section className="rounded-xl border-2 border-gray-900 bg-white p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Pembayaran</p>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <span>Metode</span>
                    <span className="text-right font-bold text-gray-900">Xendit</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Harga</span>
                    <span className="text-right font-bold text-gray-900">
                      {formatRupiah(Number(order.harga || 0))}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Biaya Admin</span>
                    <span className="text-right font-bold text-gray-900">
                      {formatRupiah(Number(order.fee_admin || 0))}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-t-2 border-gray-900 pt-3">
                    <span className="text-base font-black text-gray-900">Total Bayar</span>
                    <span className="text-right text-xl font-black text-blue-600">
                      {formatRupiah(Number(order.total_bayar || order.harga || 0))}
                    </span>
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section className="rounded-xl border-2 border-dashed border-gray-900 bg-yellow-50 p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-700">Catatan</p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p>Pastikan detail akun dan nominal pada nota ini sesuai dengan pembelian kamu.</p>
                  <p>
                    Jika status masih **Menunggu Pembayaran** padahal Anda sudah bayar, mohon tunggu beberapa menit agar sistem Xendit memperbarui status ke server kami.
                  </p>
                  <p>
                    Jika item belum masuk, buka halaman <Link href="/my-orders" className="font-bold text-gray-900 underline">Riwayat Pesanan</Link> untuk cek status terbaru.
                  </p>
                  {order.payment_url && ['pending', 'waiting_payment'].includes(order.status?.toLowerCase()) && (
                    <a
                      href={order.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-md border-2 border-gray-900 bg-white px-4 py-2 font-black text-blue-600 hover:bg-gray-50 print:hidden mt-2"
                    >
                      Buka Halaman Pembayaran
                    </a>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountPaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <AccountPaymentSuccessContent />
    </Suspense>
  )
}
