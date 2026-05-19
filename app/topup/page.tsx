import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GameCard from '@/components/ui/GameCard'
import { getGames } from '@/lib/gamesApi'
import { GameListItem } from '@/lib/types'

export default async function TopUpPage() {
  const games: GameListItem[] = await getGames()
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            INSTANT TOP UP
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 uppercase tracking-tight">Pilih Game<br className="hidden sm:block" /> untuk Top Up</h1>
          <p className="text-gray-600 font-bold text-xs sm:text-sm md:text-base border-l-[4px] border-[#ff90e8] pl-3 py-1">Proses 1-5 menit, aman dan langsung masuk ke akunmu.</p>
        </div>

        <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[6px_6px_0px_#111827] md:shadow-[8px_8px_0px_#111827] relative">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />
          
          {/* Search */}
          <div className="mb-8 relative z-10">
            <div className="relative w-full max-w-md">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-bold">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="CARI GAME..."
                className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base font-black uppercase tracking-wider focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Games grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 relative z-10">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
