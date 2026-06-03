'use client'

import { useMemo, useState, useEffect } from 'react'
import { formatRupiah, GameDetail, NominalItem } from '@/lib/types'
import { authFetch } from '@/lib/authApi'
import { useAuth } from '@/lib/hooks/useAuth'
import { savePendingPaymentRedirect, saveReceiptSnapshot, mapReceiptSnapshotFromOrder } from '@/lib/paymentReceipt'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/lib/contexts/ToastContext'
import { useCart } from '@/lib/contexts/CartContext'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  game: GameDetail
}

interface PlayerInfo {
  userId: string
  serverId: string | null
  nickname: string
  region?: string
}

interface RawProductItem {
  id?: string | number
  nama_produk?: string
  harga_produk?: string | number
  harga_normal_produk?: string | number
  label_produk?: string
  gambar_produk?: string
  kode_produk?: string
}

interface RawProductGroup {
  label?: string
  produks?: RawProductItem[]
}

const PRODUCT_IMAGE_BASE = process.env.NEXT_PUBLIC_API_URL

function normalizeProductLabel(label: unknown): string {
  return typeof label === 'string' ? label.trim().toLowerCase() : ''
}

function getProductBonus(label: unknown): string | undefined {
  if (typeof label !== 'string') return undefined

  const normalizedLabel = normalizeProductLabel(label)
  if (
    !normalizedLabel ||
    normalizedLabel === 'diamond' ||
    normalizedLabel === 'wdp' ||
    normalizedLabel.includes('weekly diamond pass')
  ) {
    return undefined
  }

  return label.trim()
}

function resolveProductImage(image: unknown): string | undefined {
  if (typeof image !== 'string') return undefined

  const trimmedImage = image.trim()
  if (!trimmedImage) return undefined

  if (
    /^https?:\/\//i.test(trimmedImage) ||
    trimmedImage.startsWith('data:') ||
    trimmedImage.startsWith('blob:')
  ) {
    return trimmedImage
  }

  if (trimmedImage.startsWith('//')) {
    return 'https:' + trimmedImage
  }

  const normalizedPath = trimmedImage.startsWith('/') ? trimmedImage : '/' + trimmedImage
  return PRODUCT_IMAGE_BASE + normalizedPath
}

function getProductBadgeText(label: string): string {
  const compactLabel = label.trim()
  const wordMatch = compactLabel.match(/[A-Za-z0-9]+/g) ?? []

  if (wordMatch.length >= 2) {
    return (wordMatch[0]?.charAt(0) ?? '') + (wordMatch[1]?.charAt(0) ?? '').toUpperCase()
  }

  return compactLabel.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'TOP'
}

function parseProductNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const digitsOnly = value.replace(/[^\d]/g, '')
  return digitsOnly ? parseInt(digitsOnly, 10) : 0
}

function mapProductGroup(group: RawProductGroup) {
  return {
    label: group.label || 'Kategori',
    produks: (group.produks || []).map((raw, idx): NominalItem => {
      const parsedPrice = parseProductNumber(raw.harga_produk)
      const parsedNormalPrice = parseProductNumber(raw.harga_normal_produk)

      return {
        id: String(raw.id || raw.kode_produk || `item-${idx}`) + `-${idx}`,
        label: raw.nama_produk || 'Item',
        amount: parsedPrice,
        price: parsedPrice,
        originalPrice: parsedNormalPrice > 0 ? parsedNormalPrice : undefined,
        bonus: getProductBonus(raw.label_produk),
        image: resolveProductImage(raw.gambar_produk),
        code: raw.kode_produk,
      }
    }),
  }
}

function normalizeToGroups(data: any): { label: string; produks: NominalItem[] }[] {
  if (!Array.isArray(data)) return []
  
  // Jika item pertama sudah punya properti 'produks', berarti sudah dikelompokkan oleh backend
  if (data.length > 0 && Array.isArray(data[0].produks)) {
    return data.map(mapProductGroup)
  }
  
  // Jika flat array, kelompokkan berdasarkan label_produk (kategori)
  const groupsMap: Record<string, RawProductItem[]> = {}
  data.forEach((p: any) => {
    const label = p.label_produk || 'Umum'
    if (!groupsMap[label]) groupsMap[label] = []
    groupsMap[label].push(p)
  })
  
  return Object.entries(groupsMap).map(([label, produks]) => 
    mapProductGroup({ label, produks })
  )
}

function extractProducts(data: any): any[] {
  const payload = data?.data ?? data
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.produks)) return payload.produks
  if (payload && Array.isArray(payload.data)) return payload.data
  return []
}

export default function TopUpClient({ game }: Props) {
  const { success: showSuccess, error: showError, toast } = useToast()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [addingToCart, setAddingToCart] = useState(false)
  const [userId, setUserId] = useState('')
  const [serverId, setServerId] = useState('')
  const [selectedNominal, setSelectedNominal] = useState<NominalItem | null>(null)

  const handleAddToCart = async () => {
    if (!canCheckout || !selectedNominal) return
    
    let idListing = parseInt(selectedNominal.code || '')
    if (isNaN(idListing)) {
      idListing = parseInt(selectedNominal.id.split('-')[0])
    }
    
    if (isNaN(idListing)) {
      toast('Item tidak valid untuk dimasukkan ke keranjang', 'error')
      return
    }

    setAddingToCart(true)
    try {
      const catatan = userId ? `UserID: ${userId}${serverId ? `, Server: ${serverId}` : ''}` : ''
      await addToCart({
        item_type: 'topup',
        id_produk: idListing,
        topup_target_id: userId || 'unknown',
        topup_target_server: serverId || '',
        quantity: 1,
        catatan: catatan
      })
    } catch (err) {
      // Error handled by CartContext
    } finally {
      setAddingToCart(false)
    }
  }

  const [dynamicNominals, setDynamicNominals] = useState<{ label: string; produks: NominalItem[] }[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({})

  const [isAutoChecking, setIsAutoChecking] = useState(false)
  const [autoNickname, setAutoNickname] = useState('')
  const [autoRegion, setAutoRegion] = useState('')

  const [showConfirm, setShowConfirm] = useState(false)
  const [checkingPlayer, setCheckingPlayer] = useState(false)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [checkError, setCheckError] = useState('')

  const [creatingPayment, setCreatingPayment] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [orderCode, setOrderCode] = useState<string | null>(null)

  // Konfigurasi per game (terpusat)
  const gameConfig = useMemo(() => {
    const configs: Record<string, { needsServerId: boolean; maxLength: number; placeholder: string; minLength: number }> = {
      'mobile-legends': { needsServerId: true, maxLength: 12, placeholder: 'Contoh: 123456789', minLength: 5 },
      'genshin-impact': { needsServerId: true, maxLength: 10, placeholder: 'Contoh: 812345678', minLength: 9 },
      'free-fire': { needsServerId: false, maxLength: 12, placeholder: 'Contoh: 123456789', minLength: 5 },
      'pubg-mobile': { needsServerId: false, maxLength: 15, placeholder: 'Contoh: 51234567890', minLength: 11 },
      'pubg': { needsServerId: false, maxLength: 15, placeholder: 'Contoh: 51234567890', minLength: 11 },
      'honkai-star-rail': { needsServerId: true, maxLength: 10, placeholder: 'Contoh: 812345678', minLength: 9 },
      'valorant': { needsServerId: false, maxLength: 20, placeholder: 'Contoh: Riot ID', minLength: 3 },
    }
    return configs[game.slug] || { needsServerId: false, maxLength: 15, placeholder: 'Contoh: 123456789', minLength: 3 }
  }, [game.slug])

  const needsServerId = gameConfig.needsServerId
  // Semua game mendukung nickname check — jika endpoint tidak ada, akan di-handle gracefully
  const supportsNicknameCheck = true

  useEffect(() => {
    let isMounted = true
    const fetchGlobalProducts = async () => {
      setIsLoadingProducts(true)
      try {
        const res = await fetch(`/api-proxy/games/${game.slug}?region=global`, { credentials: 'include' })
        const data = await res.json().catch(() => ({ success: false }))

        if (isMounted) {
          if (res.ok && data.success) {
            const products = extractProducts(data)
            const grouped = normalizeToGroups(products)
            setDynamicNominals(grouped)
          } else {
            setDynamicNominals([])
          }
        }
      } catch (err) {
        console.error('Initial product fetch error:', err)
        if (isMounted) setDynamicNominals([])
      } finally {
        if (isMounted) setIsLoadingProducts(false)
      }
    }

    fetchGlobalProducts()
    return () => { isMounted = false }
  }, [game.slug])

  useEffect(() => {
    if (!userId || (needsServerId && !serverId)) {
      setAutoNickname('')
      setAutoRegion('')
      setCheckError('')
      return
    }

    // Cek apakah user ID memenuhi panjang minimum
    if (userId.length < gameConfig.minLength) {
      setAutoNickname('')
      setAutoRegion('')
      return
    }

    const timer = setTimeout(async () => {
      setIsAutoChecking(true)
      setCheckError('')
      try {
        const res = await fetch(`/api-proxy/games/${game.slug}/check-nickname?id=` + userId.trim() + (serverId ? '&server=' + serverId.trim() : ''), { credentials: 'include' })
        
        // Jika endpoint tidak tersedia (404/405), skip check tanpa error
        if (res.status === 404 || res.status === 405) {
          console.log(`[TopUp] Nickname check not available for ${game.slug}, skipping...`)
          setAutoNickname('')
          setAutoRegion('')
          setCheckError('')
          setIsAutoChecking(false)
          return
        }

        const data = await res.json()

        if (data.success && data.data?.nickname) {
          setAutoNickname(data.data.nickname)
          const region = data.data.region || 'global'
          setAutoRegion(region)

          setIsLoadingProducts(true)
          setSelectedNominal(null)
          try {
            let productRes = await fetch(`/api-proxy/games/${game.slug}?region=` + region, { credentials: 'include' })
            let productData = await productRes.json().catch(() => ({ success: false }))
            
            if (!productRes.ok || !productData.success || !extractProducts(productData).length) {
              productRes = await fetch(`/api-proxy/games/${game.slug}?region=global`, { credentials: 'include' })
              productData = await productRes.json().catch(() => ({ success: false }))
            }

            if (productRes.ok && productData.success) {
              const products = extractProducts(productData)
              const grouped = normalizeToGroups(products)
              setImageLoadErrors({})
              setDynamicNominals(grouped)
              setCheckError('')
            } else {
              setImageLoadErrors({})
              setDynamicNominals([])
              setCheckError('Produk sedang tidak tersedia. Silakan hubungi admin.')
            }
          } catch (pErr) {
            setImageLoadErrors({})
            setDynamicNominals([])
          } finally {
            setIsLoadingProducts(false)
          }
        } else {
          setAutoNickname('')
          setAutoRegion('')
          if (data.message) {
            setCheckError(data.message)
          }
        }
      } catch (err) {
        // Network error — jangan tampilkan error, mungkin endpoint belum tersedia
        console.log(`[TopUp] Nickname check failed for ${game.slug}:`, err)
        setAutoNickname('')
      } finally {
        setIsAutoChecking(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [userId, serverId, game.slug, needsServerId, gameConfig.minLength])

  const canCheckout = useMemo(() => {
    if (!selectedNominal) return false
    if (!userId) return false
    if (needsServerId && !serverId) return false
    return true
  }, [selectedNominal, userId, serverId, needsServerId])

  const total = selectedNominal?.price || 0

  const handleBuyClick = async () => {
    if (!canCheckout) return

    if (autoNickname) {
      setPlayerInfo({
        userId: userId.trim(),
        serverId: serverId.trim() || null,
        nickname: autoNickname,
      })
      setShowConfirm(true)
      return
    }

    setCheckingPlayer(true)
    setCheckError('')
    setPlayerInfo(null)
    setShowConfirm(true)

    try {
      const res = await fetch(`/api-proxy/games/${game.slug}/check-nickname?id=` + userId.trim() + (serverId ? '&server=' + serverId.trim() : ''), { credentials: 'include' })
      const data = await res.json()

      if (data.success && data.data?.nickname) {
        setPlayerInfo({
          userId: userId.trim(),
          serverId: serverId.trim() || null,
          nickname: data.data.nickname,
        })
        showSuccess(`Nickname ditemukan: ${data.data.nickname}`)
      } else {
        const msg = data.message || 'Data akun tidak valid'
        setCheckError(msg)
        showError(msg)
      }
    } catch (err) {
      setCheckError('Gagal memverifikasi data akun')
    } finally {
      setCheckingPlayer(false)
    }
  }

  const handleConfirmOrder = async () => {
    if (!playerInfo || !selectedNominal) return
    setCreatingPayment(true)
    setCheckError('')

    if (!isAuthenticated) {
      const msg = 'Silakan login terlebih dahulu untuk membuat pesanan'
      setCheckError(msg)
      showError(msg)
      setCreatingPayment(false)
      return
    }

    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    const redirectUrl = `${frontendUrl}/payment/success`

    try {
      const res = await authFetch('/api-proxy/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: game.slug,
          id_produk: selectedNominal.code || selectedNominal.id,
          id_player: playerInfo.userId,
          server: playerInfo.serverId || '',
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
        
        const orderId = String(order.id || resolvedOrderCode)

        // Simpan snapshot untuk halaman nota
        try {
          const snapshot = mapReceiptSnapshotFromOrder({
            ...order,
            nama_games: game.name,
            nama_produk: selectedNominal.label,
            harga_produk: selectedNominal.price,
            id_player: playerInfo.userId,
            id_server: playerInfo.serverId,
            nickname: playerInfo.nickname,
            image_url: game.image_url,
            status: order.status || 'pending_payment'
          })
          saveReceiptSnapshot(snapshot)
        } catch (snapErr) {
          console.error('Failed to save receipt snapshot:', snapErr)
        }

        const paymentUrl = data.data?.xendit?.invoice_url || data.data?.order?.xendit_invoice_url
        
        if (paymentUrl) {
          // Simpan dulu agar saat kembali dari Xendit bisa redirect ke nota
          savePendingPaymentRedirect(resolvedOrderCode, orderId)
          showSuccess('Pesanan dibuat! Mengalihkan ke pembayaran...')
          window.location.href = paymentUrl
          return
        }

        // Tidak ada Xendit URL — redirect ke halaman nota langsung
        setOrderCode(resolvedOrderCode)
        setOrderCreated(true)
        window.location.href = `/payment/success?orderCode=${encodeURIComponent(resolvedOrderCode)}&status=pending`
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
    setPlayerInfo(null)
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
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Data Akun</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-black uppercase tracking-wider text-gray-900 mb-2">User ID</label>
              <input
                type="text"
                placeholder={gameConfig.placeholder}
                value={userId}
                maxLength={gameConfig.maxLength}
                onChange={(e) => setUserId(e.target.value.replace(/\D/g, '').slice(0, gameConfig.maxLength))}
                className={
                  "w-full border-[3px] rounded-lg px-4 py-3.5 text-base font-bold bg-gray-50 focus:bg-white focus:outline-none transition-all " +
                  (checkError && checkError.includes('User ID') ? 'border-red-500 focus:shadow-[4px_4px_0px_#ef4444]' : 'border-gray-900 focus:shadow-[4px_4px_0px_#2563eb]')
                }
              />
              {checkError && checkError.includes('User ID') && (
                <p className="text-[10px] text-red-600 font-bold mt-1 uppercase">× {checkError}</p>
              )}
            </div>

            {/* Server ID untuk game yang membutuhkan */}
            {needsServerId && (
              <div>
                <label className="block text-sm font-black uppercase tracking-wider text-gray-900 mb-2">Server ID</label>
                <input
                  type="text"
                  placeholder="Contoh: 1234"
                  value={serverId}
                  maxLength={5}
                  onChange={(e) => setServerId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className={
                    "w-full border-[3px] rounded-lg px-4 py-3.5 text-base font-bold bg-gray-50 focus:bg-white focus:outline-none transition-all " +
                    (checkError && checkError.includes('Server ID') ? 'border-red-500 focus:shadow-[4px_4px_0px_#ef4444]' : 'border-gray-900 focus:shadow-[4px_4px_0px_#2563eb]')
                  }
                />
                {checkError && checkError.includes('Server ID') && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 uppercase">× {checkError}</p>
                )}
              </div>
            )}

            {/* Real-time Nickname Result */}
            {supportsNicknameCheck && userId && (
              <div className="pt-2">
                {isAutoChecking ? (
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold animate-pulse">
                    <div className="w-3 h-3 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Mengecek nickname...
                  </div>
                ) : autoNickname ? (
                  <div className="flex items-center gap-2 bg-[#f0fdf4] border-[3px] border-[#16a34a] p-3 rounded-xl shadow-[4px_4px_0px_#16a34a]">
                    <div className="w-8 h-8 bg-white border-[3px] border-[#16a34a] rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#16a34a]">
                      <svg width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-[#16a34a] font-black uppercase tracking-wider">Nickname Ditemukan</p>
                        {autoRegion && (
                          <span className="bg-blue-600 border-2 border-gray-900 shadow-[2px_2px_0_#111827] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase leading-none">
                            {autoRegion}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-gray-900 mt-1">{autoNickname}</p>
                    </div>
                  </div>
                ) : checkError && userId && (!needsServerId || serverId) && !checkError.includes('ID') ? (
                  <div className="flex items-center gap-2 bg-[#fef2f2] border-[3px] border-red-500 p-3 rounded-xl shadow-[4px_4px_0px_#ef4444]">
                    <div className="w-8 h-8 bg-white border-[3px] border-red-500 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#ef4444]">
                      <svg width="16" height="16" fill="none" stroke="#dc2626" strokeWidth="4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-red-600 font-black uppercase tracking-wider">Kesalahan</p>
                      <p className="text-sm font-black text-gray-900 mt-1">{checkError}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex items-start gap-2 text-gray-600 font-medium text-xs bg-gray-50 border-2 border-dashed border-gray-400 p-3 rounded-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01"/>
              </svg>
              Pastikan data akun benar. Kesalahan pengisian di luar tanggung jawab kami.
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
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Pilih Nominal</h2>
          </div>

          <div className="relative z-10">
            {isLoadingProducts && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-3 bg-white border-[3px] border-gray-900 p-4 rounded-xl shadow-[4px_4px_0px_#111827]">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Updating...</p>
                </div>
              </div>
            )}
            
            {dynamicNominals.length > 0 ? (
              <div className="space-y-8">
                {dynamicNominals.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-6 w-1.5 bg-blue-600 rounded-full shadow-[2px_2px_0px_#111827]" />
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b-[3px] border-gray-900 pb-1 pr-4">{group.label}</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {group.produks.map((nominal) => {
                        const hasImage = Boolean(nominal.image) && !imageLoadErrors[nominal.id]
                        const badgeText = getProductBadgeText(nominal.label)

                        return (
                        <button
                          key={nominal.id}
                          onClick={() => setSelectedNominal(nominal)}
                          className={
                            "border-[3px] rounded-xl p-3 text-left transition-all duration-200 relative " +
                            (selectedNominal?.id === nominal.id
                              ? 'border-blue-600 bg-blue-50 shadow-[4px_4px_0px_#2563eb] -translate-y-1'
                              : 'border-gray-900 bg-white hover:bg-gray-50 hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1')
                          }
                        >
                          <div className="flex items-center gap-3">
                            {hasImage ? (
                              <div className="w-12 h-12 shrink-0 border-[3px] border-gray-900 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-[2px_2px_0px_#111827]">
                                <Image
                                  src={nominal.image!}
                                  alt={nominal.label}
                                  width={48}
                                  height={48}
                                  unoptimized
                                  className="w-full h-full object-contain p-1"
                                  onError={() => {
                                    setImageLoadErrors((prev) => ({ ...prev, [nominal.id]: true }))
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 shrink-0 border-[3px] border-gray-900 rounded-lg bg-[#a5f3fc] flex items-center justify-center shadow-[2px_2px_0px_#111827]">
                                <span className="text-[11px] font-black text-gray-900 tracking-tighter">{badgeText}</span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-black text-gray-900 leading-tight truncate">
                                {nominal.label}
                              </p>
                              <p className="font-black text-blue-600 text-[15px] mt-1 drop-shadow-[1px_1px_0_#fff]">
                                {formatRupiah(nominal.price)}
                              </p>
                              {nominal.originalPrice && nominal.originalPrice > nominal.price && (
                                <p className="text-[10px] text-red-500 line-through font-bold">
                                  {formatRupiah(nominal.originalPrice)}
                                </p>
                              )}
                            </div>
                          </div>
                          {nominal.bonus && (
                            <div className="mt-3 inline-block bg-[#16a34a] border-[2px] border-gray-900 shadow-[2px_2px_0px_#111827] px-2 py-1 rounded-md text-[10px] font-black text-white uppercase tracking-wider">
                              +{nominal.bonus}
                            </div>
                          )}
                        </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border-[3px] border-gray-900 border-dashed rounded-xl bg-gray-50 shadow-[inset_4px_4px_0px_#e2e8f0]">
                <svg className="w-14 h-14 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-4 4m-8-4l-4 4" />
                </svg>
                <p className="text-gray-900 font-black text-lg uppercase">Produk Tidak Ditemukan</p>
                <p className="text-sm font-bold text-gray-500 mt-1">Silakan coba lagi beberapa saat atau pilih region lain.</p>
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
              <span className="text-gray-500 font-bold uppercase">Game</span>
              <span className="font-black text-gray-900 text-right">{game.name.split(':')[0].trim()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase">User ID</span>
              <span className="font-black text-gray-900 text-right">
                {userId ? userId : <span className="text-gray-300">-</span>}
              </span>
            </div>
            {needsServerId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-bold uppercase">Server</span>
                <span className="font-black text-gray-900 text-right">
                  {serverId ? serverId : <span className="text-gray-300">-</span>}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold uppercase">Item</span>
              <span className="font-black text-gray-900 text-right">
                {selectedNominal ? selectedNominal.label : <span className="text-gray-300">-</span>}
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
    <AnimatePresence>
    {showConfirm && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.25 } }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => !checkingPlayer && !creatingPayment && handleCloseConfirm()}
        />
        <motion.div
          className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#111827] w-full max-w-sm p-6 overflow-hidden"
          initial={{ opacity: 0, scale: 0.92, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-yellow-400 to-cyan-400 border-b-[3px] border-gray-900" />
          <div className="flex items-center justify-between mb-6 mt-2">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Konfirmasi</h3>
            {!checkingPlayer && !creatingPayment && (
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

          {/* Loading: cek player */}
          {checkingPlayer && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin shadow-[4px_4px_0_#111827]" />
              <p className="text-gray-900 font-bold uppercase tracking-wider">Mengecek data...</p>
            </div>
          )}

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

          {/* Error: cek player */}
          {!checkingPlayer && !creatingPayment && !orderCreated && checkError && (
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

          {/* Show player info - ready to confirm */}
          {!checkingPlayer && !creatingPayment && !orderCreated && playerInfo && (
            <>
              <div className="bg-gray-50 border-[3px] border-gray-900 rounded-xl p-5 mb-6 shadow-[inset_4px_4px_0px_#e2e8f0]">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 border-b-[3px] border-gray-900 pb-2 inline-block">Data Ditemukan</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#ffc900] border-[3px] border-gray-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#111827] rotate-3 text-xl font-black">
                    {playerInfo.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-gray-900 truncate">{playerInfo.nickname}</p>
                    <p className="text-sm font-bold text-gray-600 mt-1">
                      ID: {playerInfo.userId} {playerInfo.serverId && <span className="opacity-60">({playerInfo.serverId})</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-[3px] border-blue-600 rounded-xl p-5 mb-6 shadow-[4px_4px_0px_#2563eb]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-blue-900 font-bold text-sm uppercase tracking-wider">Item</span>
                  <span className="font-black text-blue-900 bg-white border-2 border-blue-600 px-2 py-0.5 rounded shadow-[1px_1px_0_#2563eb]">{selectedNominal?.label}</span>
                </div>
                <div className="flex justify-between items-center border-t-[3px] border-blue-600/20 pt-3">
                  <span className="text-blue-900 font-bold text-sm uppercase tracking-wider">Total Harga</span>
                  <span className="font-black text-xl text-blue-700">{formatRupiah(selectedNominal?.price || 0)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseConfirm}
                  className="flex-1 py-3.5 border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="flex-1 py-3.5 border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 bg-[#16a34a] hover:bg-green-500 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all uppercase"
                >
                  Lanjut Bayar
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    )}
    </AnimatePresence>
    </>
  )
}
