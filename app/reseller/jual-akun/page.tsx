'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/contexts/ToastContext'
import { authFetch } from '@/lib/authApi'
import { getGames } from '@/lib/gamesApi'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

export default function JualAkunPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form fields matching JualBeliAkuns table
  const [namaPost, setNamaPost] = useState('')
  const [idAccountGame, setIdAccountGame] = useState('1')
  const [tipeTransaksi, setTipeTransaksi] = useState('jual')
  const [serverRegion, setServerRegion] = useState('Indonesia')
  const [hargaJual, setHargaJual] = useState('')
  const [isNegotiable, setIsNegotiable] = useState(false)
  const [hargaNegoMin, setHargaNegoMin] = useState('')
  const [deskripsiDetail, setDeskripsiDetail] = useState('')

  // JSON fields for kondisi & kontak
  const [kondisiLevel, setKondisiLevel] = useState('')
  const [kondisiRank, setKondisiRank] = useState('')
  const [kontakWa, setKontakWa] = useState('')

  const [gambarPreviews, setGambarPreviews] = useState<string[]>([])
  const [gambarFiles, setGambarFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const [availableGames, setAvailableGames] = useState<any[]>([])

  // Ambil daftar game saat komponen dimuat
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesList = await getGames()
        setAvailableGames(gamesList)
        if (gamesList && gamesList.length > 0) {
          setIdAccountGame(String(gamesList[0].id))
        }
      } catch (err) {
        console.error('Failed to fetch games:', err)
      }
    }
    fetchGames()
  }, [])

  // Jika mode edit, ambil data listing dari daftar listing milik user
  useEffect(() => {
    if (!editId) return
    const fetchEditData = async () => {
      try {
        const res = await authFetch('/api-proxy/jual-beli-akun/user/my-listings')
        if (res.ok) {
          const data = await res.json()
          const rawData = data.data || []
          const item = rawData.find((a: any) => String(a.id) === String(editId))
          if (item) {
            setNamaPost(item.nama_post || '')
            setIdAccountGame(String(item.id_account_game || '1'))
            setTipeTransaksi(item.tipe_transaksi || 'jual')
            setServerRegion(item.server_region || 'Indonesia')
            setHargaJual(String(item.harga_jual || ''))
            setIsNegotiable(item.is_negotiable == 1 || item.is_negotiable === true)
            setHargaNegoMin(String(item.harga_nego_min || ''))
            setDeskripsiDetail(item.deskripsi_detail || '')
            if (item.kondisi_akun) {
              setKondisiLevel(item.kondisi_akun.level || '')
              setKondisiRank(item.kondisi_akun.rank || '')
            }
            if (item.metode_kontak) {
              setKontakWa(item.metode_kontak.whatsapp || '')
            }
            if (item.screenshots) {
              let parsed: any[] = []
              try {
                if (typeof item.screenshots === 'string') {
                  parsed = JSON.parse(item.screenshots)
                } else if (Array.isArray(item.screenshots)) {
                  parsed = item.screenshots
                }
              } catch(e) {}
              
              const urls = parsed.map(sc => {
                if (typeof sc === 'string') return resolveImageUrl(sc)
                if (sc && typeof sc === 'object' && sc.url_gambar) return resolveImageUrl(sc.url_gambar)
                return ''
              }).filter(Boolean)
              
              setGambarPreviews(urls)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load edit data', err)
      }
    }
    fetchEditData()
  }, [editId])

  // Pastikan user adalah reseller yang approved atau sedang mode demo
  useEffect(() => {
    if (authLoading) return

    // Cek mode demo
    const demoMode = localStorage.getItem('reseller_demo_mode')
    if (demoMode === 'true') {
      setLoading(false)
      return
    }

    if (!isAuthenticated) {
      router.push('/reseller')
      return
    }

    const checkStatus = async () => {
      try {
        const res = await authFetch('/api-proxy/resellers/me')
        if (res.ok) {
          const data = await res.json()
          const r = data?.data || data?.reseller || data
          if (!r || r.status !== 'approved') {
            router.push('/reseller') // Redirect kembali jika bukan approved
          } else {
            setLoading(false)
          }
        } else {
          router.push('/reseller')
        }
      } catch {
        router.push('/reseller')
      }
    }
    checkStatus()
  }, [authLoading, isAuthenticated, router])

  const processFiles = (files: File[]) => {
    if (files.length + gambarFiles.length > 10) {
      showError('Maksimal 10 screenshot diperbolehkan!')
      return
    }

    setGambarFiles(prev => [...prev, ...files])

    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setGambarPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleGambarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
      if (files.length > 0) {
        processFiles(files)
      } else {
        showError('Hanya file gambar yang diperbolehkan.')
      }
    }
  }

  const removeGambar = (index: number) => {
    setGambarFiles(prev => prev.filter((_, i) => i !== index))
    setGambarPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!namaPost || !hargaJual || !deskripsiDetail) {
      showError('Semua kolom wajib diisi!')
      return
    }

    setSubmitting(true)

    try {
      const cleanHargaJual = hargaJual.replace(/\D/g, '')
      const cleanHargaNego = hargaNegoMin.replace(/\D/g, '')

      const generatedSlug = namaPost
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 8)

      const payload = {
        nama_post: namaPost,
        slug: generatedSlug,
        id_account_game: Number(idAccountGame),
        tipe_transaksi: tipeTransaksi,
        server_region: serverRegion,
        harga_jual: Number(cleanHargaJual),
        is_negotiable: isNegotiable ? 1 : 0,
        harga_nego_min: isNegotiable && cleanHargaNego ? Number(cleanHargaNego) : null,
        deskripsi_detail: deskripsiDetail,
        kondisi_akun: { level: kondisiLevel, rank: kondisiRank },
        metode_kontak: { whatsapp: kontakWa },
        id_penjual: user?.id || null,
        screenshots: gambarPreviews // Send Base64 strings
      }

      // Jika dalam mode demo, cukup simpan ke localStorage mock
      const isDemo = localStorage.getItem('reseller_demo_mode') === 'true'
      if (isDemo) {
        const dummyAccounts = JSON.parse(localStorage.getItem('dummy_reseller_accounts') || '[]')
        const newAccount = {
          id: `acc-${Date.now()}`,
          game: availableGames.find(g => String(g.id) === String(idAccountGame))?.name || 'Game',
          judul: namaPost,
          harga: parseInt(cleanHargaJual || '0'),
          status: 'tersedia',
          tanggal: new Date().toISOString()
        }
        localStorage.setItem('dummy_reseller_accounts', JSON.stringify([newAccount, ...dummyAccounts]))

        showSuccess('🎉 [DEMO] Akun berhasil diposting!')
        router.push('/reseller')
        return
      }

      const endpoint = editId ? `/api-proxy/jual-beli-akun/${editId}` : '/api-proxy/jual-beli-akun'
      const method = editId ? 'PUT' : 'POST'

      const res = await authFetch(endpoint, {
        method: method,
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        let errorMsg = errorData.message || 'Gagal memposting akun'
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          errorMsg = `${errorMsg}: ${errorData.errors[0]}`
        }
        throw new Error(errorMsg)
      }

      showSuccess('🎉 Akun berhasil diposting dan langsung tayang di tokomu!')
      router.push('/reseller') // Kembali ke dashboard
    } catch (err: any) {
      showError(err.message || 'Terjadi kesalahan saat memposting akun.')
    } finally {
      setSubmitting(false)
    }
  }

  // Format harga jadi Rupiah
  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value.replace(/\D/g, '')
    if (val) {
      setter(parseInt(val).toLocaleString('id-ID'))
    } else {
      setter('')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-[3px] border-gray-900 border-t-purple-500 rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500 border-[3px] border-gray-900 text-white text-[11px] font-black px-4 py-2 rounded-lg mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              RESELLER PORTAL
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Jual Akun Game</h1>
            <p className="text-sm font-bold text-gray-500">Isi detail akun game yang ingin kamu jual dengan lengkap.</p>
          </div>
          <button
            onClick={() => router.push('/reseller')}
            className="hidden sm:flex items-center gap-2 text-xs font-black bg-white border-2 border-gray-900 px-4 py-2 rounded-xl shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
          >
            ← Kembali
          </button>
        </div>

        {/* Form */}
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#111827] relative">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

            {/* Game Selection */}
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Pilih Game</label>
              <div className="relative">
                <select
                  value={idAccountGame}
                  onChange={(e) => setIdAccountGame(e.target.value)}
                  className="w-full appearance-none border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white cursor-pointer"
                >
                  {availableGames.length > 0 ? (
                    availableGames.map(g => (
                      <option key={g.id} value={g.id}>{g.nama_games || g.name || 'Unknown'}</option>
                    ))
                  ) : (
                    <option value="1">Mobile Legends</option>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Grid untuk Tipe & Region */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipe Akun */}
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Tipe Transaksi</label>
                <div className="relative">
                  <select
                    value={tipeTransaksi}
                    onChange={(e) => setTipeTransaksi(e.target.value)}
                    className="w-full appearance-none border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white cursor-pointer"
                  >
                    <option value="jual">Jual</option>
                    <option value="beli">Beli (WTS)</option>
                    <option value="tukar">Tukar Tambah</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Region / Server</label>
                <div className="relative">
                  <select
                    value={serverRegion}
                    onChange={(e) => setServerRegion(e.target.value)}
                    className="w-full appearance-none border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white cursor-pointer"
                  >
                    <option value="Indonesia">Indonesia</option>
                    <option value="Asia">Asia</option>
                    <option value="Global">Global</option>
                    <option value="NA">Amerika Utara (NA)</option>
                    <option value="EU">Eropa (EU)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Judul Postingan */}
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Judul Postingan</label>
              <input
                type="text"
                value={namaPost}
                onChange={(e) => setNamaPost(e.target.value)}
                placeholder="Contoh: Akun ML Mythic Glory Full Skin Collector"
                className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Harga Jual (Rp)</label>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-900">Rp</span>
                <input
                  type="text"
                  value={hargaJual}
                  onChange={(e) => handleHargaChange(e, setHargaJual)}
                  placeholder="0"
                  className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="isNegotiable"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="w-5 h-5 border-[3px] border-gray-900 rounded accent-[#ff90e8] cursor-pointer"
                />
                <label htmlFor="isNegotiable" className="text-xs font-bold text-gray-900 uppercase tracking-widest cursor-pointer">
                  Bisa Nego?
                </label>
              </div>

              {isNegotiable && (
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-900">Rp</span>
                  <input
                    type="text"
                    value={hargaNegoMin}
                    onChange={(e) => handleHargaChange(e, setHargaNegoMin)}
                    placeholder="Batas Harga Nego (Opsional)"
                    className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                  />
                </div>
              )}
            </div>

            {/* Kondisi Akun & Kontak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Level / Rank Utama</label>
                <input
                  type="text"
                  value={kondisiRank}
                  onChange={(e) => setKondisiRank(e.target.value)}
                  placeholder="Cth: Mythic 50 Bintang"
                  className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Nomor WhatsApp Aktif</label>
                <input
                  type="text"
                  value={kontakWa}
                  onChange={(e) => setKontakWa(e.target.value)}
                  placeholder="Cth: 08123456789"
                  className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Deskripsi Detail</label>
              <textarea
                value={deskripsiDetail}
                onChange={(e) => setDeskripsiDetail(e.target.value)}
                placeholder="Jelaskan spesifikasi akun (Jumlah Skin, Hero, Winrate, dll)..."
                rows={5}
                className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#a855f7] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400 resize-none"
                required
              />
            </div>

            {/* Upload Screenshot */}
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Screenshot / Bukti Akun (Maks 10)</label>

              <div className="flex flex-wrap gap-4 mb-4">
                {gambarPreviews.map((preview, index) => (
                  <div key={index} className="relative w-24 h-24 border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[2px_2px_0px_#111827]">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGambar(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded border-2 border-gray-900"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {gambarFiles.length < 10 && (
                <div
                  className={`border-[3px] border-dashed rounded-xl p-6 text-center transition-colors relative cursor-pointer group ${isDragging ? 'border-[#ff90e8] bg-purple-50' : 'border-gray-900 bg-gray-50 hover:bg-purple-50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGambarChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className={`w-12 h-12 bg-white border-[3px] rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'border-[#ff90e8]' : 'border-gray-900 group-hover:border-[#ff90e8]'
                      }`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDragging ? '#a855f7' : '#111827'} strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="text-sm font-black text-gray-500 uppercase tracking-wider">
                      {isDragging ? 'Lepaskan Gambar Di Sini' : 'Pilih Atau Drag Screenshot'}
                    </p>
                    <p className="text-xs font-bold text-gray-400">Pilih hingga {10 - gambarFiles.length} gambar lagi</p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-500 text-white font-black text-sm py-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                'Posting Akun untuk Dijual'
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
