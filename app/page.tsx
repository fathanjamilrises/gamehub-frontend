import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GameCard from '@/components/ui/GameCard'
import { GameListItem } from '@/lib/api'
import { gameService } from '@/lib/services/gameService'

async function getGames(): Promise<GameListItem[]> {
  return gameService.getAllGames()
}

export default async function HomePage() {
  const games = await getGames()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50 pt-16 pb-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            TERPERCAYA SEJAK 2020 • 500.000+ TRANSAKSI
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-4">
            Top Up &amp; Upgrade<br />
            <span className="text-blue-600">Game</span><br />
            <span className="text-blue-600">Favoritmu</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg mb-10">
            Diamond, UC, Genesis Crystal, akun game langka, hingga jasa joki rank profesional — semuanya tersedia dalam satu platform. Proses cepat, harga terbaik, aman 100%.
          </p>
          <div className="flex items-center gap-4 mb-10">
            <Link href="/topup" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Top Up Sekarang
            </Link>
            <Link href="#" className="inline-flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm bg-white">
              Lihat Jasa Joki →
            </Link>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z', color: '#2563EB', label: 'Proses 1-5 menit' },
              { icon: 'M20 6 9 17 4 12', color: '#16a34a', label: '100% Aman & Legal' },
              { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', color: '#2563EB', label: 'Pro player bersertifikat' },
            ].map((i) => (
              <div key={i.label} className="flex items-center gap-2 text-gray-500 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={i.color} strokeWidth="2.5"><path d={i.icon}/></svg>
                {i.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service cards */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Top Up Game', desc: 'Beli Diamond, UC, VP & Genesis Crystal instant', link: '/topup', path: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z' },
            { title: 'Beli Akun Game', desc: 'Akun sultan, skin langka, rank tinggi, harga miring', link: '#', path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
            { title: 'Jasa Joki Rank', desc: 'Push rank, winrate, & achievement oleh pro player', link: '#', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d={item.path}/></svg>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">{item.desc}</p>
              <Link href={item.link} className="inline-flex items-center gap-1 text-sm text-gray-700 font-medium hover:text-blue-600 transition-colors">
                Jelajahi <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Games */}
      <section className="w-full px-6 lg:px-8 mt-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#2563EB"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              PALING POPULER
            </div>
            <h2 className="text-2xl font-black text-gray-900">Top Up Semua Game Favorit</h2>
          </div>
          <Link href="/topup" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Lihat semua <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {games.map((game) => (<GameCard key={game.id} game={game} />))}
        </div>
      </section>

      {/* Stats */}
      <section className="w-full px-6 lg:px-8 mt-20">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { value: '500K+', label: 'Transaksi sukses', blue: true },
              { value: '50+', label: 'Game tersedia', blue: false },
              { value: '4.9★', label: 'Rating pelanggan', blue: false },
              { value: '24/7', label: 'Customer support', blue: false },
            ].map((s) => (
              <div key={s.label} className="py-10 px-8 text-center">
                <p className={`text-4xl font-black mb-2 ${s.blue ? 'text-blue-600' : 'text-gray-900'}`}>{s.value}</p>
                <p className="text-gray-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
