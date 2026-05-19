'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface Props {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'daftar'
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: Props) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'daftar'>(defaultTab)
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [showPass3, setShowPass3] = useState(false)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setTab(defaultTab)
    // Reset form when modal opens
    if (isOpen) {
      setError('')
      setSuccess('')
    }
  }, [defaultTab, isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Reset form when switching tabs
  useEffect(() => {
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
  }, [tab])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)

    if (!result.success) {
      setError(result.error || 'Login gagal')
      setLoading(false)
      return
    }

    setSuccess('Login berhasil!')

    // Close modal after short delay
    setTimeout(() => {
      onClose()
    }, 1000)
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Username: minimal 3 karakter (bebas)
    if (name.trim().length < 3) {
      setError('Username minimal 3 karakter')
      setLoading(false)
      return
    }

    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid')
      setLoading(false)
      return
    }

    // Password: min 6, must contain uppercase, lowercase, number
    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password harus mengandung huruf besar, huruf kecil, dan angka')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok')
      setLoading(false)
      return
    }

    const result = await register(email, password, name, confirmPassword)

    if (!result.success) {
      setError(result.error || 'Registrasi gagal')
      setLoading(false)
      return
    }

    // Auto login after successful registration
    const loginResult = await login(email, password)

    if (loginResult.success) {
      setSuccess('Registrasi berhasil! Selamat datang.')
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      setSuccess('Registrasi berhasil! Silakan login.')
      setTab('login')
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gray-900/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg border-2 border-gray-900 w-full max-w-md mx-4 nb-shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-gray-900 hover:text-red-600 transition-colors"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-900">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative ${
              tab === 'login' ? 'text-gray-900 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Login
            {tab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setTab('daftar')}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative border-l-2 border-gray-900 ${
              tab === 'daftar' ? 'text-gray-900 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Daftar
            {tab === 'daftar' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pt-8 pb-6 flex-1 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-400 rounded-lg text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border-2 border-green-400 rounded-lg text-green-700 text-sm font-medium">
              {success}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="text-center mb-7">
                <h2 className="text-xl font-bold text-gray-900">Selamat Datang</h2>
                <p className="text-sm text-gray-500 mt-1">Silakan masuk ke akun GameHub.ID Anda</p>
              </div>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Email</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full border-2 border-gray-900 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#2563eb] disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">Password</label>
                    <button type="button" className="text-xs text-blue-600 font-medium hover:underline">Lupa Password?</button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full border-2 border-gray-900 rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#2563eb] disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                    >
                      {showPass ? (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-lg border-2 border-gray-900 transition-all text-sm mt-2 disabled:cursor-not-allowed nb-shadow-sm hover:-translate-y-px"
                >
                  {loading ? 'Memuat...' : 'Masuk'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="text-center mb-7">
                <h2 className="text-xl font-bold text-gray-900">Buat Akun Baru</h2>
                <p className="text-sm text-gray-500 mt-1">Daftar dan mulai top up game favoritmu</p>
              </div>

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Username</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Username kamu"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={3}
                      disabled={loading}
                      className="w-full border-2 border-gray-900 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#2563eb] disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Email</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full border-2 border-gray-900 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#2563eb] disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <input
                      type={showPass2 ? 'text' : 'password'}
                      placeholder="Min 6 karakter, huruf besar, kecil, angka"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className="w-full border-2 border-gray-900 rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#2563eb] disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass2(!showPass2)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                    >
                      {showPass2 ? (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Konfirmasi Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <input
                      type={showPass3 ? 'text' : 'password'}
                      placeholder="Ulangi password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full border-2 border-gray-900 rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_#2563eb] disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass3(!showPass3)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                    >
                      {showPass3 ? (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-lg border-2 border-gray-900 transition-all text-sm mt-2 disabled:cursor-not-allowed nb-shadow-sm hover:-translate-y-px"
                >
                  {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom switcher */}
        <div className="bg-gray-50 mt-0 px-8 py-4 text-center text-sm text-gray-500 border-t-2 border-gray-900 shrink-0">
          {tab === 'login' ? (
            <>Belum punya akun?{' '}
              <button onClick={() => setTab('daftar')} className="text-blue-600 font-semibold hover:underline">
                Daftar Sekarang
              </button>
            </>
          ) : (
            <>Sudah punya akun?{' '}
              <button onClick={() => setTab('login')} className="text-blue-600 font-semibold hover:underline">
                Masuk
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
