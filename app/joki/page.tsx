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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            JASA JOKI PRO
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 uppercase tracking-tight">Pilih Game<br className="hidden sm:block" /> untuk Dijoki</h1>
          <p className="text-gray-600 font-bold text-xs sm:text-sm md:text-base border-l-[4px] border-[#ff90e8] pl-3 py-1">Serahkan akunmu pada ahlinya, aman, cepat, dan terpercaya.</p>
        </div>

        <JokiClient initialGames={games} />

        {/* Become Worker CTA Banner */}
        <div className="mt-12 bg-cyan-300 border-[3px] border-gray-900 rounded-2xl p-6 sm:p-8 md:p-10 shadow-[8px_8px_0px_#111827] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#ff90e8]/20 rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <span className="inline-block bg-[#ffc900] border-2 border-gray-900 px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_#111827] -rotate-1 mb-4">
              Cari Penghasilan Tambahan? 🎮
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight mb-3">
              Punya Skill Dewa? Gabung Jadi Worker!
            </h2>
            <p className="text-gray-900 font-bold text-xs sm:text-sm leading-relaxed">
              Jadilah bagian dari pro player GameHub.ID. Kerjakan pesanan joki, tentukan tarifmu sendiri, dan dapatkan penghasilan dari hobi bermain game kamu!
            </p>
          </div>
          
          <div className="relative z-10 shrink-0">
            <Link 
              href="/joki/worker"
              className="inline-block bg-white text-gray-900 font-black uppercase text-sm sm:text-base px-6 py-3.5 border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all text-center"
            >
              Daftar Jadi Worker Now &rarr;
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
