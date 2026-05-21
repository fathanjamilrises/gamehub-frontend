'use client'

import { useState, useMemo } from 'react'
import { formatRupiah } from '@/lib/types'
import { authFetch } from '@/lib/authApi'
import { useAuth } from '@/lib/hooks/useAuth'
import { saveReceiptSnapshot, mapReceiptSnapshotFromOrder } from '@/lib/paymentReceipt'
import Link from 'next/link'
import { useToast } from '@/lib/contexts/ToastContext'
import { useCart } from '@/lib/contexts/CartContext'

interface VoucherProduct {
  id: string
  name: string
  price: number
  kode: string
}

interface Voucher {
  id: string
  name: string
  slug: string
  image: string
  deskripsi: string
  produks: VoucherProduct[]
}

interface Props {
  voucher: Voucher
}

export default function VoucherClient({ voucher }: Props) {
  const { success: showSuccess, error: showError, toast } = useToast()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [addingToCart, setAddingToCart] = useState(false)
  const [waNumber, setWaNumber] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<VoucherProduct | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const handleAddToCart = async () => {
    if (!canCheckout || !selectedProduct) return
    
    let idListing = parseInt(selectedProduct.kode || '')
    if (isNaN(idListing)) {
      idListing = parseInt(selectedProduct.id.split('-')[0])
    }
    
    if (isNaN(idListing)) {
      toast('Item tidak valid untuk dimasukkan ke keranjang', 'error')
      return
    }

    setAddingToCart(true)
    try {
      const catatan = waNumber ? `WhatsApp: ${waNumber}` : ''
      await addToCart({
        item_type: 'topup',
        id_produk: idListing,
        topup_target_id: waNumber || 'unknown',
        quantity: 1,
        catatan: catatan
      })
    } catch (err) {
      // Error handled by CartContext
    } finally {
      setAddingToCart(false)
    }
  }

  const [showConfirm, setShowConfirm] = useState(false)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [checkError, setCheckError] = useState('')

  const canCheckout = useMemo(() => {
    if (!selectedProduct) return false
    if (!waNumber || waNumber.length < 9) return false
    return true
  }, [selectedProduct, waNumber])

  const total = selectedProduct?.price || 0

  const handleBuyClick = () => {
    if (!canCheckout) return
    setCheckError('')
    setShowConfirm(true)
  }

  const handleConfirmOrder = async () => {
    if (!selectedProduct || !waNumber) return
    setCreatingPayment(true)
    setCheckError('')

    if (!isAuthenticated) {
      const msg = 'Silakan login terlebih dahulu untuk membuat pesanan'
      setCheckError(msg)
      showError(msg)
      setCreatingPayment(false)
      return
    }

    const frontendUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const redirectUrl = `${frontendUrl}/payment/success`

    try {
      const res = await authFetch('/api-proxy/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: voucher.slug,
          id_produk: selectedProduct.kode || selectedProduct.id,
          id_player: waNumber, // Using waNumber as id_player for vouchers
          server: '',
          access_token: undefined,
          success_redirect_url: redirectUrl,
          failure_redirect_url: redirectUrl,
          success_url: redirectUrl,
          failure_url: redirectUrl
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const order = data.data?.order ?? {}
        const resolvedOrderCode = order.invoice_number || order.id || 'ORD-SUCCESS'
        
        const paymentUrl = data.data?.xendit?.invoice_url || data.data?.order?.xendit_invoice_url
        
        if (paymentUrl) {
          showSuccess('Pesanan dibuat! Mengalihkan ke pembayaran...')
          window.location.href = paymentUrl
          return
        }

        setOrderCode(resolvedOrderCode)
        setOrderCreated(true)

        // Simpan snapshot untuk halaman nota
        try {
          const snapshot = mapReceiptSnapshotFromOrder({
            ...order,
            nama_games: voucher.name,
            nama_produk: selectedProduct.name,
            harga_produk: selectedProduct.price,
            id_player: waNumber,
            id_server: '',
            nickname: 'Voucher Buyer',
            image_url: voucher.image,
            status: order.status || 'pending_payment'
          })
          saveReceiptSnapshot(snapshot)
        } catch (snapErr) {
          console.error('Failed to save receipt snapshot:', snapErr)
        }
      } else {
        const msg = data.message || 'Gagal membuat pesanan'
        setCheckError(msg)
        showError(msg)
      }
    } catch (err) {
      console.error('Create order error:', err)
      setCheckError('Gagal menghubungi server untuk membuat pesanan')
    } finally {
      setCreatingPayment(false)
    }
  }

  const handleCloseConfirm = () => {
    setShowConfirm(false)
    setCheckError('')
    setOrderCreated(false)
    setOrderCode(null)
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Left Column ── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Step 1 */}
        <div className="bg-white border-[3px] border-gray-900 rounded-xl p-6 shadow-[6px_6px_0px_#111827] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-300 rounded-bl-full -mr-10 -mt-10 border-b-[3px] border-l-[3px] border-gray-900 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-10 h-10 rounded bg-[#ff90e8] border-[3px] border-gray-900 text-gray-900 text-lg font-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111827] -rotate-3">
              1
            </div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Data Pembeli</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-black uppercase tracking-wider text-gray-900 mb-2">Nomor WhatsApp</label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={waNumber}
                maxLength={15}
                onChange={(e) => setWaNumber(e.target.value.replace(/\D/g, ''))}
                className={
                  "w-full border-[3px] rounded-lg px-4 py-3.5 text-base font-bold bg-gray-50 focus:bg-white focus:outline-none transition-all border-gray-900 focus:shadow-[4px_4px_0px_#2563eb]"
                }
              />
            </div>

            <div className="flex items-start gap-2 text-gray-600 font-medium text-xs bg-gray-50 border-2 border-dashed border-gray-400 p-3 rounded-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01"/>
              </svg>
              Pastikan nomor WhatsApp aktif untuk menerima detail voucher jika diperlukan.
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white border-[3px] border-gray-900 rounded-xl p-6 shadow-[6px_6px_0px_#111827] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-300 rounded-bl-full -mr-12 -mt-12 border-b-[3px] border-l-[3px] border-gray-900 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-10 h-10 rounded bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-lg font-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111827] rotate-3">
              2
            </div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Pilih Produk</h2>
          </div>

          <div className="relative z-10">
            {voucher.produks && voucher.produks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {voucher.produks.map((produk) => (
                  <button
                    key={produk.id}
                    onClick={() => setSelectedProduct(produk)}
                    className={
                      "border-[3px] rounded-xl p-4 text-left transition-all duration-200 relative " +
                      (selectedProduct?.id === produk.id
                        ? 'border-blue-600 bg-blue-50 shadow-[4px_4px_0px_#2563eb] -translate-y-1'
                        : 'border-gray-900 bg-white hover:bg-gray-50 hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1')
                    }
                  >
                    <p className="text-sm font-black text-gray-900 leading-tight">
                      {produk.name}
                    </p>
                    <p className="font-black text-blue-600 text-[15px] mt-1 drop-shadow-[1px_1px_0_#fff]">
                      {formatRupiah(produk.price)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border-[3px] border-gray-900 border-dashed rounded-xl bg-gray-50 shadow-[inset_4px_4px_0px_#e2e8f0]">
                <svg className="w-14 h-14 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-4 4m-8-4l-4 4" />
                </svg>
                <p className="text-gray-900 font-black text-lg uppercase">Belum Ada Produk</p>
                <p className="text-sm font-bold text-gray-500 mt-1">Produk voucher ini sedang kosong.</p>
                <button 
                  onClick={() => setShowDebug(!showDebug)}
                  className="mt-4 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest"
                >
                  {showDebug ? 'Sembunyikan Debug' : 'Tampilkan Debug Data'}
                </button>
              </div>
            )}
            
            {showDebug && (
              <div className="mt-4 p-4 bg-gray-900 rounded-lg overflow-auto max-h-60 text-[10px] font-mono text-green-400 border-2 border-gray-900 shadow-[4px_4px_0px_#111827]">
                <pre>{JSON.stringify(voucher, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Column — Ringkasan ── */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-[#f8fafc] border-[3px] border-gray-900 rounded-xl p-6 shadow-[6px_6px_0px_#111827] relative">
          <div className="absolute top-0 right-0 w-8 h-8 bg-pink-400 rounded-bl-xl border-b-[3px] border-l-[3px] border-gray-900" />
          <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wider border-b-[3px] border-gray-900 pb-3">Ringkasan</h3>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase">Voucher</span>
              <span className="font-black text-gray-900 text-right">{voucher.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase">WhatsApp</span>
              <span className="font-black text-gray-900 text-right">
                {waNumber ? waNumber : <span className="text-gray-300">-</span>}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase">Produk</span>
              <span className="font-black text-gray-900 text-right">
                {selectedProduct ? selectedProduct.name : <span className="text-gray-300">-</span>}
              </span>
            </div>
          </div>

          <div className="border-t-[3px] border-gray-900 pt-5 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-black uppercase text-lg">Total</span>
              <span className="text-3xl font-black text-blue-600 drop-shadow-[1px_1px_0_#111827]">{total > 0 ? formatRupiah(total) : 'Rp 0'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleBuyClick}
              disabled={!canCheckout}
              className={
                "w-full font-black py-4 rounded-xl border-[3px] border-gray-900 transition-all text-lg uppercase tracking-wider " +
                (canCheckout
                  ? 'bg-[#ffc900] hover:bg-yellow-400 text-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px]'
                  : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed')
              }
            >
              Beli Sekarang
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!canCheckout || addingToCart}
              className={
                "w-full font-black py-4 rounded-xl border-[3px] border-gray-900 transition-all text-lg uppercase tracking-wider flex items-center justify-center gap-2 " +
                (canCheckout && !addingToCart
                  ? 'bg-white hover:bg-gray-50 text-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px]'
                  : 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed')
              }
            >
              {addingToCart ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
              Tambah Keranjang
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ── Confirmation Popup ── */}
    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => !creatingPayment && handleCloseConfirm()}
        />
        <div className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#111827] w-full max-w-sm p-6 overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-yellow-400 to-cyan-400 border-b-[3px] border-gray-900" />
          <div className="flex items-center justify-between mb-6 mt-2">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Konfirmasi</h3>
            {!creatingPayment && (
              <button
                onClick={handleCloseConfirm}
                className="text-gray-900 hover:text-red-600 transition-colors"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Loading: create order */}
          {creatingPayment && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 border-4 border-gray-900 border-t-green-500 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
              <p className="text-gray-900 font-bold uppercase tracking-wider">Membuat pesanan...</p>
            </div>
          )}

          {/* Order created success */}
          {!creatingPayment && orderCreated && orderCode && (
            <div className="animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center gap-3 p-6 bg-green-50 border-[3px] border-green-500 rounded-xl mb-6 shadow-[4px_4px_0px_#16a34a]">
                <div className="w-14 h-14 bg-white border-[3px] border-green-500 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#16a34a]">
                  <svg width="28" height="28" fill="none" stroke="#16a34a" strokeWidth="4" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p className="font-black text-gray-900 text-center uppercase tracking-wider mt-2">Berhasil Dibuat!</p>
                <p className="text-sm font-bold text-gray-600 text-center bg-white px-3 py-1 rounded-md border-2 border-gray-900 shadow-[2px_2px_0_#111827]">{orderCode}</p>
              </div>

              <Link
                href={`/payment/success?orderCode=${orderCode}`}
                className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl border-[3px] border-gray-900 text-lg font-black text-center transition-all mb-3 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] uppercase tracking-wider"
              >
                Lihat Nota
              </Link>
            </div>
          )}

          {/* Error: check */}
          {!creatingPayment && !orderCreated && checkError && (
            <div className="py-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-4 p-5 bg-red-50 border-[3px] border-red-500 rounded-xl mb-6 shadow-[4px_4px_0px_#ef4444]">
                <div className="w-10 h-10 shrink-0 bg-white border-[3px] border-red-500 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#ef4444]">
                  <svg width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <p className="text-red-600 text-sm font-black uppercase tracking-wide leading-tight">{checkError}</p>
              </div>
              <button
                onClick={handleCloseConfirm}
                className="w-full py-3.5 border-[3px] border-gray-900 rounded-xl text-base font-black text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase"
              >
                Kembali
              </button>
            </div>
          )}

          {/* Show confirmation details - ready to confirm */}
          {!creatingPayment && !orderCreated && !checkError && (
            <>
              <div className="bg-gray-50 border-[3px] border-gray-900 rounded-xl p-5 mb-6 shadow-[inset_4px_4px_0px_#e2e8f0]">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 border-b-[3px] border-gray-900 pb-2 inline-block">Detail Pesanan</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Voucher</p>
                    <p className="font-black text-gray-900 text-sm bg-white border-2 border-gray-900 p-2 rounded shadow-[2px_2px_0_#111827] truncate">
                      {voucher.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">WhatsApp</p>
                    <p className="font-black text-gray-900 text-sm bg-white border-2 border-gray-900 p-2 rounded shadow-[2px_2px_0_#111827] truncate">
                      {waNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Produk</p>
                    <p className="font-black text-blue-600 text-sm bg-blue-50 border-2 border-blue-600 p-2 rounded shadow-[2px_2px_0_#2563eb] truncate">
                      {selectedProduct?.name} ({formatRupiah(total)})
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseConfirm}
                  disabled={creatingPayment}
                  className="w-full py-3.5 border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase tracking-wider"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={creatingPayment}
                  className="w-full py-3.5 border-[3px] border-gray-900 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase tracking-wider"
                >
                  Lanjut Bayar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  )
}
