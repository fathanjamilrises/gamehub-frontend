'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/* ── Animated Counter ── */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 40
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])

  return (
    <span>
      {count.toLocaleString('id-ID')}{suffix}
    </span>
  )
}

export default function BentoGrid() {
  return (
    <div className="flex flex-col gap-5">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center bg-[#ff90e8] border-[3px] border-gray-900 rounded-xl nb-shadow-sm text-gray-900 rotate-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
            Layanan Kami
          </h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Lengkap &bull; Terpercaya &bull; Cepat</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5 auto-rows-[140px] md:auto-rows-[160px]">

        {/* ── Card 1: Voucher CTA (large) ── */}
        <Link
          href="/vouchers"
          className="group col-span-2 row-span-2 relative rounded-2xl border-[3px] border-gray-900 overflow-hidden shadow-[5px_5px_0px_#111827] hover:shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]" />
          {/* Decorative shapes */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute top-4 right-4 w-14 h-14 bg-[#ffc900] border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,0.3)] rotate-6 group-hover:rotate-12 transition-transform duration-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <div className="relative h-full flex flex-col justify-end p-5 md:p-6">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-md border border-white/30 uppercase tracking-widest mb-3 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffc900] animate-pulse" />
              Digital Voucher
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white leading-none uppercase tracking-tight mb-2">
              Voucher<br/>Digital
            </h3>
            <p className="text-white/70 text-xs font-bold mb-4 max-w-[200px]">
              Steam, Roblox, Google Play, iTunes & lainnya. Proses instan!
            </p>
            <div className="flex items-center gap-2 text-[#ffc900] font-black text-xs uppercase tracking-wider group-hover:gap-3 transition-all">
              Beli Sekarang
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </Link>

        {/* ── Card 2: Stats - Transaksi ── */}
        <div className="col-span-1 row-span-1 bg-[#ffc900] border-[3px] border-gray-900 rounded-2xl p-4 md:p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-yellow-500/40 rounded-full" />
          <div className="relative">
            <div className="w-9 h-9 bg-white border-[3px] border-gray-900 rounded-lg flex items-center justify-center mb-3 shadow-[2px_2px_0px_#111827] -rotate-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <p className="text-3xl md:text-4xl font-black text-gray-900 leading-none">
              <AnimatedNumber target={50} suffix="K+" />
            </p>
            <p className="text-[10px] font-black text-gray-900/60 uppercase tracking-widest mt-1">Transaksi</p>
          </div>
        </div>

        {/* ── Card 3: Stats - Pengguna ── */}
        <div className="col-span-1 row-span-1 bg-[#90e0ff] border-[3px] border-gray-900 rounded-2xl p-4 md:p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-cyan-400/40 rounded-full" />
          <div className="relative">
            <div className="w-9 h-9 bg-white border-[3px] border-gray-900 rounded-lg flex items-center justify-center mb-3 shadow-[2px_2px_0px_#111827] rotate-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <p className="text-3xl md:text-4xl font-black text-gray-900 leading-none">
              <AnimatedNumber target={12} suffix="K+" />
            </p>
            <p className="text-[10px] font-black text-gray-900/60 uppercase tracking-widest mt-1">Pengguna</p>
          </div>
        </div>

        {/* ── Card 4: Promo / Discount Banner ── */}
        <div className="col-span-2 row-span-1 bg-gradient-to-r from-red-500 to-orange-500 border-[3px] border-gray-900 rounded-2xl p-4 md:p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute bottom-2 right-4 text-6xl md:text-7xl font-black text-white/10 leading-none select-none pointer-events-none">%</div>
          <div className="relative flex items-center h-full gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,0.3)] shrink-0 -rotate-6 group-hover:rotate-0 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-base md:text-lg uppercase tracking-tight leading-tight">Promo Spesial</p>
              <p className="text-white/80 font-bold text-[10px] md:text-xs uppercase tracking-wider">Diskon hingga 20% untuk top up pertama!</p>
            </div>
          </div>
        </div>

        {/* ── Card 5: Feature - Instant ── */}
        <div className="col-span-1 row-span-1 bg-white border-[3px] border-gray-900 rounded-2xl p-4 md:p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
          <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-blue-100 rounded-full" />
          <div className="relative flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-blue-600 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827] -rotate-3 group-hover:rotate-3 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">Instan</p>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">Proses 1-60 detik</p>
            </div>
          </div>
        </div>

        {/* ── Card 6: Feature - Secure ── */}
        <div className="col-span-1 row-span-1 bg-white border-[3px] border-gray-900 rounded-2xl p-4 md:p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
          <div className="absolute -top-3 -left-3 w-14 h-14 bg-green-100 rounded-full" />
          <div className="relative flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-green-500 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827] rotate-3 group-hover:-rotate-3 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">Aman</p>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">100% Terjamin</p>
            </div>
          </div>
        </div>

        {/* ── Card 7: Feature - Support ── */}
        <div className="col-span-1 row-span-1 bg-white border-[3px] border-gray-900 rounded-2xl p-4 md:p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
          <div className="absolute -bottom-3 -left-3 w-14 h-14 bg-purple-100 rounded-full" />
          <div className="relative flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-purple-500 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#111827] -rotate-3 group-hover:rotate-3 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">Support</p>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">24/7 Respon Cepat</p>
            </div>
          </div>
        </div>

        {/* ── Card 8: CTA - Mulai Top Up ── */}
        <Link
          href="/topup"
          className="group col-span-1 row-span-1 bg-gray-900 border-[3px] border-gray-900 rounded-2xl p-4 md:p-5 shadow-[4px_4px_0px_#2563eb] hover:shadow-[2px_2px_0px_#2563eb] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative flex flex-col justify-between h-full">
            <div className="w-10 h-10 bg-[#ffc900] border-[3px] border-gray-700 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(255,255,255,0.1)] rotate-6 group-hover:rotate-0 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                <circle cx="12" cy="12" r="10"/><path d="M8 12l4 4 4-4M12 8v8"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-tight leading-tight">Top Up</p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">Mulai Sekarang →</p>
            </div>
          </div>
        </Link>

      </div>
    </div>
  )
}
