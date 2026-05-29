'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { GameListItem } from '@/lib/types'
import { MotionSection, staggerContainer, fadeInUp, slideInLeft } from './MotionWrapper'

interface CategoryGridProps {
  topUpGames: GameListItem[]
}

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function CategoryGrid({ topUpGames }: CategoryGridProps) {
  return (
    <MotionSection>
      <div className="flex flex-col gap-4">
        <motion.div
          className="flex items-center justify-between px-2"
          variants={slideInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="w-10 h-10 flex items-center justify-center bg-blue-600 border-[3px] border-gray-900 rounded-md nb-shadow-sm text-white"
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </motion.div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Top Up Game</h3>
          </div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Link 
              href="/topup" 
              className="text-xs font-black text-gray-900 bg-white border-[3px] border-gray-900 px-4 py-2 rounded-md transition-all nb-shadow-sm"
            >
              LIHAT SEMUA <span className="ml-1">›</span>
            </Link>
          </motion.div>
        </motion.div>
        
        <div className="bg-white border-[3px] border-gray-900 p-5 md:p-7 rounded-xl nb-shadow-lg relative overflow-hidden group/box">
          <motion.div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-y-6 gap-x-3 md:gap-x-4 relative z-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {topUpGames.slice(0, 10).map((game) => (
              <motion.div key={game.id} variants={cardVariant}>
                <Link href={`/topup/${game.slug}`} className="group flex flex-col items-center gap-2.5">
                  <motion.div
                    className="relative w-full aspect-square rounded-xl overflow-hidden border-[3px] border-gray-900 nb-shadow-sm transition-shadow duration-200 bg-white"
                    whileHover={{ y: -6, boxShadow: '4px 4px 0px #1e293b' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Image
                      src={game.image_url}
                      alt={game.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </motion.div>
                  <span className="text-[10px] md:text-[11px] font-black text-gray-900 text-center leading-tight line-clamp-2 px-1 uppercase">
                    {game.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </MotionSection>
  )
}
