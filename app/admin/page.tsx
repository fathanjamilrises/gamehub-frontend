'use client'

import AdminShell from '@/components/admin/AdminShell'
import Link from 'next/link'

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      {/* Welcome Section */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-[#ffc900] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          DASHBOARD
        </div>
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
          Selamat Datang!
        </h1>
        <p className="text-gray-600 font-bold text-sm mt-2 border-l-[4px] border-[#ff90e8] pl-3 py-1">
          Kelola platform GameHub.ID dari sini. Pilih menu di bawah untuk memulai.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          { label: 'Total Pesanan', value: '—', icon: '📦', color: 'bg-[#ffc900]' },
          { label: 'Pengguna', value: '—', icon: '👥', color: 'bg-[#ff90e8]' },
          { label: 'Produk Aktif', value: '—', icon: '🎮', color: 'bg-cyan-300' },
          { label: 'Pendapatan', value: '—', icon: '💰', color: 'bg-[#86efac]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border-[3px] border-gray-900 rounded-xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className={"absolute top-0 right-0 w-12 h-12 rounded-bl-2xl border-b-[3px] border-l-[3px] border-gray-900 " + stat.color} />
            <p className="text-3xl mb-1">{stat.icon}</p>
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 md:p-8 shadow-[8px_8px_0px_#111827] relative">
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-wider mb-6 relative z-10">Menu Utama</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {[
            { label: 'Kelola Game', desc: 'Tambah, edit, hapus data game', icon: '🎮', href: '/admin/games' },
            { label: 'Kelola Pesanan', desc: 'Lihat & proses semua pesanan masuk', icon: '📋', href: '/admin/orders' },
            { label: 'Kelola Pengguna', desc: 'Manajemen akun pengguna', icon: '👥', href: '/admin/users' },
            { label: 'Laporan', desc: 'Statistik pendapatan & transaksi', icon: '📊', href: '/admin/reports' },
            { label: 'Pengaturan', desc: 'Konfigurasi sistem & API', icon: '⚙️', href: '/admin/settings' },
            { label: 'Kembali ke Site', desc: 'Buka halaman utama website', icon: '🌐', href: '/' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="border-[3px] border-gray-900 rounded-xl p-5 bg-white hover:bg-gray-50 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all block group"
            >
              <p className="text-2xl mb-2">{item.icon}</p>
              <p className="font-black text-gray-900 uppercase tracking-wide text-sm">{item.label}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
