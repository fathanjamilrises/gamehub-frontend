import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GameCard from '@/components/ui/GameCard'
import { GameListItem } from '@/lib/api'
import { gameService } from '@/lib/services/gameService'

async function getGames(): Promise<GameListItem[]> {
  return gameService.getAllGames()
}

export default async function TopUpPage() {
  const games = await getGames()
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#2563EB">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            INSTANT TOP UP
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Pilih Game untuk Top Up</h1>
          <p className="text-gray-500 text-sm">Proses 1-5 menit, aman dan langsung masuk ke akunmu.</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative w-full max-w-sm">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari game..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Games grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
