'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatRupiah, GameDetail, NominalItem } from '@/lib/api'

interface Props {
  game: GameDetail
}

interface PlayerInfo {
  userId: string
  serverId: string | null
  nickname: string
}

interface VIPService {
  code: string
  name: string
  price: number
  normal_price: number
  basic?: number
  premium?: number
  special?: number
}

// ML Region mapping berdasarkan SKU
const mlRegionMap: Record<string, string> = {
  'ml-singapore': 'MLSG',
  'ml-brazil': 'MLBR',
  'ml-global': 'MLGLOBAL',
  'ml-malaysia': 'MLMY',
  'ml-philippines': 'MLPH',
  'ml-russia': 'MLRU',
  'ml-mena': 'MLMENA',
  'ml-turkey': 'MLTR',
  'ml-usa': 'MLUS',
  'ml-asia': 'MLA',
  'mobile-legends': 'ML', // Default ML
}

export default function TopUpClient({ game }: Props) {
  const [userId, setUserId] = useState('')
  const [serverId, setServerId] = useState('')
  const [selectedNominal, setSelectedNominal] = useState<NominalItem | null>(null)
  
  // VIP Reseller services
  const [services, setServices] = useState<VIPService[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState('')
  
  // Region selection for ML variants
  const [selectedRegion, setSelectedRegion] = useState<string>(mlRegionMap[game.slug] || 'ML')

  // Popup states
  const [showConfirm, setShowConfirm] = useState(false)
  const [checkingPlayer, setCheckingPlayer] = useState(false)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [checkError, setCheckError] = useState('')

  // Payment states
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState('')

  // Digiflazz topup status (ML only)
  const [digiStatus, setDigiStatus] = useState<'idle' | 'processing' | 'success' | 'failed' | 'pending'>('idle')
  const [digiMessage, setDigiMessage] = useState('')

  // Mobile Legends perlu server ID
  const isMobileLegends = game.slug === 'mobile-legends'

  // Region options for ML games
  const regionOptions = [
    { value: 'ML', label: 'Mobile Legends (Default)' },
    { value: 'MLSG', label: '🇸🇬 Singapore' },
    { value: 'MLBR', label: '🇧🇷 Brazil' },
    { value: 'MLGLOBAL', label: '🌍 Global' },
    { value: 'MLMY', label: '🇲🇾 Malaysia' },
    { value: 'MLPH', label: '🇵🇭 Philippines' },
    { value: 'MLRU', label: '🇷🇺 Russia' },
    { value: 'MLMENA', label: '🇸🇦 MENA' },
    { value: 'MLTR', label: '🇹🇷 Turkey' },
    { value: 'MLUS', label: '🇺🇸 USA' },
    { value: 'MLA', label: '🌏 Asia' },
  ]

  // Fetch services from VIP Reseller
  useEffect(() => {
    const fetchServices = async () => {
      setServicesLoading(true)
      setServicesError('')
      try {
        const params = new URLSearchParams()
        params.append('game', encodeURIComponent(game.slug))
        if (selectedRegion) {
          params.append('region', selectedRegion)
        }
        const res = await fetch(`/api/vip-services?${params}`)
        const data = await res.json()
        if (data.success) {
          setServices(data.data)
        } else {
          setServicesError(data.error || 'Gagal memuat layanan')
        }
      } catch {
        setServicesError('Gagal memuat layanan')
      } finally {
        setServicesLoading(false)
      }
    }

    fetchServices()
  }, [game.slug, selectedRegion])

  const total = useMemo(() => (selectedNominal ? selectedNominal.price : 0), [selectedNominal])
  const canCheckout = isMobileLegends
    ? Boolean(userId.trim()) && Boolean(serverId.trim()) && Boolean(selectedNominal)
    : Boolean(userId.trim()) && Boolean(selectedNominal)

  const handleBuyClick = async () => {
    if (!canCheckout) return
    setCheckingPlayer(true)
    setCheckError('')
    setPlayerInfo(null)
    setShowConfirm(true)

    try {
      const res = await fetch('/api/check-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.trim(),
          serverId: serverId.trim() || undefined,
          gameSlug: game.slug,
        }),
      })
      const data = await res.json()
      console.log('[check-player] response:', JSON.stringify(data))

      if (!data.success) {
        const debugInfo = data.debug ? ` | Debug: ${JSON.stringify(data.debug)}` : ''
        console.warn('[check-player] error:', data.error, data.debug ?? '')
        setCheckError((data.error || 'Gagal mengecek data pemain') + debugInfo)
        setCheckingPlayer(false)
        return
      }

      // Direct response from VIP Reseller API
      setPlayerInfo(data.data)
      setCheckingPlayer(false)
    } catch {
      setCheckError('Terjadi kesalahan. Silakan coba lagi.')
      setCheckingPlayer(false)
    }
  }

  const handleConfirmOrder = async () => {
    if (!playerInfo || !selectedNominal) return
    setCreatingPayment(true)
    setPaymentError('')

    try {
      // 1. Cek stock dulu (skip kalau API tidak support)
      let stockAvailable = true
      try {
        const stockRes = await fetch(`/api/vip-stock?service=${selectedNominal.id}`)
        const stockData = await stockRes.json()
        
        // Skip kalau layanan tidak support cek stock
        if (stockData.error?.includes('tidak support') || stockData.error?.includes('not support')) {
          console.log('[stock-check] Skipped - not supported for this service')
        } else if (!stockData.success || !stockData.data?.available) {
          setPaymentError(stockData.error || 'Stok tidak tersedia / habis')
          setCreatingPayment(false)
          return
        }
      } catch {
        // Skip kalau error
        console.log('[stock-check] Skipped due to error')
      }

      // 2. Generate order code dulu untuk matching dengan webhook
      const orderCode = `TRX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

      // 3. Buat Xendit payment dengan external_id = orderCode
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: playerInfo.userId,
          serverId: playerInfo.serverId,
          nickname: playerInfo.nickname,
          gameSlug: game.slug,
          gameName: game.name,
          itemLabel: selectedNominal.label,
          itemPrice: selectedNominal.price,
          externalId: orderCode, // untuk matching webhook
        }),
      })
      const data = await res.json()
      
      if (data.success) {
        setPaymentUrl(data.data.invoiceUrl)

        // 4. Simpan order ke DB dengan order_code yang sama (status pending, VIP order nanti setelah bayar)
        try {
          await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              playerId: playerInfo!.userId,
              serverId: playerInfo!.serverId,
              nickname: playerInfo!.nickname,
              gameSlug: game.slug,
              gameName: game.name,
              gameImage: game.image_url ?? null,
              itemLabel: selectedNominal!.label,
              itemPrice: selectedNominal!.price,
              xenditInvoiceId: data.data.invoiceId,
              xenditInvoiceUrl: data.data.invoiceUrl,
              serviceCode: selectedNominal!.id,
              orderCode, // kirim ke API supaya pakai order_code yang sama
            }),
          })
        } catch { /* silent */ }

        // 4. VIP order akan otomatis diproses setelah pembayaran via webhook Xendit
        setDigiStatus('pending')
        setDigiMessage('Menunggu pembayaran... Setelah bayar, diamond akan otomatis dikirim.')
      } else {
        setPaymentError(data.error || 'Gagal membuat link pembayaran')
      }
    } catch {
      setPaymentError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setCreatingPayment(false)
    }
  }

  const handleCloseConfirm = () => {
    setShowConfirm(false)
    setPlayerInfo(null)
    setCheckError('')
    setPaymentUrl(null)
    setPaymentError('')
    setDigiStatus('idle')
    setDigiMessage('')
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Left Column ── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Step 1 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              1
            </div>
            <h2 className="text-lg font-bold text-gray-900">Masukkan Data Akun</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User ID</label>
              <input
                type="text"
                placeholder={isMobileLegends ? 'Contoh: 123456789' : 'Contoh: 123456789'}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Server ID hanya untuk Mobile Legends */}
            {isMobileLegends && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Server ID</label>
                <input
                  type="text"
                  placeholder="Contoh: 1234"
                  value={serverId}
                  onChange={(e) => setServerId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex items-start gap-2 text-gray-400 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              Pastikan data akun benar. Kesalahan pengisian di luar tanggung jawab kami.
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              2
            </div>
            <h2 className="text-lg font-bold text-gray-900">Pilih Nominal</h2>
          </div>

          {/* Region Selector untuk ML */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Region / Server</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {regionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {servicesLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            </div>
          )}
          
          {servicesError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {servicesError}
            </div>
          )}
          
          {!servicesLoading && !servicesError && (
            <div className="grid grid-cols-3 gap-3">
              {services.map((svc) => (
                <button
                  key={svc.code}
                  onClick={() => setSelectedNominal({
                    id: svc.code,
                    label: svc.name,
                    price: svc.price,
                    bonus: undefined,
                  } as NominalItem)}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    selectedNominal?.id === svc.code
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{svc.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 text-base">{formatRupiah(svc.price)}</p>
                    {svc.normal_price > svc.price && (
                      <p className="text-gray-400 text-sm line-through">{formatRupiah(svc.normal_price)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Column — Ringkasan ── */}
      <div className="lg:col-span-1">
        <div className="sticky top-20 bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Ringkasan</h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Game</span>
              <span className="font-bold text-gray-900">{game.name.split(':')[0].trim()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">User ID</span>
              <span className="font-semibold text-gray-900">
                {userId ? userId : <span className="text-gray-300">-</span>}
              </span>
            </div>
            {isMobileLegends && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Server ID</span>
                <span className="font-semibold text-gray-900">
                  {serverId ? serverId : <span className="text-gray-300">-</span>}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Item</span>
              <span className="font-semibold text-gray-900">
                {selectedNominal ? selectedNominal.label : <span className="text-gray-300">-</span>}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-semibold">Total</span>
              <span className="text-2xl font-black text-gray-900">{total > 0 ? formatRupiah(total) : 'Rp 0'}</span>
            </div>
          </div>

          <button
            onClick={handleBuyClick}
            disabled={!canCheckout}
            className={`w-full font-bold py-3.5 rounded-xl transition-colors text-sm ${
              canCheckout
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 text-white opacity-60 cursor-not-allowed'
            }`}
          >
            Beli Sekarang
          </button>
        </div>
      </div>
    </div>

    {/* ── Confirmation Popup ── */}

    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => !checkingPlayer && !creatingPayment && handleCloseConfirm()}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">Konfirmasi Pesanan</h3>
            {!checkingPlayer && !creatingPayment && (
              <button
                onClick={handleCloseConfirm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Loading: cek player */}
          {checkingPlayer && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
              <p className="text-gray-500 text-sm">Mengecek data akun...</p>
            </div>
          )}

          {/* Loading: buat invoice */}
          {creatingPayment && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
              <p className="text-gray-500 text-sm">Membuat link pembayaran...</p>
            </div>
          )}

          {/* Payment URL ready */}
          {!creatingPayment && paymentUrl && (
            <div>
              <div className="flex flex-col items-center gap-3 p-5 bg-green-50 border border-green-200 rounded-xl mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p className="font-bold text-gray-900 text-center">Invoice berhasil dibuat!</p>
                <p className="text-sm text-gray-500 text-center">Klik tombol di bawah untuk melanjutkan ke halaman pembayaran.</p>
              </div>

              {/* Digiflazz status — hanya ML */}
              {digiStatus !== 'idle' && (
                <div className={`flex items-start gap-3 rounded-xl p-4 mb-4 text-sm ${
                  digiStatus === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                  digiStatus === 'failed'  ? 'bg-red-50 border border-red-200' :
                  digiStatus === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  {digiStatus === 'processing' && (
                    <svg className="animate-spin w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                    </svg>
                  )}
                  {digiStatus === 'success' && (
                    <svg className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                  {digiStatus === 'failed' && (
                    <svg className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  )}
                  {digiStatus === 'pending' && (
                    <svg className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  )}
                  <div>
                    <p className={`font-semibold ${
                      digiStatus === 'success' ? 'text-emerald-700' :
                      digiStatus === 'failed'  ? 'text-red-600' :
                      digiStatus === 'pending' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {digiStatus === 'processing' && 'Mengirim top up diamond...'}
                      {digiStatus === 'success'    && 'Diamond berhasil dikirim!'}
                      {digiStatus === 'failed'     && 'Top up gagal'}
                      {digiStatus === 'pending'    && 'Sedang diproses'}
                    </p>
                    {digiMessage && (
                      <p className="text-xs text-gray-500 mt-0.5">{digiMessage}</p>
                    )}
                  </div>
                </div>
              )}

              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold text-center transition-colors mb-3"
              >
                Bayar Sekarang →
              </a>
              <button
                onClick={handleCloseConfirm}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Payment error */}
          {!creatingPayment && paymentError && (
            <div className="py-2">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <svg width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-red-600 text-sm">{paymentError}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseConfirm}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Tutup
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {/* Error: cek player */}
          {!checkingPlayer && checkError && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <svg width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-red-600 text-sm">{checkError}</p>
              </div>
              <button
                onClick={handleCloseConfirm}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Success state — show player info (hanya jika belum bayar) */}
          {!checkingPlayer && !creatingPayment && !paymentUrl && !paymentError && playerInfo && (
            <>
              {/* Player info card */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">Data Akun Ditemukan</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {playerInfo!.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{playerInfo!.nickname}</p>
                    <p className="text-xs text-gray-500">
                      ID: {playerInfo!.userId}
                      {playerInfo!.serverId && ` · Server: ${playerInfo!.serverId}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="space-y-2 mb-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Game</span>
                  <span className="font-semibold text-gray-900">{game.name.split(':')[0].trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Item</span>
                  <span className="font-semibold text-gray-900">{selectedNominal?.label}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-black text-blue-600">{formatRupiah(total)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mb-4">
                Pastikan nickname di atas adalah akun kamu. Top up tidak bisa dibatalkan.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseConfirm}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
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
