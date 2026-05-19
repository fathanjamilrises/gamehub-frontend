import { notFound } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TopUpClient from './TopUpClient'
import HowItWorks from '@/components/ui/HowItWorks'
import { getGameDetailBySlug } from '@/lib/gamesApi'
import { GameDetail } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function TopUpDetailPage({ params }: Props) {
  const { slug } = await params
  const game: GameDetail | null = await getGameDetailBySlug(slug)
  if (!game) notFound()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* ── Banner Game ── */}
      {game.image_url ? (
        // Mode dengan image
        <div className="relative w-full overflow-hidden border-b-2 border-gray-900" style={{ minHeight: '220px' }}>
          <Image
            src={game.image_url}
            alt={game.name}
            fill
            unoptimized
            className="object-cover"
            priority
          />
          {/* overlay gelap biar teks keliatan */}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-black/10" />
          {/* decorative large text */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
            <span
              className="font-bold text-white/10 leading-none tracking-tight"
              style={{ fontSize: 'clamp(60px, 12vw, 140px)' }}
            >
              {game.name}
            </span>
          </div>
          {/* content */}
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-10">
            <div className="inline-flex items-center gap-1.5 bg-yellow-300 border-2 border-gray-900 text-gray-900 text-xs font-bold px-3 py-1 rounded-md mb-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Instant Delivery
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">{game.name}</h1>
            <p className="text-white/70 text-sm">{game.publisher} • {game.category}</p>
          </div>
        </div>
      ) : (
        // Mode tanpa image - background putih, teks hitam
        <div className="relative w-full overflow-hidden bg-blue-50 border-b-2 border-gray-900" style={{ minHeight: '220px' }}>
          {/* decorative large text */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
            <span
              className="font-bold text-gray-200 leading-none tracking-tight"
              style={{ fontSize: 'clamp(60px, 12vw, 140px)' }}
            >
              {game.name}
            </span>
          </div>
          {/* content */}
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-10">
            <div className="inline-flex items-center gap-1.5 bg-yellow-300 border-2 border-gray-900 text-gray-900 text-xs font-bold px-3 py-1 rounded-md mb-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Instant Delivery
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">{game.name}</h1>
            <p className="text-gray-500 text-sm">{game.publisher} • {game.category}</p>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-10 w-full flex flex-col gap-14">
        <TopUpClient game={game} />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  )
}
