import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TopUpList from '@/components/ui/TopUpList'
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

        <TopUpList initialGames={games} />
      </main>

      <Footer />
    </div>
  )
}
