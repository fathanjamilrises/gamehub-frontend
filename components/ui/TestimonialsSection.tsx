'use client'

import { useState, useEffect, useRef } from 'react'

const testimonials = [
  {
    name: 'Rizky A.',
    game: 'Mobile Legends',
    text: 'Top up diamond cepat banget! Belum 1 menit udah masuk. Harga juga paling murah dibanding yang lain.',
    rating: 5,
    avatar: 'R',
    color: 'bg-blue-600',
  },
  {
    name: 'Sarah M.',
    game: 'Genshin Impact',
    text: 'Pertama kali beli di sini langsung ketagihan. Prosesnya smooth dan customer service ramah. Recommended!',
    rating: 5,
    avatar: 'S',
    color: 'bg-[#ff90e8]',
  },
  {
    name: 'Dimas P.',
    game: 'Valorant',
    text: 'Harga VP di sini paling bersaing. Udah berkali-kali top up dan selalu lancar. Mantap!',
    rating: 5,
    avatar: 'D',
    color: 'bg-green-500',
  },
  {
    name: 'Anisa R.',
    game: 'Free Fire',
    text: 'Awalnya ragu, tapi ternyata beneran instan! Diamond langsung masuk. Bakal langganan di sini.',
    rating: 4,
    avatar: 'A',
    color: 'bg-[#ffc900]',
  },
  {
    name: 'Bayu K.',
    game: 'PUBG Mobile',
    text: 'Proses cepat, pembayaran mudah, dan ada banyak pilihan metode bayar. Top dah pokoknya!',
    rating: 5,
    avatar: 'B',
    color: 'bg-purple-500',
  },
  {
    name: 'Putri W.',
    game: 'Honkai Star Rail',
    text: 'Suka banget sama desain webnya, gampang dipake. Top up Oneiric Shard selalu lancar di sini.',
    rating: 5,
    avatar: 'P',
    color: 'bg-cyan-500',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i < count ? '#ffc900' : 'none'}
          stroke={i < count ? '#111827' : '#d1d5db'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = 320
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-green-500 border-[3px] border-gray-900 rounded-xl nb-shadow-sm text-white rotate-3 shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 md:w-6 md:h-6">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
              Testimoni
            </h2>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Apa kata mereka</p>
          </div>
        </div>
        
        {/* Navigation arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-10 h-10 border-[3px] border-gray-900 rounded-xl flex items-center justify-center transition-all ${
              canScrollLeft
                ? 'bg-white shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px]'
                : 'bg-gray-100 opacity-40 cursor-not-allowed shadow-none'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-10 h-10 border-[3px] border-gray-900 rounded-xl flex items-center justify-center transition-all ${
              canScrollRight
                ? 'bg-white shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px]'
                : 'bg-gray-100 opacity-40 cursor-not-allowed shadow-none'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="group min-w-[260px] sm:min-w-[280px] md:min-w-[300px] bg-white border-[3px] border-gray-900 rounded-2xl p-4 md:p-5 shadow-[5px_5px_0px_#111827] hover:shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 relative overflow-hidden snap-center shrink-0"
          >
            {/* Quote decoration */}
            <div className="absolute top-3 right-4 text-5xl font-black text-gray-100 select-none leading-none pointer-events-none">"</div>

            {/* Rating */}
            <Stars count={t.rating} />

            {/* Text */}
            <p className="text-sm font-bold text-gray-700 leading-relaxed mt-3 mb-5 relative z-10 line-clamp-3">
              "{t.text}"
            </p>

            {/* User info */}
            <div className="flex items-center gap-3 pt-4 border-t-[3px] border-gray-900">
              <div className={`w-10 h-10 ${t.color} border-[3px] border-gray-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#111827] text-white font-black text-sm -rotate-3 group-hover:rotate-3 transition-transform`}>
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-wide">{t.name}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.game}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
