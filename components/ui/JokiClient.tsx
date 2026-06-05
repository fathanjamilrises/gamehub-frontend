'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { GameListItem, WorkerProfile, WorkerService } from '@/lib/types'
import { authFetch } from '@/lib/authApi'
import { useRouter } from 'next/navigation'

interface Props {
  initialGames: GameListItem[]
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export default function JokiClient({ initialGames }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGame, setSelectedGame] = useState<GameListItem | null>(null)
  
  const [jokiProduks, setJokiProduks] = useState<any[]>([])
  const [loadingProduks, setLoadingProduks] = useState(false)
  const [selectedService, setSelectedService] = useState<any | null>(null)

  const [selectedSub, setSelectedSub] = useState<any | null>(null)
  const [jumlahUnit, setJumlahUnit] = useState(1)
  const [durasi, setDurasi] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  const [payerEmail, setPayerEmail] = useState('')
  const [gameEmail, setGameEmail] = useState('')
  const [gameUsername, setGameUsername] = useState('')
  const [gamePassword, setGamePassword] = useState('')
  const [loginType, setLoginType] = useState('moonton')
  const [rankSaatIni, setRankSaatIni] = useState('')
  const [rankTarget, setRankTarget] = useState('')
  const [catatanUser, setCatatanUser] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const filteredGames = initialGames.filter((game) => {
    const query = searchQuery.toLowerCase().trim()
    return (
      game.name.toLowerCase().includes(query) ||
      game.publisher.toLowerCase().includes(query) ||
      (game.category && game.category.toLowerCase().includes(query))
    )
  })

  // Reset selected service and category when game changes
  useEffect(() => {
    setSelectedService(null)
    setSelectedCategory('Semua')
    setSelectedSub(null)
    setJumlahUnit(1)
  }, [selectedGame])

  // Reset duration and sub-product when service changes
  useEffect(() => {
    if (selectedService) {
      setDurasi(selectedService.minimal_order || 1)
      if (selectedService.subs && selectedService.subs.length > 0) {
        setSelectedSub(selectedService.subs[0])
        setJumlahUnit(selectedService.subs[0].min_unit || 1)
      } else {
        setSelectedSub(null)
        setJumlahUnit(1)
      }
    } else {
      setDurasi(1)
      setSelectedSub(null)
      setJumlahUnit(1)
    }
  }, [selectedService])

  // Fetch Joki products when game is selected
  useEffect(() => {
    if (!selectedGame) return

    const fetchJokiProduks = async () => {
      setLoadingProduks(true)
      try {
        const res = await authFetch(`/api-proxy/joki-produk?id_games=${selectedGame.id}`)
        if (res.ok) {
          const data = await res.json()
          const rawList = data.data || []
          console.log('[joki-public] fetchJokiProduks raw:', JSON.stringify(rawList).slice(0, 1000))
          
          // Normalize: backend may return sub-products under various keys
          const normalizedList = rawList.map((item: any) => ({
            ...item,
            subs: item.subs
              || item.JokiSubProduks
              || item.joki_sub_produks
              || item.sub_produks
              || item.SubProduks
              || item.sub_products
              || item.SubProducts
              || item.subProducts
              || []
          }))
          
          // Safeguard: only keep products whose id_games matches selectedGame.id
          const filtered = normalizedList.filter((svc: any) => 
            String(svc.id_games) === String(selectedGame.id)
          )
          setJokiProduks(filtered)
        } else {
          // fallback if backend is not ready
          const fallbackData = [
            {
              id: 1,
              id_games: 3,
              nama_produk: 'Joki FF by Worker A',
              kategori_joki: 'Rank',
              harga: null,
              gambar_produk: '',
              game: { id: 3, nama_games: 'Free Fire' },
              worker: { id: 4, nama_lengkap: 'Rahadi', rating: '0.00' },
              subs: [
                { id: 1, nama_sub: 'Bronze', satuan: 'rank', harga_per_unit: '5000.00', min_unit: 1, max_unit: null },
                { id: 2, nama_sub: 'Gold', satuan: 'rank', harga_per_unit: '8000.00', min_unit: 1, max_unit: null }
              ]
            }
          ]
          const filtered = fallbackData.filter((svc: any) => 
            String(svc.id_games) === String(selectedGame.id)
          )
          setJokiProduks(filtered)
        }
      } catch (err) {
        console.error('Error fetching joki products:', err)
      } finally {
        setLoadingProduks(false)
      }
    }

    fetchJokiProduks()
  }, [selectedGame])

  // Get unique categories from products
  const uniqueCategories = ['Semua', ...Array.from(new Set(jokiProduks.map(svc => svc.kategori_joki).filter(Boolean)))]

  // Filtered products list based on selected category
  const filteredProducts = jokiProduks.filter(svc => {
    if (selectedCategory === 'Semua') return true
    return svc.kategori_joki === selectedCategory
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGame || !selectedService || !selectedService.worker || !loginType) {
      alert('Mohon lengkapi semua data wajib!')
      return
    }

    setIsSubmitting(true)
    try {
      let payload: any = {}

      if (selectedSub) {
        // Cara 1 - Pakai sub-produk
        const finalJumlahUnit = Math.max(selectedSub.min_unit || 1, jumlahUnit)
        payload = {
          slug_games: selectedGame.slug,
          id_sub_produk: selectedSub.id,
          jumlah_unit: finalJumlahUnit,
          login_type: loginType,
          game_email: gameEmail,
          game_password: gamePassword,
          game_username: gameUsername,
          rank_saat_ini: rankSaatIni,
          rank_target: rankTarget,
          catatan_user: catatanUser,
          payer_email: payerEmail
        }
      } else {
        // Cara 2 - Legacy (JokiService)
        const finalDurasi = Math.max(selectedService.minimal_order || 1, durasi)
        const finalHarga = Number(selectedService.harga || selectedService.harga_per_hari || 0) * finalDurasi
        payload = {
          slug_games: selectedGame.slug,
          id_service: selectedService.id,
          login_type: loginType,
          game_email: gameEmail,
          game_password: gamePassword,
          game_username: gameUsername,
          rank_saat_ini: rankSaatIni,
          rank_target: rankTarget,
          catatan_user: catatanUser,
          harga: finalHarga,
          payer_email: payerEmail
        }
      }

      const res = await authFetch('/api-proxy/joki-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        const invoiceUrl = data.data?.invoice_url || data.data?.xendit_invoice_url || data.data?.order?.invoice_url
        if (invoiceUrl) {
          window.location.href = invoiceUrl
        } else {
          alert('Berhasil order! Cek halaman pesanan untuk status.')
          router.push('/orders/joki')
        }
      } else {
        alert('Simulasi berhasil! (Backend belum siap)')
        router.push('/orders')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate total price for order
  const totalHarga = selectedSub
    ? Number(selectedSub.harga_per_unit) * jumlahUnit
    : selectedService
      ? Number(selectedService.harga || selectedService.harga_per_hari || 0) * durasi
      : 0

  // ── Worker & Order View ──
  if (selectedGame) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white border-[3px] border-gray-900 rounded-xl sm:rounded-2xl shadow-[4px_4px_0px_#111827] sm:shadow-[6px_6px_0px_#111827] relative overflow-hidden"
      >
        {/* Top bar with game info */}
        <div className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] border-b-[3px] border-gray-900 px-4 py-3 sm:px-8 sm:py-5 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center">
          <motion.button
            onClick={() => {
              setSelectedGame(null)
              setSelectedService(null)
            }}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider hover:bg-white/30 transition-colors self-start"
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Ganti Game
          </motion.button>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-white/30 overflow-hidden relative bg-white/10 shrink-0">
              <Image src={selectedGame.image_url} alt={selectedGame.name} fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase text-white tracking-tight line-clamp-1">{selectedGame.name}</h2>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{selectedGame.publisher}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column: Joki Products */}
            <div>
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <motion.div
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-[#ff90e8] border-[3px] border-gray-900 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827] -rotate-3 shrink-0"
                  whileHover={{ rotate: 6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                    <polygon points="12 2 2 22 22 22"/>
                  </svg>
                </motion.div>
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-base sm:text-lg">Pilih Layanan Joki</h3>
              </div>
              
              {loadingProduks ? (
                <div className="flex items-center gap-2.5 sm:gap-3 bg-[#ffc900]/30 border-[3px] border-gray-900 rounded-xl p-4 sm:p-5 shadow-[3px_3px_0px_#111827] sm:shadow-[4px_4px_0px_#111827]">
                  <div className="w-6 h-6 border-[3px] border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <p className="font-black text-sm text-gray-900 uppercase">Mencari layanan...</p>
                </div>
              ) : jokiProduks.length > 0 ? (
                <div className="space-y-4">
                  {/* Category tabs */}
                  {uniqueCategories.length > 2 && (
                    <div className="flex flex-wrap gap-1.5 pb-2">
                      {uniqueCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 border-[3px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#111827] transition-all ${
                            selectedCategory === cat
                              ? 'bg-[#ffc900] text-gray-900 translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#111827]'
                              : 'bg-white text-gray-700 hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#111827]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredProducts.length > 0 ? (
                    <motion.div
                      className="space-y-4"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredProducts.map(svc => (
                        <motion.div
                          key={svc.id}
                          variants={cardVariant}
                          onClick={() => {
                            setSelectedService(svc)
                          }}
                          className={`border-[3px] border-gray-900 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                            selectedService?.id === svc.id 
                              ? 'bg-[#ffc900] shadow-[4px_4px_0px_#111827] sm:shadow-[6px_6px_0px_#111827] -translate-y-1' 
                              : 'bg-white shadow-[3px_3px_0px_#111827] sm:shadow-[4px_4px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] sm:hover:shadow-[5px_5px_0px_#111827] hover:-translate-y-0.5'
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div className="flex gap-3.5 items-start">
                              {svc.gambar_produk && (
                                <div className="w-16 h-16 rounded-lg border-2 border-gray-900 overflow-hidden bg-gray-100 relative shrink-0">
                                  <img src={resolveImageUrl(svc.gambar_produk)} alt={svc.nama_produk || svc.nama_layanan} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-black text-sm sm:text-base uppercase tracking-tight line-clamp-1">{svc.nama_produk || svc.nama_layanan}</h4>
                                <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 line-clamp-2 leading-tight mt-0.5 mb-2">{svc.deskripsi}</p>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <span className="inline-block bg-[#ff90e8]/50 border border-gray-900/30 px-2 py-0.5 text-[8px] font-black uppercase rounded">
                                    {svc.kategori_joki || 'Rank'}
                                  </span>
                                  {svc.minimal_order && (
                                    <span className="inline-block bg-[#90e0ff]/50 border border-gray-900/30 px-2 py-0.5 text-[8px] font-black uppercase rounded">
                                      Min. {svc.minimal_order} Hari
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t border-dashed border-gray-200 sm:border-0 pt-3 sm:pt-0 shrink-0">
                              {/* Price */}
                              {svc.subs && svc.subs.length > 0 ? (
                                <div className="text-right">
                                  <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Mulai</span>
                                  <span className="text-sm font-black text-blue-600 bg-white border-2 border-gray-900 px-2 py-1 rounded shadow-[1.5px_1.5px_0_#111827] inline-block whitespace-nowrap">
                                    Rp {Math.min(...svc.subs.map((s: any) => Number(s.harga_per_unit))).toLocaleString('id-ID')} / {svc.subs[0].satuan}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tarif / Hari</span>
                                  <span className="text-sm font-black text-blue-600 bg-white border-2 border-gray-900 px-2 py-1 rounded shadow-[1.5px_1.5px_0_#111827] inline-block whitespace-nowrap">
                                    Rp {Number(svc.harga || svc.harga_per_hari || 0).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              )}

                              {/* Worker details */}
                              {svc.worker && (
                                <div className="flex items-center gap-2 mt-1 bg-gray-50 border border-gray-900/10 px-2.5 py-1 rounded-lg">
                                  <div className="w-5 h-5 rounded-full border border-gray-900 bg-[#ffc900] flex items-center justify-center font-black text-[9px] text-gray-900 shrink-0 overflow-hidden">
                                    {svc.worker.foto_url ? (
                                      <img src={resolveImageUrl(svc.worker.foto_url)} alt={svc.worker.nama_lengkap} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                      (svc.worker.nama_lengkap || '').charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="text-left leading-none">
                                    <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-[80px]">@{svc.worker.user?.username || svc.worker.nama_lengkap}</span>
                                    <span className="text-[9px] font-black text-yellow-500">★ {Number(svc.worker.rating || 0) === 0 ? 'New' : Number(svc.worker.rating).toFixed(1)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="bg-gray-50 border-[3px] border-gray-900 rounded-xl p-5 sm:p-6 shadow-[3px_3px_0px_#111827] text-center">
                      <p className="font-black text-sm text-gray-900 uppercase">Tidak ada layanan untuk kategori "{selectedCategory}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border-[3px] border-gray-900 rounded-xl p-5 sm:p-6 shadow-[3px_3px_0px_#111827] sm:shadow-[4px_4px_0px_#111827] text-center">
                  <div className="text-4xl mb-3">😔</div>
                  <p className="font-black text-sm text-gray-900 uppercase">Belum ada layanan joki untuk game ini</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">Coba pilih game lainnya</p>
                </div>
              )}
            </div>

            {/* Right Column: Order Form or Placeholder */}
            <div className="lg:sticky lg:top-8 h-fit">
              <AnimatePresence mode="wait">
                {selectedService && selectedService.worker ? (
                  <motion.div
                    key="order-form-container"
                    variants={fadeSlideUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="flex items-center gap-2 mb-4 sm:mb-5">
                      <motion.div
                        className="w-9 h-9 sm:w-10 sm:h-10 bg-[#90e0ff] border-[3px] border-gray-900 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827] rotate-3 shrink-0"
                        whileHover={{ rotate: -6 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </motion.div>
                      <h3 className="font-black text-gray-900 uppercase tracking-tight text-base sm:text-lg">Isi Data Akun</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white border-[3px] border-gray-900 rounded-lg sm:rounded-xl shadow-[4px_4px_0px_#111827] sm:shadow-[6px_6px_0px_#111827] overflow-hidden">
                      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                        {/* Selected Service Summary */}
                        <div className="bg-gradient-to-r from-[#ffc900]/30 to-[#ff90e8]/20 border-[3px] border-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-black text-gray-900/50 uppercase tracking-widest">Layanan Dipilih</p>
                            <p className="font-black text-sm text-gray-900 uppercase">{selectedService.nama_produk || selectedService.nama_layanan}</p>
                          </div>
                          <span className="font-black text-base sm:text-lg text-gray-900 bg-[#ffc900] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] whitespace-nowrap">
                            {selectedSub 
                              ? `Rp ${Number(selectedSub.harga_per_unit).toLocaleString('id-ID')} / ${selectedSub.satuan}` 
                              : `Rp ${Number(selectedService.harga || selectedService.harga_per_hari || 0).toLocaleString('id-ID')} / Hari`}
                          </span>
                        </div>

                        {/* Sub-product selector pill grid */}
                        {selectedService.subs && selectedService.subs.length > 0 && (
                          <div>
                            <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">
                              Pilih Tingkat / Sub-Produk
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedService.subs.map((sub: any) => (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSub(sub)
                                    setJumlahUnit(sub.min_unit || 1)
                                  }}
                                  className={`p-3 text-left border-[3px] border-gray-900 rounded-xl transition-all shadow-[2px_2px_0px_#111827] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#111827] ${
                                    selectedSub?.id === sub.id
                                      ? 'bg-[#ffc900] text-gray-900 shadow-[2px_2px_0px_#111827]'
                                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-900 hover:shadow-[3px_3px_0px_#111827]'
                                  }`}
                                >
                                  <div className="font-black text-xs uppercase">{sub.nama_sub}</div>
                                  <div className="text-[10px] font-bold text-gray-500 mt-0.5">
                                    Rp {Number(sub.harga_per_unit).toLocaleString('id-ID')} / {sub.satuan}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Form Fields */}
                        <div>
                          <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">Email Pemesan</label>
                          <input 
                            type="email" required
                            value={payerEmail} onChange={e => setPayerEmail(e.target.value)}
                            className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-sm focus:outline-none focus:bg-[#90e0ff]/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
                            placeholder="Masukkan email kamu"
                          />
                        </div>

                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">Login Via</label>
                            <select 
                              value={loginType} onChange={e => setLoginType(e.target.value)}
                              className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-sm uppercase focus:outline-none focus:bg-[#ffc900]/20 focus:border-blue-600 transition-colors bg-white"
                            >
                              <option value="email">Email</option>
                              <option value="moonton">Moonton</option>
                              <option value="google">Google</option>
                              <option value="facebook">Facebook</option>
                              <option value="other">Lainnya</option>
                            </select>
                          </div>

                          {selectedSub ? (
                            <div>
                              <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">
                                Jumlah Order ({selectedSub.satuan})
                              </label>
                              <div className="flex items-center gap-2 border-[3px] border-gray-900 rounded-lg p-1 sm:p-1.5 bg-white relative">
                                <button
                                  type="button"
                                  onClick={() => setJumlahUnit(prev => Math.max(selectedSub.min_unit || 1, prev - 1))}
                                  className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 rounded flex items-center justify-center font-black text-sm transition-colors cursor-pointer select-none"
                                >
                                  -
                                </button>
                                <input 
                                  type="number" required
                                  min={selectedSub.min_unit || 1}
                                  max={selectedSub.max_unit || undefined}
                                  value={jumlahUnit} 
                                  onChange={e => setJumlahUnit(parseInt(e.target.value) || 0)}
                                  onBlur={() => {
                                    const min = selectedSub.min_unit || 1
                                    const max = selectedSub.max_unit
                                    let val = jumlahUnit
                                    if (val < min) val = min
                                    if (max && val > max) val = max
                                    setJumlahUnit(val)
                                  }}
                                  className="flex-1 text-center font-black text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const max = selectedSub.max_unit
                                    setJumlahUnit(prev => {
                                      if (max && prev >= max) return prev
                                      return prev + 1
                                    })
                                  }}
                                  className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 rounded flex items-center justify-center font-black text-sm transition-colors cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                              <span className="block mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                Min: {selectedSub.min_unit || 1} {selectedSub.satuan}
                                {selectedSub.max_unit ? ` / Max: ${selectedSub.max_unit}` : ''}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">Durasi Joki (Hari)</label>
                              <div className="flex items-center gap-2 border-[3px] border-gray-900 rounded-lg p-1 sm:p-1.5 bg-white relative">
                                <button
                                  type="button"
                                  onClick={() => setDurasi(prev => Math.max(selectedService.minimal_order || 1, prev - 1))}
                                  className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 rounded flex items-center justify-center font-black text-sm transition-colors cursor-pointer select-none"
                                >
                                  -
                                </button>
                                <input 
                                  type="number" required
                                  min={selectedService.minimal_order || 1}
                                  value={durasi} 
                                  onChange={e => setDurasi(parseInt(e.target.value) || 0)}
                                  onBlur={() => {
                                    if (durasi < (selectedService.minimal_order || 1)) {
                                      setDurasi(selectedService.minimal_order || 1)
                                    }
                                  }}
                                  className="flex-1 text-center font-black text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                                />
                                <button
                                  type="button"
                                  onClick={() => setDurasi(prev => prev + 1)}
                                  className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 rounded flex items-center justify-center font-black text-sm transition-colors cursor-pointer select-none"
                                >
                                  +
                                </button>
                              </div>
                              <span className="block mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                Min. order: {selectedService.minimal_order || 1} Hari
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">Game Email / Telp</label>
                            <input 
                              type="text" required
                              value={gameEmail} onChange={e => setGameEmail(e.target.value)}
                              className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-sm focus:outline-none focus:bg-[#90e0ff]/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
                              placeholder="Masukkan game email"
                            />
                          </div>
                          
                          <div>
                            <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">Game Username / ID</label>
                            <input 
                              type="text" required
                              value={gameUsername} onChange={e => setGameUsername(e.target.value)}
                              className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-sm focus:outline-none focus:bg-[#90e0ff]/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
                              placeholder="Masukkan game username/ID"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">Password Akun</label>
                          <input 
                            type="password" required
                            value={gamePassword} onChange={e => setGamePassword(e.target.value)}
                            className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-sm focus:outline-none focus:bg-[#90e0ff]/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
                            placeholder="Masukkan password akun"
                          />
                          <div className="flex items-center gap-1.5 mt-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                            <p className="text-[10px] font-bold text-green-600">Sandi dienkripsi dan dihapus otomatis setelah order selesai</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">
                              Rank Saat Ini {!selectedSub && ' (Wajib)'}
                            </label>
                            <input 
                              type="text" required={!selectedSub}
                              value={rankSaatIni} onChange={e => setRankSaatIni(e.target.value)}
                              className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-sm focus:outline-none focus:bg-[#90e0ff]/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
                              placeholder="Contoh: Epic III"
                            />
                          </div>
                          <div>
                            <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">
                              Rank Target {!selectedSub && ' (Wajib)'}
                            </label>
                            <input 
                              type="text" required={!selectedSub}
                              value={rankTarget} onChange={e => setRankTarget(e.target.value)}
                              className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-sm focus:outline-none focus:bg-[#90e0ff]/20 focus:border-blue-600 transition-colors placeholder:text-gray-400"
                              placeholder="Contoh: Mythic"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-black text-[11px] uppercase tracking-widest text-gray-900/60 mb-2">Catatan untuk Joki (Opsional)</label>
                          <textarea 
                            value={catatanUser} onChange={e => setCatatanUser(e.target.value)}
                            rows={3}
                            className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 font-bold text-sm focus:outline-none focus:bg-[#90e0ff]/20 focus:border-blue-600 transition-colors placeholder:text-gray-400 resize-none"
                            placeholder="Contoh: Tolong pakai hero Assassin, jangan ubah setting layout, dll."
                          />
                        </div>
                      </div>

                      {/* Submit Bar */}
                      <div className="border-t-[3px] border-dashed border-gray-900 bg-gray-50 px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <div className="text-center sm:text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-900/50">
                            Total Harga {selectedSub ? `(${jumlahUnit} ${selectedSub.satuan})` : `(${durasi} Hari)`}
                          </p>
                          <p className="text-xl sm:text-2xl font-black text-gray-900">
                            Rp {totalHarga.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <motion.button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-blue-600 text-white font-black uppercase text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-3.5 border-[3px] border-gray-900 rounded-xl shadow-[3px_3px_0px_#111827] sm:shadow-[4px_4px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          whileTap={{ scale: 0.97 }}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Memproses...
                            </>
                          ) : (
                            <>
                              Order Joki Sekarang
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                              </svg>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder-container"
                    variants={fadeSlideUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-gray-50 border-[3px] border-dashed border-gray-300 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[350px] shadow-[4px_4px_0px_rgba(0,0,0,0.05)]"
                  >
                    <div className="w-16 h-16 bg-[#ff90e8]/30 border-[3px] border-gray-900 rounded-full flex items-center justify-center text-3xl mb-4 shadow-[3px_3px_0px_#111827]">
                      🎮
                    </div>
                    <h4 className="font-black text-gray-900 uppercase tracking-tight text-base mb-2">Pilih Layanan Joki</h4>
                    <p className="text-xs font-bold text-gray-500 max-w-xs uppercase leading-relaxed">
                      Silakan pilih salah satu layanan joki yang tersedia di sebelah kiri untuk mengisi data akun dan melanjutkan pemesanan.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── Game List View ──
  return (
    <div className="bg-white border-[3px] border-gray-900 rounded-xl sm:rounded-2xl shadow-[4px_4px_0px_#111827] sm:shadow-[6px_6px_0px_#111827] relative overflow-hidden">
      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-[#ff90e8] rounded-bl-2xl sm:rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#ffc900]/10 rounded-full pointer-events-none" />
      
      <div className="p-4 sm:p-7 md:p-8">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8 relative z-10">
          <div className="relative w-full max-w-lg">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="CARI GAME..."
              className="w-full border-[3px] border-gray-900 rounded-xl pl-11 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider focus:outline-none focus:bg-white focus:border-blue-600 bg-gray-50 shadow-[2px_2px_0px_#111827] sm:shadow-[3px_3px_0px_#111827] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center text-white hover:bg-red-500 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {filteredGames.length} game ditemukan
            </p>
          )}
        </div>

        {/* Games Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4 relative z-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredGames.map((game) => (
            <motion.div
              key={game.id}
              variants={cardVariant}
              onClick={() => setSelectedGame(game)}
              className="group relative bg-white border-[3px] border-gray-900 rounded-lg sm:rounded-xl overflow-hidden cursor-pointer flex flex-col h-full shadow-[3px_3px_0px_#111827] sm:shadow-[4px_4px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] sm:hover:shadow-[6px_6px_0px_#111827] hover:-translate-y-1 transition-all duration-200"
              whileTap={{ scale: 0.97 }}
            >
              <div className="relative w-full aspect-[3/4] border-b-[3px] border-gray-900 overflow-hidden bg-gray-200">
                <Image
                  src={game.image_url || '/placeholder.png'}
                  alt={game.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                {game.badge && (
                  <div className="absolute top-2 right-2 bg-[#ffc900] text-gray-900 text-[10px] font-black px-2 py-1 rounded border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase rotate-3">
                    {game.badge}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 bg-white border-2 border-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 shadow-[2px_2px_0px_#111827]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-2 sm:p-3 flex flex-col flex-grow bg-white group-hover:bg-[#ff90e8] transition-colors duration-200">
                <h3 className="font-black text-gray-900 text-xs sm:text-sm uppercase line-clamp-1 group-hover:text-black">
                  {game.name}
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mt-1 line-clamp-1 group-hover:text-gray-800">
                  {game.publisher}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredGames.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎮</div>
            <p className="font-black text-gray-900 uppercase text-lg">Game tidak ditemukan</p>
            <p className="text-sm font-bold text-gray-500 mt-1">Coba kata kunci lain</p>
          </div>
        )}
      </div>
    </div>
  )
}
