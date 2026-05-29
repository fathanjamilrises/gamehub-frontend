'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { banners } from '@/lib/mockData'
import { MotionSection } from './MotionWrapper'

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0.4,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0.4,
  }),
}

const contentVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const contentChild = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function BannerSlider() {
  const [[current, direction], setSlide] = useState([0, 1])

  const paginate = useCallback((newDirection: number) => {
    setSlide(([prev]) => [
      (prev + newDirection + banners.length) % banners.length,
      newDirection,
    ])
  }, [])

  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000)
    return () => clearInterval(timer)
  }, [paginate])

  const banner = banners[current]

  return (
    <MotionSection>
      <div className="group relative w-full overflow-hidden rounded-xl border-[3px] border-gray-900 nb-shadow-lg bg-white min-h-[280px] aspect-[4/5] sm:aspect-[16/10] lg:aspect-[3/1]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 200, damping: 30 },
              opacity: { duration: 0.4 },
            }}
            className="absolute inset-0"
          >
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover"
              priority={banner.id === 1}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/45 sm:to-transparent flex flex-col justify-end sm:justify-center px-5 py-6 sm:px-8 md:px-12 lg:px-20">
              <motion.div
                className="relative group/text"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                key={`content-${current}`}
              >
                <motion.h2
                  variants={contentChild}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 max-w-[16rem] sm:max-w-xl leading-[1.05] tracking-tight [text-shadow:2px_2px_0px_#000]"
                >
                  {banner.title}
                </motion.h2>
                <motion.p
                  variants={contentChild}
                  className="text-white/80 text-xs sm:text-sm md:text-base lg:text-lg max-w-[18rem] sm:max-w-md mb-5 sm:mb-8 line-clamp-3 sm:line-clamp-2 font-bold"
                >
                  {banner.subtitle}
                </motion.p>
                <motion.div
                  variants={contentChild}
                  className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 max-w-xs sm:max-w-none"
                >
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 sm:px-8 py-3 rounded-md border-[3px] border-gray-900 transition-colors text-xs sm:text-sm nb-shadow-sm"
                  >
                    BELI SEKARANG
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-white hover:bg-gray-100 text-gray-900 font-black px-5 sm:px-8 py-3 rounded-md border-[3px] border-gray-900 transition-colors text-xs sm:text-sm nb-shadow-sm"
                  >
                    DETAIL PROMO
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide([idx, idx > current ? 1 : -1])}
              className="relative h-3 rounded-full border-[2px] border-gray-900 transition-all overflow-hidden"
              style={{ width: current === idx ? 32 : 12 }}
            >
              <motion.div
                className="absolute inset-0 bg-blue-600"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: current === idx ? 1 : 0 }}
                transition={{ duration: current === idx ? 5 : 0.2 }}
                style={{ transformOrigin: 'left' }}
              />
              <div className={`absolute inset-0 ${current === idx ? '' : 'bg-white'}`} style={{ zIndex: -1 }} />
            </button>
          ))}
        </div>

        {/* Nav Arrows */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => paginate(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-gray-900 rounded-full items-center justify-center nb-shadow-sm transition-opacity opacity-0 group-hover:opacity-100 hidden md:flex"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => paginate(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-gray-900 rounded-full items-center justify-center nb-shadow-sm transition-opacity opacity-0 group-hover:opacity-100 hidden md:flex"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </motion.button>
      </div>
    </MotionSection>
  )
}
