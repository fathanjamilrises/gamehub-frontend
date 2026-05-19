import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BannerSlider from '@/components/ui/BannerSlider'
import CategoryGrid from '@/components/ui/CategoryGrid'
import BentoGrid from '@/components/ui/BentoGrid'
import TestimonialsSection from '@/components/ui/TestimonialsSection'
import { getGames } from '@/lib/gamesApi'
import { GameListItem } from '@/lib/types'

export default async function HomePage() {
  const games: GameListItem[] = await getGames()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-grow flex flex-col gap-16 pt-10 pb-24">
        {/* Banner Section */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <BannerSlider />
        </section>

        {/* Top Up Games Section */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <CategoryGrid topUpGames={games} />
        </section>

        {/* Bento Grid — CTAs, Stats, Features */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <BentoGrid />
        </section>

        {/* Testimonials */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <TestimonialsSection />
        </section>
      </main>

      <Footer />
    </div>
  )
}
