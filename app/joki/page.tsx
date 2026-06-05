import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import JokiClient from '@/components/ui/JokiClient'
import { getGames } from '@/lib/gamesApi'
import { GameListItem } from '@/lib/types'
import Link from 'next/link'

export default async function JokiPage() {
  const games: GameListItem[] = await getGames()
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow flex flex-col gap-10 sm:gap-16 pt-6 sm:pt-10 pb-16 sm:pb-24">
        {/* ── Hero Section ── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] border-[3px] border-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-[4px_4px_0px_#111827] sm:shadow-[8px_8px_0px_#111827]">
            {/* Decorative shapes */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#ff90e8]/20 rounded-full" />
            <div className="absolute top-1/2 right-[10%] w-20 h-20 bg-[#ffc900]/15 rounded-full hidden lg:block" />
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-14 sm:h-14 bg-[#ffc900] border-2 sm:border-[3px] border-gray-900 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.3)] sm:shadow-[3px_3px_0px_rgba(0,0,0,0.3)] rotate-6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3" className="sm:w-6 sm:h-6">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            
            <div className="relative px-5 py-8 sm:px-10 sm:py-14 md:px-16 md:py-20">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-md border border-white/30 uppercase tracking-widest mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffc900] animate-pulse" />
                Jasa Joki Profesional
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.05] mb-3 sm:mb-4 max-w-2xl">
                Level Up<br />Tanpa Ribet
              </h1>
              <p className="text-white/70 text-xs sm:text-base md:text-lg font-bold max-w-lg mb-5 sm:mb-8">
                Serahkan akunmu pada pro player terpercaya. Aman, cepat, dan bergaransi 100%.
              </p>
              
              {/* Quick Stats */}
              {/* Quick Stats - horizontal scroll on mobile */}
              <div className="flex gap-2.5 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide">
                <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-[120px] sm:min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#ffc900] border-2 border-gray-900 rounded-md sm:rounded-lg flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3" className="sm:w-4 sm:h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm sm:text-lg leading-none">100%</p>
                    <p className="text-white/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Aman</p>
                  </div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-[120px] sm:min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#ff90e8] border-2 border-gray-900 rounded-md sm:rounded-lg flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3" className="sm:w-4 sm:h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm sm:text-lg leading-none">Fast</p>
                    <p className="text-white/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Delivery</p>
                  </div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-[120px] sm:min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#90e0ff] border-2 border-gray-900 rounded-md sm:rounded-lg flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3" className="sm:w-4 sm:h-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm sm:text-lg leading-none">Garansi</p>
                    <p className="text-white/60 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Uang Kembali</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#ffc900] border-[3px] border-gray-900 rounded-lg sm:rounded-xl nb-shadow-sm text-gray-900 -rotate-3 shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
                Cara Kerja
              </h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Mudah &bull; Cepat &bull; Aman</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { step: '01', title: 'Pilih Game', desc: 'Pilih game yang ingin kamu jokiin dari daftar yang tersedia.', color: 'bg-[#ffc900]', icon: '🎮' },
              { step: '02', title: 'Pilih Worker', desc: 'Lihat profil, rating, dan harga dari worker pro kami.', color: 'bg-[#ff90e8]', icon: '👤' },
              { step: '03', title: 'Isi Data Akun', desc: 'Masukkan detail akun game kamu dengan aman dan terenkripsi.', color: 'bg-[#90e0ff]', icon: '🔐' },
              { step: '04', title: 'Bayar & Selesai', desc: 'Lakukan pembayaran dan worker akan langsung mulai bekerja.', color: 'bg-[#b8ff90]', icon: '✅' },
            ].map((item) => (
              <div
                key={item.step}
                className={`${item.color} border-[3px] border-gray-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-[3px_3px_0px_#111827] sm:shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:-translate-y-1 hover:shadow-[5px_5px_0px_#111827] sm:hover:shadow-[6px_6px_0px_#111827] transition-all duration-200`}
              >
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-black/5 rounded-full" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-3xl">{item.icon}</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-gray-900/40 uppercase tracking-widest">{item.step}</span>
                  </div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight text-xs sm:text-sm mb-0.5 sm:mb-1">{item.title}</h3>
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-900/60 leading-relaxed line-clamp-3">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Game Selection & Order Flow ── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-blue-600 border-[3px] border-gray-900 rounded-lg sm:rounded-xl nb-shadow-sm text-white rotate-3 shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
                Pilih Game
              </h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Temukan game favoritmu</p>
            </div>
          </div>

          <JokiClient initialGames={games} />
        </section>

        {/* ── Become Worker CTA Banner ── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-cyan-400 via-cyan-300 to-[#90e0ff] border-[3px] border-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-[4px_4px_0px_#111827] sm:shadow-[8px_8px_0px_#111827]">
            {/* Decorative shapes */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#ff90e8]/15 rounded-full" />
            <div className="absolute top-6 right-6 w-14 h-14 bg-[#ffc900] border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,0.3)] -rotate-6 hidden sm:flex">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            
            <div className="relative px-5 py-8 sm:px-10 sm:py-14 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-8">
              <div className="max-w-xl text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 bg-gray-900/10 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-md border-2 border-gray-900 uppercase tracking-widest mb-4 shadow-[2px_2px_0px_#111827] -rotate-1">
                  🎮 Cari Penghasilan Tambahan?
                </span>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight leading-[1.05] mb-2 sm:mb-3">
                  Punya Skill Dewa?<br />Gabung Jadi Worker!
                </h2>
                <p className="text-gray-900/70 font-bold text-xs sm:text-sm leading-relaxed max-w-md">
                  Jadilah bagian dari pro player GameHub.ID. Kerjakan pesanan joki, tentukan tarifmu sendiri, dan dapatkan penghasilan dari hobi bermain game kamu!
                </p>
              </div>
              
              <div className="shrink-0 w-full md:w-auto">
                <Link 
                  href="/joki/worker"
                  className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-gray-900 text-white font-black uppercase text-xs sm:text-sm md:text-base px-6 sm:px-8 py-3.5 sm:py-4 border-[3px] border-gray-900 rounded-xl shadow-[3px_3px_0px_#2563eb] sm:shadow-[4px_4px_0px_#2563eb] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#2563eb] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Daftar Jadi Worker
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
