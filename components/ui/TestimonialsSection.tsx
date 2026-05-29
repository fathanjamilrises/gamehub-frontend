'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MotionSection, slideInLeft } from './MotionWrapper'

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
  const [isHovered, setIsHovered] = useState(false)

  const doubledTestimonials = [...testimonials, ...testimonials, ...testimonials] // Triple it to ensure it loops seamlessly on all screen sizes

  const isPaused = isHovered

  return (
    <MotionSection>
      <div className="flex flex-col gap-6">
        <style>{`
          @keyframes marquee-scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-33.3333%);
            }
          }
          .marquee-container {
            overflow: hidden;
            width: 100%;
            position: relative;
            mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee-scroll 45s linear infinite;
          }
          .marquee-track-paused {
            animation-play-state: paused;
          }
        `}</style>

        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          variants={slideInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-green-500 border-[3px] border-gray-900 rounded-xl nb-shadow-sm text-white rotate-3 shrink-0"
              whileHover={{ rotate: -6, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5 md:w-6 md:h-6">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
                Testimoni
              </h2>
              <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Apa kata mereka</p>
            </div>
          </div>
        </motion.div>

        {/* Infinite Scroll Marquee */}
        <motion.div
          className="marquee-container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div 
            className={`marquee-track ${isPaused ? 'marquee-track-paused' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {doubledTestimonials.map((t, i) => (
              <div
                key={i}
                className="px-3 shrink-0"
                style={{ width: '310px' }}
              >
                <div className="group h-full bg-white border-[3px] border-gray-900 rounded-2xl p-5 md:p-6 shadow-[5px_5px_0px_#111827] hover:shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-h-[190px]">
                  {/* Quote decoration */}
                  <div className="absolute top-3 right-4 text-6xl font-black text-gray-100 select-none leading-none pointer-events-none">&quot;</div>

                  <div>
                    {/* Rating */}
                    <Stars count={t.rating} />

                    {/* Text */}
                    <p className="text-sm font-bold text-gray-700 leading-relaxed mt-3 mb-6 relative z-10 italic select-none">
                      &quot;{t.text}&quot;
                    </p>
                  </div>

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
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MotionSection>
  )
}
