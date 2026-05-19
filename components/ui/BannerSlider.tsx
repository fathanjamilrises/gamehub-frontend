'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { banners } from '@/lib/mockData'

export default function BannerSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="group relative w-full overflow-hidden rounded-xl border-[3px] border-gray-900 nb-shadow-lg bg-white min-h-[280px] aspect-[4/5] sm:aspect-[16/10] lg:aspect-[3/1]">
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-full h-full relative group">
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover"
              priority={banner.id === 1}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/45 sm:to-transparent flex flex-col justify-end sm:justify-center px-5 py-6 sm:px-8 md:px-12 lg:px-20">
              <div className="relative group/text">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 max-w-[16rem] sm:max-w-xl leading-[1.05] tracking-tight [text-shadow:2px_2px_0px_#000]">
                  {banner.title}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm md:text-base lg:text-lg max-w-[18rem] sm:max-w-md mb-5 sm:mb-8 line-clamp-3 sm:line-clamp-2 font-bold">
                  {banner.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 max-w-xs sm:max-w-none">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 sm:px-8 py-3 rounded-md border-[3px] border-gray-900 transition-all text-xs sm:text-sm nb-shadow-sm hover:-translate-y-1 active:translate-y-0">
                    BELI SEKARANG
                  </button>
                  <button className="bg-white hover:bg-gray-100 text-gray-900 font-black px-5 sm:px-8 py-3 rounded-md border-[3px] border-gray-900 transition-all text-xs sm:text-sm nb-shadow-sm hover:-translate-y-1 active:translate-y-0">
                    DETAIL PROMO
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-3 rounded-full border-[2px] border-gray-900 transition-all ${
              current === idx ? 'bg-blue-600 w-7 sm:w-8' : 'bg-white w-3'
            }`}
          />
        ))}
      </div>

      {/* Nav Arrows */}
      <button 
        onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-gray-900 rounded-full items-center justify-center nb-shadow-sm hover:-translate-y-[calc(50%+2px)] transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button 
        onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-gray-900 rounded-full items-center justify-center nb-shadow-sm hover:-translate-y-[calc(50%+2px)] transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  )
}
