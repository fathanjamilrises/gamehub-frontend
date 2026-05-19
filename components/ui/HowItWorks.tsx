'use client'

export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: 'Pilih Game',
      desc: 'Cari game favoritmu dan pilih nominal top up yang diinginkan.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      ),
      color: 'bg-blue-600',
      accent: '#2563eb',
      rotate: '-rotate-3',
    },
    {
      num: 2,
      title: 'Isi Data',
      desc: 'Masukkan ID dan Server akun game kamu dengan benar.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      color: 'bg-[#ff90e8]',
      accent: '#ff90e8',
      rotate: 'rotate-2',
    },
    {
      num: 3,
      title: 'Bayar',
      desc: 'Pilih metode pembayaran dan selesaikan transaksi.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
      color: 'bg-[#ffc900]',
      accent: '#ffc900',
      rotate: '-rotate-2',
    },
    {
      num: 4,
      title: 'Selesai!',
      desc: 'Item langsung masuk ke akun game kamu. Super cepat!',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      color: 'bg-green-500',
      accent: '#22c55e',
      rotate: 'rotate-3',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center bg-[#ffc900] border-[3px] border-gray-900 rounded-xl nb-shadow-sm text-gray-900 -rotate-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
            Cara Top Up
          </h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Mudah &bull; 4 Langkah</p>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {steps.map((step) => (
          <div
            key={step.num}
            className="group bg-white border-[3px] border-gray-900 rounded-2xl p-5 md:p-6 shadow-[5px_5px_0px_#111827] hover:shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 relative overflow-hidden"
          >
            {/* Decorative circle */}
            <div
              className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full opacity-10"
              style={{ backgroundColor: step.accent }}
            />

            {/* Number badge */}
            <div className={`w-11 h-11 ${step.color} border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#111827] ${step.rotate} group-hover:rotate-0 transition-transform duration-300 mb-4 text-white`}>
              {step.icon}
            </div>

            {/* Step number */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step {step.num}</span>
              {step.num < 4 && (
                <div className="h-[2px] flex-1 bg-gray-200 rounded-full hidden md:block" />
              )}
            </div>

            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight mb-1">
              {step.title}
            </h3>
            <p className="text-xs font-bold text-gray-500 leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
