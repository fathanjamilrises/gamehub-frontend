import Link from 'next/link'
import Image from 'next/image'
import { GameListItem } from '@/lib/types'

interface CategoryGridProps {
  topUpGames: GameListItem[]
}

export default function CategoryGrid({ topUpGames }: CategoryGridProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-600 border-[3px] border-gray-900 rounded-md nb-shadow-sm text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Top Up Game</h3>
        </div>
        <Link 
          href="/topup" 
          className="text-xs font-black text-gray-900 bg-white border-[3px] border-gray-900 px-4 py-2 rounded-md transition-all nb-shadow-sm hover:-translate-y-0.5 active:translate-y-0"
        >
          LIHAT SEMUA <span className="ml-1">›</span>
        </Link>
      </div>
      
      <div className="bg-white border-[3px] border-gray-900 p-5 md:p-7 rounded-xl nb-shadow-lg relative overflow-hidden group/box">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-y-6 gap-x-3 md:gap-x-4 relative z-10">
          {topUpGames.slice(0, 10).map((game) => (
            <Link key={game.id} href={`/topup/${game.slug}`} className="group flex flex-col items-center gap-2.5">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border-[3px] border-gray-900 nb-shadow-sm group-hover:shadow-[4px_4px_0px_#1e293b] transition-all duration-200 bg-white group-hover:-translate-y-1">
                <Image
                  src={game.image_url}
                  alt={game.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <span className="text-[10px] md:text-[11px] font-black text-gray-900 text-center leading-tight line-clamp-2 px-1 uppercase">
                {game.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
