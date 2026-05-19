import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GameCard from '@/components/ui/GameCard'
import { getVouchers } from '@/lib/gamesApi'

export default async function VouchersPage() {
  const vouchers = await getVouchers()
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            DIGITAL VOUCHER
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 uppercase tracking-tight">Katalog<br/>Voucher</h1>
          <p className="text-gray-600 font-bold text-sm md:text-base border-l-[4px] border-[#ff90e8] pl-3 py-1">Pilih voucher favoritmu dan nikmati berbagai penawaran menarik.</p>
        </div>

        <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 md:p-8 shadow-[8px_8px_0px_#111827] relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900 z-0" />
          
          {/* Search */}
          <div className="mb-8 relative z-10">
            <div className="relative w-full max-w-md">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-bold">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="CARI VOUCHER..."
                className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-4 text-base font-black uppercase tracking-wider focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Vouchers grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-5 relative z-10">
            {vouchers.map((voucher: any) => (
              <GameCard 
                key={voucher.id} 
                game={{
                  id: voucher.id,
                  slug: voucher.slug,
                  name: voucher.name,
                  publisher: 'Voucher',
                  badge: 'Instant',
                  image_url: voucher.image
                }}
                href={`/vouchers/${voucher.slug}`}
              />
            ))}
            {vouchers.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center border-[3px] border-gray-900 border-dashed rounded-xl bg-gray-50">
                <svg className="w-14 h-14 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-4 4m-8-4l-4 4" />
                </svg>
                <p className="text-gray-900 font-black text-lg uppercase">Belum Ada Voucher</p>
                <p className="text-sm font-bold text-gray-500 mt-1">Nantikan penawaran menarik dari kami.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
