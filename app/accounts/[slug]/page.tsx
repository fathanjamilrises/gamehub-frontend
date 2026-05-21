'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { authFetch } from '@/lib/authApi'
import { chatApi } from '@/lib/chatApi'
import { useCart } from '@/lib/contexts/CartContext'
import { useToast } from '@/lib/contexts/ToastContext'
import { useAuth } from '@/lib/hooks/useAuth'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

function formatRupiah(amount: string | number) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID')
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

export default function AccountDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [similarListings, setSimilarListings] = useState<any[]>([])
  
  const { addToCart } = useCart()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const [addingToCart, setAddingToCart] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [startingChat, setStartingChat] = useState(false)

  const handleChat = async () => {
    if (!listing) return
    if (!isAuthenticated) {
      toast('Silakan login terlebih dahulu untuk chat dengan penjual', 'error')
      return
    }
    setStartingChat(true)
    try {
      const room = await chatApi.openRoom(listing.id)
      router.push(`/chat/${room.id}`)
    } catch (err: any) {
      toast(err.message || 'Gagal memulai chat', 'error')
    } finally {
      setStartingChat(false)
    }
  }

  const handleAddToCart = async () => {
    if (!listing) return
    if (!isAuthenticated) {
      toast('Silakan login terlebih dahulu untuk menambahkan ke keranjang', 'error')
      return
    }
    
    // Listing id should be an integer
    const idListing = parseInt(listing.id)
    if (isNaN(idListing)) {
      toast('Item tidak valid untuk dimasukkan ke keranjang', 'error')
      return
    }

    setAddingToCart(true)
    try {
      await addToCart({
        item_type: 'akun',
        id_listing: idListing,
        catatan: catatan
      })
    } catch (err) {
      // Error handled by CartContext
    } finally {
      setAddingToCart(false)
    }
  }

  useEffect(() => {
    if (!slug) return
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const res = await authFetch(`/api-proxy/jual-beli-akun/${slug}`)
        if (res.ok) {
          const data = await res.json()
          const item = data.data || data
          setListing(item)

          let imgs: string[] = []
          const raw = item.screenshots
          if (raw) {
            let parsed: any[] = []
            if (typeof raw === 'string') { try { parsed = JSON.parse(raw) } catch {} }
            else if (Array.isArray(raw)) parsed = raw
            imgs = parsed.map((sc: any) => {
              if (typeof sc === 'string') return resolveImageUrl(sc)
              if (sc?.url_gambar) return resolveImageUrl(sc.url_gambar)
              return ''
            }).filter(Boolean)
          }
          if (imgs.length === 0 && item.accountGame?.gambar_game) {
            imgs = [resolveImageUrl(item.accountGame.gambar_game)]
          }
          setScreenshots(imgs)

          // Fetch similar
          try {
            const simRes = await authFetch(`/api-proxy/jual-beli-akun?limit=6`)
            if (simRes.ok) {
              const simData = await simRes.json()
              setSimilarListings((simData.data || []).filter((s: any) => s.slug !== slug).slice(0, 4))
            }
          } catch {}
        }
      } catch (err) {
        console.error('Failed to fetch detail:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [slug])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="font-black text-gray-900 uppercase tracking-wider text-sm">Memuat detail...</p>
          </div>
        </main>
      </>
    )
  }

  if (!listing) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#111827]">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
            </div>
            <h2 className="text-xl font-black text-gray-900 uppercase">Listing Tidak Ditemukan</h2>
            <Link href="/accounts" className="inline-block bg-blue-600 text-white font-black text-sm px-6 py-3 rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] uppercase">← Kembali</Link>
          </div>
        </main>
      </>
    )
  }

  const kondisi = listing.kondisi_akun || {}
  const kontak = listing.metode_kontak || {}
  const reseller = listing.reseller || listing.user || {}

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-100">
        {/* Breadcrumb */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-2 text-xs font-bold text-gray-400 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-blue-600">Beranda</Link>
            <span>›</span>
            <Link href="/accounts" className="hover:text-blue-600">Beli Akun</Link>
            <span>›</span>
            <span className="text-gray-700 truncate max-w-[300px]">{listing.nama_post}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ===== LEFT COLUMN (Images + Desc + Seller + Guide) ===== */}
            <div className="lg:col-span-8 space-y-6">

              {/* Image Gallery */}
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[5px_5px_0px_#111827]">
                <div className="relative bg-gray-900 flex items-center justify-center" style={{ minHeight: 380 }}>
                  {screenshots.length > 0 ? (
                    <img src={screenshots[activeImg]} alt={listing.nama_post} className="max-h-[420px] w-full object-contain" />
                  ) : (
                    <div className="py-20 text-center">
                      <svg className="w-16 h-16 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-gray-500 font-bold text-sm mt-2">Tidak ada gambar</p>
                    </div>
                  )}
                  {screenshots.length > 1 && (
                    <>
                      <button onClick={() => setActiveImg(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border-2 border-gray-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827] hover:bg-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={() => setActiveImg(i => Math.min(screenshots.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 border-2 border-gray-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827] hover:bg-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    {listing.view_count || 0} dilihat
                  </div>
                </div>
                {screenshots.length > 1 && (
                  <div className="flex gap-2 p-3 border-t-[3px] border-gray-900 bg-white overflow-x-auto">
                    {screenshots.map((img, i) => (
                      <button key={i} onClick={() => setActiveImg(i)} className={`w-[72px] h-[52px] rounded-lg overflow-hidden border-[3px] shrink-0 transition-all ${i === activeImg ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-200 opacity-50 hover:opacity-100'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Description */}
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[5px_5px_0px_#111827] overflow-hidden">
                <div className="px-6 py-4 border-b-[3px] border-gray-900 bg-gray-50">
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">📋 Deskripsi Produk</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {listing.deskripsi_detail || 'Tidak ada deskripsi.'}
                  </p>
                </div>
              </div>

              {/* Seller Profile Card */}
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[5px_5px_0px_#111827] overflow-hidden">
                <div className="px-6 py-4 border-b-[3px] border-gray-900 bg-gray-50">
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">🏪 Profil Penjual</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_#111827] shrink-0">
                      <span className="text-white font-black text-2xl">
                        {(reseller.nama_lengkap || reseller.username || reseller.name || 'R').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-gray-900">{reseller.nama_lengkap || reseller.username || reseller.name || 'Reseller'}</h3>
                        <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-green-500 uppercase">✓ Verified</span>
                      </div>
                      <p className="text-xs font-bold text-gray-400 mt-1">
                        Bergabung {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {[
                      { label: 'Produk', value: '—', icon: '📦' },
                      { label: 'Terjual', value: '—', icon: '✅' },
                      { label: 'Rating', value: '—', icon: '⭐' },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-lg font-black text-gray-900">{s.icon} {s.value}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Similar Listings */}
              {similarListings.length > 0 && (
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[5px_5px_0px_#111827] overflow-hidden">
                  <div className="px-6 py-4 border-b-[3px] border-gray-900 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">🔥 Tawaran Serupa</h2>
                    <Link href="/accounts" className="text-xs font-black text-blue-600 hover:underline uppercase">Lihat Semua →</Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                    {similarListings.map((item, i) => {
                      const img = item.screenshots?.[0]?.url_gambar ? resolveImageUrl(item.screenshots[0].url_gambar) : item.accountGame?.gambar_game ? resolveImageUrl(item.accountGame.gambar_game) : ''
                      return (
                        <Link key={item.id} href={`/accounts/${item.slug}`} className={`group p-4 hover:bg-blue-50 transition-colors ${i < similarListings.length - 1 ? 'border-r-2 border-gray-200' : ''}`}>
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 mb-2">
                            {img ? <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg></div>}
                          </div>
                          <p className="text-xs font-black text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.nama_post}</p>
                          <p className="text-sm font-black text-green-600 mt-1">{formatRupiah(item.harga_jual)}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">{item.accountGame?.nama_game}</p>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ===== RIGHT SIDEBAR (Order Info + Guide) ===== */}
            <div className="lg:col-span-4 space-y-6">
              {/* Order Card - Sticky */}
              <div className="sticky top-20 space-y-6">

                {/* Informasi Pesanan */}
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[5px_5px_0px_#111827] overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 border-b-[3px] border-gray-900">
                    <h2 className="text-base font-black text-gray-900 italic">Informasi Pesanan</h2>
                  </div>

                  {/* Catatan */}
                  <div className="px-5 pt-5 pb-3">
                    <label className="text-xs font-bold text-gray-500 mb-2 block">Catatan untuk Penjual (Optional)</label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Tulis catatan..."
                      rows={3}
                      className="w-full border-[3px] border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-500 resize-none placeholder:text-gray-300"
                    />
                  </div>

                  {/* Stok */}
                  <div className="px-5 py-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-blue-600">Stok: <span className="font-black">1</span></p>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 bg-gray-200 border-2 border-gray-900 rounded-full flex items-center justify-center font-black text-gray-500 text-lg shadow-[1px_1px_0px_#111827] cursor-not-allowed opacity-50">−</button>
                      <span className="w-10 text-center font-black text-gray-900">1</span>
                      <button className="w-8 h-8 bg-blue-600 border-2 border-gray-900 rounded-full flex items-center justify-center font-black text-white text-lg shadow-[1px_1px_0px_#111827] cursor-not-allowed opacity-50">+</button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-5 border-t-2 border-gray-200" />

                  {/* Detail Spesifikasi */}
                  <div className="px-5 py-3 space-y-2">
                    {[
                      { l: 'Game', v: listing.accountGame?.nama_game },
                      { l: 'Server', v: listing.server_region },
                      { l: 'Rank', v: kondisi.rank },
                      { l: 'Level', v: kondisi.level },
                      { l: 'Tipe', v: listing.tipe_transaksi === 'jual' ? 'Dijual' : listing.tipe_transaksi },
                    ].filter(d => d.v).map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400">{d.l}</span>
                        <span className="text-xs font-black text-gray-900">{d.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Nego Badge */}
                  {listing.is_negotiable && (
                    <div className="px-5 pb-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="nego" className="w-4 h-4 accent-blue-600 border-2 border-gray-900 rounded" />
                        <label htmlFor="nego" className="text-xs font-bold text-gray-700">Ambil Penawaran Nego</label>
                      </div>
                      {listing.harga_nego_min && (
                        <p className="text-[10px] font-bold text-gray-400 ml-6 mt-0.5">Min. nego: {formatRupiah(listing.harga_nego_min)}</p>
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="mx-5 border-t-2 border-gray-200" />

                  {/* Subtotal */}
                  <div className="px-5 py-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-500">Subtotal</p>
                      <p className="text-2xl font-black text-blue-600">{formatRupiah(listing.harga_jual)}</p>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="mx-5 my-3 bg-blue-50 border-2 border-blue-200 rounded-xl px-3.5 py-2.5 flex gap-2 items-start">
                    <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    <p className="text-[11px] font-bold text-blue-700 leading-relaxed">Wajib update info login akun setelah beli. <a href="#panduan" className="text-blue-600 underline font-black">Pelajari</a></p>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="px-5 pb-5 flex gap-2">
                    {/* Chat */}
                    <button
                      onClick={handleChat}
                      disabled={startingChat}
                      className="w-12 h-12 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111827] transition-all shrink-0 disabled:opacity-50"
                      title="Chat Penjual"
                    >
                      {startingChat ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      )}
                    </button>
                    {/* Tambah Keranjang */}
                    <button 
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="flex-1 h-12 bg-white text-gray-700 font-black text-[10px] sm:text-xs rounded-xl border-[3px] border-gray-900 shadow-[2px_2px_0px_#111827] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#111827] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {addingToCart ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      )}
                      Keranjang
                    </button>
                    {/* Beli Langsung */}
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast('Silakan login terlebih dahulu untuk membeli akun', 'error')
                          return
                        }
                        router.push(`/checkout/akun/${slug}`)
                      }}
                      className="flex-[1.5] h-12 bg-blue-600 text-white font-black text-[10px] sm:text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111827] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Beli Sekarang
                    </button>
                  </div>

                  {/* Trade Guard */}
                  <div className="px-5 pb-5 text-center">
                    <p className="text-xs font-bold text-gray-500">Pembayaran Aman 100% Dijamin oleh</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-sm font-black text-blue-600">GameHub Guard</span>
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                  </div>
                </div>

                {/* Buying Guide */}
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[5px_5px_0px_#111827] overflow-hidden">
                  <div className="px-5 py-4 border-b-[3px] border-gray-900 bg-gray-50">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">📖 Panduan Membeli</h2>
                  </div>
                  <div className="p-5">
                    <ol className="space-y-3">
                      {[
                        { icon: '🔍', text: 'Periksa detail akun dengan teliti (rank, level, server).' },
                        { icon: '💬', text: 'Hubungi penjual via WhatsApp untuk negosiasi harga.' },
                        { icon: '🤝', text: 'Sepakati harga dan metode pembayaran yang aman.' },
                        { icon: '🎮', text: 'Minta penjual demo akun secara live.' },
                        { icon: '💳', text: 'Lakukan pembayaran setelah verifikasi selesai.' },
                        { icon: '🔑', text: 'Minta ganti email & password ke milik Anda.' },
                        { icon: '✅', text: 'Konfirmasi transaksi selesai di GameHub.' },
                      ].map((step, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="w-7 h-7 bg-blue-600 text-white text-[10px] font-black rounded-lg flex items-center justify-center shrink-0 border-2 border-gray-900 shadow-[1px_1px_0px_#111827]">{i + 1}</span>
                          <div>
                            <span className="text-xs font-bold text-gray-700 leading-relaxed">{step.icon} {step.text}</span>
                          </div>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-5 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3.5">
                      <p className="text-[10px] font-black text-yellow-800 uppercase mb-1">⚠️ Peringatan Keamanan</p>
                      <p className="text-[11px] font-bold text-yellow-700 leading-relaxed">Jangan pernah membayar sebelum memverifikasi akun. GameHub.ID tidak bertanggung jawab atas transaksi di luar platform.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
