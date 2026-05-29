'use client'

import { useState } from 'react'
import GameCard from './GameCard'
import { GameListItem } from '@/lib/types'

interface Props {
  initialGames: GameListItem[]
}

export default function TopUpList({ initialGames }: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGames = initialGames.filter((game) => {
    const query = searchQuery.toLowerCase().trim()
    return (
      game.name.toLowerCase().includes(query) ||
      game.publisher.toLowerCase().includes(query) ||
      (game.category && game.category.toLowerCase().includes(query))
    )
  })

  return (
    <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[6px_6px_0px_#111827] md:shadow-[8px_8px_0px_#111827] relative">
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />
      
      {/* Search Bar */}
      <div className="mb-8 relative z-10">
        <div className="relative w-full max-w-md">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-bold">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="CARI GAME..."
            className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-12 py-3 sm:py-4 text-sm sm:text-base font-black uppercase tracking-wider focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white border-2 border-gray-900 rounded-full hover:bg-gray-100 transition-colors shadow-[1px_1px_0px_#111827] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Games grid or Empty State */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 relative z-10">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-[3px] border-dashed border-gray-900 rounded-xl bg-gray-50/50 relative z-10">
          <div className="w-16 h-16 bg-red-100 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0px_#111827] mb-4 rotate-3 shrink-0">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-wide">
            Game Tidak Ditemukan
          </h3>
          <p className="text-sm font-bold text-gray-500 text-center mb-6 max-w-xs">
            Maaf, tidak ada game yang cocok dengan pencarian "{searchQuery}". Coba masukkan nama game lain!
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg border-2 border-gray-900 shadow-[3px_3px_0px_#111827] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#111827] transition-all uppercase tracking-wide"
          >
            Reset Pencarian
          </button>
        </div>
      )}
    </div>
  )
}
