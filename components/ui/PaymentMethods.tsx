export default function PaymentMethods() {
  const methods = [
    { name: 'QRIS', icon: '📱' },
    { name: 'OVO', icon: '💜' },
    { name: 'GoPay', icon: '💚' },
    { name: 'Dana', icon: '💙' },
    { name: 'ShopeePay', icon: '🧡' },
    { name: 'BCA', icon: '🏦' },
    { name: 'BRI', icon: '🏦' },
    { name: 'Mandiri', icon: '🏦' },
    { name: 'BNI', icon: '🏦' },
    { name: 'Alfamart', icon: '🏪' },
    { name: 'Indomaret', icon: '🏪' },
  ]

  return (
    <div className="bg-gray-900 border-[3px] border-gray-900 rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#2563eb] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        {/* Left side text */}
        <div className="shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#ffc900] border-[3px] border-gray-700 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(255,255,255,0.1)] -rotate-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Pembayaran Aman</h3>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Didukung oleh berbagai metode pembayaran</p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-[3px] h-14 bg-gray-700 rounded-full shrink-0" />

        {/* Payment methods */}
        <div className="flex flex-wrap gap-2 md:gap-3 flex-1">
          {methods.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-1.5 bg-gray-800 border-2 border-gray-700 px-3 py-2 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-colors group"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">{m.icon}</span>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider group-hover:text-white transition-colors">{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
