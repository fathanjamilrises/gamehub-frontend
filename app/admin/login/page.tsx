'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/lib/contexts/ToastContext'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { success: showSuccess, error: showError } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email atau username wajib diisi')
      return
    }
    if (!password) {
      setError('Password wajib diisi')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api-proxy/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: email.trim(),
          password,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || data?.success === false) {
        const msg =
          data?.message ||
          data?.error ||
          (Array.isArray(data?.errors) && data.errors[0]?.message) ||
          'Login gagal, periksa kembali kredensial Anda'
        setError(msg)
        showError(msg)
        return
      }

      // Ambil token dan user dari response
      const payload = data?.data ?? data
      const token = payload?.token ?? payload?.accessToken
      const user = payload?.user ?? (payload?.id ? payload : null)

      if (!user) {
        setError('Data user tidak ditemukan dalam response')
        showError('Data user tidak ditemukan')
        return
      }

      // Validasi role admin (case-insensitive)
      const role = String(user?.role || '').toLowerCase()
      if (role !== 'admin') {
        setError(`Akses ditolak. Peran Anda adalah ${role || 'tidak diketahui'}.`)
        showError('Anda bukan admin')
        return
      }

      // Simpan ke localStorage (token opsional jika pakai cookie)
      if (token) localStorage.setItem('gamehub_admin_token', token)
      localStorage.setItem('gamehub_admin_user', JSON.stringify(user))

      // Success toast
      showSuccess('Login Berhasil! Selamat datang di dashboard.')

      // Redirect ke admin dashboard
      router.push('/admin')
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Coba lagi nanti.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#111827 1.5px, transparent 1.5px), linear-gradient(to right, #111827 1.5px, transparent 1.5px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#ffc900] rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[#ff90e8] rounded-full opacity-15 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-cyan-300 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back to site link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 font-bold text-sm mb-6 hover:text-gray-900 transition-colors group"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="transition-transform group-hover:-translate-x-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          KEMBALI KE WEBSITE
        </Link>

        {/* Login Card */}
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] relative overflow-hidden">
          {/* Top color bar */}
          <div className="h-3 bg-gradient-to-r from-[#ffc900] via-[#ff90e8] to-cyan-400 border-b-[3px] border-gray-900" />

          {/* Decorative corner */}
          <div className="absolute top-3 right-0 w-20 h-20 bg-[#ffc900] rounded-bl-full -mr-10 -mt-10 border-b-[3px] border-l-[3px] border-gray-900" />

          <div className="p-8 pt-6">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gray-900 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#2563eb] -rotate-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Admin Panel</h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">GameHub.ID</p>
              </div>
            </div>

            <p className="text-gray-500 font-bold text-sm mt-4 mb-8 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Masuk dengan akun administrator untuk mengelola platform.
            </p>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-[3px] border-red-500 rounded-xl mb-6 shadow-[4px_4px_0px_#ef4444] animate-in fade-in zoom-in duration-200">
                <div className="w-8 h-8 shrink-0 bg-white border-[3px] border-red-500 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#ef4444]">
                  <svg width="16" height="16" fill="none" stroke="#dc2626" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <p className="text-red-600 text-sm font-black uppercase tracking-wide leading-tight pt-1">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-black uppercase tracking-wider text-gray-900 mb-2">
                  Email / Username
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gamehub.id"
                    autoComplete="email"
                    className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3.5 text-base font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-black uppercase tracking-wider text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-14 py-3.5 text-base font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={
                  "w-full font-black py-4 rounded-xl border-[3px] border-gray-900 transition-all text-lg uppercase tracking-wider mt-2 " +
                  (isLoading
                    ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-800 text-white shadow-[4px_4px_0px_#2563eb] hover:shadow-[2px_2px_0px_#2563eb] hover:translate-y-[2px] hover:translate-x-[2px]')
                }
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-[3px] border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    Masuk ke Dashboard
                  </span>
                )}
              </button>
            </form>

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t-[3px] border-gray-200">
              <div className="flex items-start gap-2 text-gray-500 font-medium text-xs bg-gray-50 border-2 border-dashed border-gray-300 p-3 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-0.5 text-gray-400">
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01"/>
                </svg>
                Halaman ini khusus untuk administrator. Jika Anda bukan admin, silakan kembali ke halaman utama.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-6">
          © 2026 GameHub.ID — Admin System
        </p>
      </div>
    </div>
  )
}
