'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/lib/hooks/useAuth'
import { authFetch } from '@/lib/authApi'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

interface AccountListing {
  id: number
  nama_post: string
  slug: string
  harga_jual: string
  is_negotiable: boolean
  deskripsi_detail: string
  kondisi_akun: { rank?: string; level?: string }
  server_region: string
  status_listing: string
  tipe_transaksi: string
  view_count: number
  createdAt: string
  accountGame?: {
    id: number
    nama_game: string
    slug_game: string
    gambar_game: string
  }
  screenshots?: any[]
  reseller?: {
    id: number
    nama_lengkap: string
  }
}

export default function BeliAkunPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [listings, setListings] = useState<AccountListing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGame, setSelectedGame] = useState('all')
  const [gameList, setGameList] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: '12',
        })
        if (searchQuery) params.set('search', searchQuery)
        if (selectedGame !== 'all') params.set('game', selectedGame)

        const res = await authFetch(`/api-proxy/jual-beli-akun?${params.toString()}`)
        console.log('[BeliAkun] Fetch response status:', res.status)
        if (res.ok) {
          const data = await res.json()
          console.log('[BeliAkun] Data received:', data)
          setListings(data.data || [])
          setTotalPages(data.pagination?.totalPages || 1)
        }
      } catch (err) {
        console.error('Failed to fetch listings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [currentPage, searchQuery, selectedGame])

  // Fetch game list for filter
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { getGames } = await import('@/lib/gamesApi')
        const games = await getGames()
        setGameList(games)
      } catch (err) {
        console.error('Failed to fetch games:', err)
      }
    }
    fetchGames()
  }, [])

  // Extract first screenshot URL
  const getScreenshotUrl = (item: AccountListing): string => {
    if (!item.screenshots || item.screenshots.length === 0) {
      return item.accountGame?.gambar_game ? resolveImageUrl(item.accountGame.gambar_game) : ''
    }
    const first = item.screenshots[0]
    if (typeof first === 'string') return resolveImageUrl(first)
    if (first && typeof first === 'object' && first.url_gambar) return resolveImageUrl(first.url_gambar)
    return item.accountGame?.gambar_game ? resolveImageUrl(item.accountGame.gambar_game) : ''
  }

  // Filter
  const filteredListings = listings.filter(item => {
    const matchSearch = !searchQuery || 
      item.nama_post.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi_detail?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchGame = selectedGame === 'all' || String(item.accountGame?.id) === selectedGame
    return matchSearch && matchGame
  })

  const formatRupiah = (amount: string | number) => {
    return 'Rp ' + Number(amount).toLocaleString('id-ID')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 border-b-[4px] border-gray-900">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#ffc900] text-gray-900 font-black text-xs px-3 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase tracking-wider">
                🛒 Marketplace
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wide mb-2">
              Beli Akun Game
            </h1>
            <p className="text-white/80 font-bold text-sm md:text-base max-w-2xl">
              Temukan akun game impianmu dari reseller terpercaya. Semua akun sudah diverifikasi dan siap digunakan.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari akun game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-[3px] border-gray-900 rounded-xl font-bold text-sm shadow-[3px_3px_0px_#111827] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>
            {/* Game Filter */}
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="px-4 py-3.5 bg-white border-[3px] border-gray-900 rounded-xl font-black text-sm shadow-[3px_3px_0px_#111827] focus:outline-none min-w-[180px] uppercase"
            >
              <option value="all">Semua Game</option>
              {gameList.map(g => (
                <option key={g.id} value={g.id}>{g.nama_games || g.name}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Listings Grid */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border-[3px] border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#111827]">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase mb-1">Belum Ada Akun Tersedia</h3>
              <p className="text-sm font-bold text-gray-500">Coba ubah kata kunci pencarian atau filter game Anda.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-black text-gray-500 uppercase tracking-wider">
                  {filteredListings.length} akun ditemukan
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListings.map(item => {
                  const imgUrl = getScreenshotUrl(item)
                  return (
                    <Link
                      key={item.id}
                      href={`/accounts/${item.slug}`}
                      className="group bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_#111827] hover:shadow-[6px_6px_0px_#111827] hover:-translate-y-1 transition-all duration-200"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.nama_post}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {/* Game Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {item.accountGame?.nama_game || 'Game'}
                          </span>
                        </div>
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border-2 border-gray-900 shadow-[1px_1px_0px_#111827] ${
                            item.status_listing === 'sold' 
                              ? 'bg-red-400 text-white' 
                              : item.status_listing === 'pending'
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-green-400 text-gray-900'
                          }`}>
                            {item.status_listing === 'sold' ? 'Terjual' : item.status_listing === 'pending' ? 'Menunggu' : 'Tersedia'}
                          </span>
                        </div>
                        {/* Views */}
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {item.view_count} dilihat
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <p className="text-[11px] font-bold text-gray-400 mb-1">{formatDate(item.createdAt)}</p>
                        <h3 className="text-sm font-black text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                          {item.nama_post}
                        </h3>
                        <p className="text-lg font-black text-green-600 mb-2">
                          {formatRupiah(item.harga_jual)}
                        </p>
                        {item.is_negotiable && (
                          <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md border border-purple-300 uppercase">
                            Bisa Nego
                          </span>
                        )}
                        <p className="text-xs font-bold text-gray-500 line-clamp-2 mt-2">
                          {item.deskripsi_detail}
                        </p>

                        {/* Info Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.kondisi_akun?.rank && (
                            <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                              Rank: {item.kondisi_akun.rank}
                            </span>
                          )}
                          {item.server_region && (
                            <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                              {item.server_region}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl font-black text-sm shadow-[2px_2px_0px_#111827] hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 border-[3px] border-gray-900 rounded-xl font-black text-sm shadow-[2px_2px_0px_#111827] transition-all ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2.5 bg-white border-[3px] border-gray-900 rounded-xl font-black text-sm shadow-[2px_2px_0px_#111827] hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
