'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatRupiah } from '@/lib/types'
import { getToken } from '@/lib/authApi'
import {
  clearPendingPaymentRedirect,
  getLatestReceiptSnapshot,
  getReceiptSnapshot,
  mapReceiptSnapshotFromOrder,
  normalizeReceiptImageSrc,
  PaymentReceiptSnapshot,
  ReceiptStatus,
  saveReceiptSnapshot,
} from '@/lib/paymentReceipt'

interface Props {
  orderCode: string
  paymentStatus: string
}

function normalizeStatusLabel(status: ReceiptStatus) {
  switch (status) {
    case 'completed':
      return 'Pembayaran Berhasil'
    case 'failed':
      return 'Pembayaran Gagal'
    case 'processing':
      return 'Sedang Diproses'
    case 'cancelled':
      return 'Pesanan Dibatalkan'
    case 'pending_payment':
      return 'Menunggu Pembayaran'
    default:
      return 'Menunggu Verifikasi'
  }
}

function getStatusClasses(status: ReceiptStatus) {
  switch (status) {
    case 'completed':
      return 'border-green-700 bg-green-100 text-green-700'
    case 'failed':
    case 'cancelled':
      return 'border-red-700 bg-red-100 text-red-700'
    case 'processing':
      return 'border-blue-700 bg-blue-100 text-blue-700'
    case 'pending_payment':
      return 'border-yellow-700 bg-yellow-100 text-yellow-700'
    default:
      return 'border-gray-900 bg-gray-100 text-gray-700'
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function inferStatusFromQuery(status: string): ReceiptStatus {
  if (status === 'success') return 'completed'
  if (status === 'failed') return 'failed'
  return 'pending_payment'
}

export default function PaymentReceiptClient({ orderCode, paymentStatus }: Props) {
  const [receipt, setReceipt] = useState<PaymentReceiptSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clearPendingPaymentRedirect()
    const fallbackStatus = inferStatusFromQuery(paymentStatus)
    const stored = orderCode ? getReceiptSnapshot(orderCode) : getLatestReceiptSnapshot()
    const resolvedOrderCode = orderCode || stored?.orderCode || ''
    const resolvedOrderId = stored?.orderId || resolvedOrderCode

    if (stored) {
      setReceipt({
        ...stored,
        status: stored.status === 'pending_payment' && fallbackStatus === 'completed' ? 'completed' : stored.status,
      })
    }

    const fetchLatestReceipt = async () => {
      const token = getToken()
      if (!token || !resolvedOrderId) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api-proxy/orders/${resolvedOrderId}`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.success) {
          setLoading(false)
          return
        }

        const matchedOrder = data.data?.order ?? data.data
        if (!matchedOrder) {
          setLoading(false)
          return
        }

        const nextReceipt = mapReceiptSnapshotFromOrder(matchedOrder)
        const mergedReceipt = stored
          ? {
              ...stored,
              ...nextReceipt,
              game: {
                ...stored.game,
                ...nextReceipt.game,
                image: nextReceipt.game.image || stored.game.image,
              },
              item: {
                ...stored.item,
                ...nextReceipt.item,
              },
              payment: {
                ...stored.payment,
                ...nextReceipt.payment,
              },
            }
          : nextReceipt

        saveReceiptSnapshot(mergedReceipt)
        setReceipt(mergedReceipt)
      } catch {
        // Keep using the local snapshot when live sync fails.
      } finally {
        setLoading(false)
      }
    }

    void fetchLatestReceipt()
  }, [orderCode, paymentStatus])

  const status = receipt?.status || inferStatusFromQuery(paymentStatus)
  const hasImage = Boolean(receipt?.game.image?.trim())
  const displayedOrderCode = orderCode || receipt?.orderCode || ''

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#ffffff_35%)] px-4 py-6 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 print:max-w-none print:gap-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">GameHub.ID</p>
            <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">Nota Pembayaran</h1>
            <p className="text-sm text-gray-600">
              {displayedOrderCode ? `Kode pesanan ${displayedOrderCode}` : 'Detail pembayaran kamu sudah siap dicetak.'}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => window.print()}
              className="rounded-md border-2 border-gray-900 bg-blue-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-blue-700"
            >
              Cetak Nota
            </button>
            <Link
              href="/orders"
              className="rounded-md border-2 border-gray-900 bg-white px-5 py-3 text-center text-sm font-black text-gray-900 transition-all hover:bg-gray-50"
            >
              Lihat Riwayat
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-white nb-shadow-lg print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b-[3px] border-gray-900 bg-blue-600 px-5 py-5 text-white sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Bukti Pembayaran</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">{displayedOrderCode || 'Pembayaran'}</h2>
                <p className="mt-2 max-w-xl text-sm text-white/80">
                  Simpan atau cetak halaman ini sebagai bukti transaksi setelah pembayaran selesai.
                </p>
              </div>
              <div className={`inline-flex rounded-md border-2 px-4 py-2 text-sm font-black ${getStatusClasses(status)}`}>
                {normalizeStatusLabel(status)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] print:grid-cols-2">
            <div className="space-y-6">
              <section className="rounded-xl border-2 border-gray-900 bg-gray-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-gray-900 bg-white">
                    {hasImage && receipt ? (
                      <Image
                        src={normalizeReceiptImageSrc(receipt.game.image)}
                        alt={receipt.game.name}
                        width={96}
                        height={96}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-black text-gray-300">
                        {receipt?.game.name?.charAt(0) || 'G'}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Game</p>
                    <h3 className="mt-1 text-xl font-black text-gray-900">{receipt?.game.name || 'Pesanan Game'}</h3>
                    <p className="text-sm text-gray-500">{receipt?.game.publisher || 'Top up digital'}</p>
                    <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                      <p>ID: <span className="font-bold text-gray-900">{receipt?.playerId || '-'}</span></p>
                      <p>Server: <span className="font-bold text-gray-900">{receipt?.serverId || '-'}</span></p>
                      <p className="sm:col-span-2">
                        Nickname: <span className="font-bold text-gray-900">{receipt?.nickname || '-'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border-2 border-gray-900 bg-white p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Rincian Pesanan</p>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <span>Produk</span>
                    <span className="text-right font-bold text-gray-900">{receipt?.item.name || '-'}</span>
                  </div>
                  {receipt?.item.bonus && (
                    <div className="flex items-start justify-between gap-3">
                      <span>Bonus</span>
                      <span className="text-right font-bold text-green-600">{receipt.item.bonus}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <span>Tanggal</span>
                    <span className="text-right font-bold text-gray-900">{receipt ? formatDate(receipt.date) : '-'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Status Pesanan</span>
                    <span className="text-right font-bold text-gray-900">{normalizeStatusLabel(status)}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border-2 border-gray-900 bg-white p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Pembayaran</p>
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <span>Metode</span>
                    <span className="text-right font-bold text-gray-900">{receipt?.payment.method || 'Xendit'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Harga</span>
                    <span className="text-right font-bold text-gray-900">
                      {receipt ? formatRupiah(receipt.item.price) : '-'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Biaya Admin</span>
                    <span className="text-right font-bold text-gray-900">
                      {receipt ? formatRupiah(receipt.payment.fee) : '-'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-t-2 border-gray-900 pt-3">
                    <span className="text-base font-black text-gray-900">Total Bayar</span>
                    <span className="text-right text-xl font-black text-blue-600">
                      {receipt ? formatRupiah(receipt.payment.total) : '-'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border-2 border-dashed border-gray-900 bg-yellow-50 p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-700">Catatan</p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <p>Pastikan detail akun dan nominal pada nota ini sesuai dengan pembelian kamu.</p>
                  <p>
                    Jika item belum masuk, buka halaman <span className="font-bold text-gray-900">Riwayat Pesanan</span> untuk
                    cek status terbaru.
                  </p>
                  {receipt?.xenditInvoiceUrl && status !== 'completed' && (
                    <a
                      href={receipt.xenditInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-md border-2 border-gray-900 bg-white px-4 py-2 font-black text-blue-600 hover:bg-gray-50 print:hidden"
                    >
                      Buka Halaman Pembayaran
                    </a>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border-2 border-gray-900 bg-white px-4 py-3 text-sm font-bold text-gray-600 print:hidden">
            Menyinkronkan data pesanan terbaru...
          </div>
        )}

        {!loading && !receipt && (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 print:hidden">
            Data nota belum ditemukan. Jika pembayaran baru saja selesai, cek kembali dari halaman riwayat pesanan.
          </div>
        )}
      </div>
    </div>
  )
}
