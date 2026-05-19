import Link from 'next/link'
import Image from 'next/image'

// Only pick fields needed for display (no nominals required)
interface GameCardGame {
  id: string
  slug: string
  name: string
  publisher: string
  badge: string
  image_url: string
}

interface Props {
  game: GameCardGame
  href?: string
}

// Fallback gradient colors jika tidak ada image
const gameCharColors: Record<string, { bg: string; accent: string }> = {
  'mobile-legends': { bg: '#0f2d5e', accent: '#1d6fe8' },
  'free-fire':      { bg: '#3d1203', accent: '#e85c1d' },
  'pubg-mobile':    { bg: '#111827', accent: '#6b7280' },
  'genshin-impact': { bg: '#2e1065', accent: '#7c3aed' },
  'valorant':       { bg: '#2d0a0a', accent: '#dc2626' },
  'honor-of-kings': { bg: '#3d1f03', accent: '#d97706' },
}

export default function GameCard({ game, href }: Props) {
  const colors = gameCharColors[game.slug] ?? { bg: '#1e293b', accent: '#3b82f6' }
  const link = href ?? `/topup/${game.slug}`
  const hasImage = game.image_url && game.image_url.trim() !== ''

  return (
    <Link href={link} className="block group">
      <div className="relative rounded-xl overflow-hidden aspect-[4/5] border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] transition-all duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0px_#ff90e8]">
        {/* Background: Image jika ada, fallback ke gradient */}
        {hasImage ? (
          <Image
            src={game.image_url}
            alt={game.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent}88 100%)` }}
          />
        )}

        {/* Character silhouette area — decorative shapes (fallback only) */}
        {!hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3/4 h-3/4 rounded-full opacity-20"
              style={{ background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)` }}
            />
          </div>
        )}

        {/* Game logo text overlay (fallback only) */}
        {!hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <div
                className="text-2xl font-black text-white/20 leading-none uppercase text-center tracking-tight"
                style={{ fontSize: 'clamp(10px, 3vw, 18px)' }}
              >
                {game.name}
              </div>
            </div>
          </div>
        )}

        {/* Overlay gradient bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badge Instant */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 bg-[#ffc900] text-gray-900 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border-[3px] border-gray-900 uppercase tracking-widest shadow-[2px_2px_0px_#111827]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 border-2 border-gray-900 inline-block animate-pulse" />
            {game.badge}
          </span>
        </div>

        {/* Info bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white font-black text-sm leading-tight truncate drop-shadow-[2px_2px_0_#111827] uppercase tracking-wide">
            {game.name}
          </p>
          <p className="text-yellow-300 font-bold text-[10px] mt-0.5 drop-shadow-[1px_1px_0_#111827] uppercase tracking-widest">
            {game.publisher}
          </p>
        </div>
      </div>
    </Link>
  )
}
