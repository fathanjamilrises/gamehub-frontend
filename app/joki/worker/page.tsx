'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { authFetch } from '@/lib/authApi'
import { useToast } from '@/lib/contexts/ToastContext'
import { WorkerProfile, WorkerService, JokiOrder } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { walletApi, WalletInfo } from '@/lib/walletApi'
import { bankAccountApi, withdrawApi, BankAccount, WithdrawRecord } from '@/lib/withdrawApi'
import { motion, AnimatePresence } from 'framer-motion'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

export default function WorkerDashboard() {
  const { success: showSuccess, error: showError } = useToast()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<JokiOrder[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'wallet'>('overview')

  // Financial Stats & Wallet data
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [walletStats, setWalletStats] = useState<any>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([])
  const [withdrawHistoryLoading, setWithdrawHistoryLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)

  // Helper calculations for dashboard statistics
  const completedOrders = orders.filter(o => ['confirmed', 'completed', 'done'].includes(o.status?.toLowerCase()))
  const activeOrders = orders.filter(o => ['paid', 'in_progress'].includes(o.status?.toLowerCase()))
  const totalViews = profile?.services?.reduce((sum, s) => sum + (s.is_active ? 25 : 12), 0) || 0

  const getWorkerLevel = () => {
    const completedCount = completedOrders.length
    if (completedCount >= 15) return { title: '👑 GLOBAL MYTHIC', badge: 'MYTHIC', desc: 'Bebas Potongan Admin' }
    if (completedCount >= 8) return { title: '⭐ LEGENDARY', badge: 'LEGEND', desc: 'Potongan Admin 2%' }
    if (completedCount >= 3) return { title: '🥈 EPIC', badge: 'EPIC', desc: 'Potongan Admin 3%' }
    return { title: '🥉 WARRIOR', badge: 'WARRIOR', desc: 'Potongan Admin 5%' }
  }
  const workerLevel = getWorkerLevel()

  // Registration form
  const [namaLengkap, setNamaLengkap] = useState('')
  const [noHp, setNoHp] = useState('')
  const [bio, setBio] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')

  // New service form
  const [slugGames, setSlugGames] = useState('')
  const [namaLayanan, setNamaLayanan] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [hargaPerHari, setHargaPerHari] = useState('')
  const [rankDari, setRankDari] = useState('')
  const [rankKe, setRankKe] = useState('')

  // Edit Profile Form States
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
  const [editNamaLengkap, setEditNamaLengkap] = useState('')
  const [editNoHp, setEditNoHp] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editFotoUrl, setEditFotoUrl] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // Edit Service Form States
  const [editingService, setEditingService] = useState<WorkerService | null>(null)
  const [editNamaLayanan, setEditNamaLayanan] = useState('')
  const [editDeskripsi, setEditDeskripsi] = useState('')
  const [editHargaPerHari, setEditHargaPerHari] = useState('')
  const [editRankDari, setEditRankDari] = useState('')
  const [editRankKe, setEditRankKe] = useState('')
  const [serviceUpdateLoading, setServiceUpdateLoading] = useState(false)

  // Delete Service States
  const [deletingService, setDeletingService] = useState<WorkerService | null>(null)
  const [serviceDeleteLoading, setServiceDeleteLoading] = useState(false)

  // Bank management modal state
  const [showAddBankModal, setShowAddBankModal] = useState(false)
  const [newBankNama, setNewBankNama] = useState('')
  const [newBankTipe, setNewBankTipe] = useState('bank') // 'bank' | 'ewallet'
  const [newBankNomor, setNewBankNomor] = useState('')
  const [newBankPemilik, setNewBankPemilik] = useState('')
  const [newBankKode, setNewBankKode] = useState('')
  const [addingBank, setAddingBank] = useState(false)

  // Withdrawal request modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)

  const fetchProfileAndOrders = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api-proxy/workers/me/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.data)

        // Fetch orders
        const ordersRes = await authFetch('/api-proxy/joki-orders/worker')
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(ordersData.data || [])
        } else {
          setOrders([])
        }
      } else {
        // Not registered
        setProfile(null)
      }
    } catch (err) {
      console.error(err)
      showError('Gagal memuat profil worker')
    } finally {
      setLoading(false)
    }
  }

  const fetchWalletAndHistory = async () => {
    if (!profile) return
    setWalletLoading(true)
    try {
      const info = await walletApi.getInfo()
      setWalletInfo(info)
    } catch (err) {
      console.error('Gagal mengambil info wallet:', err)
    }

    try {
      const stats = await walletApi.getStats()
      setWalletStats(stats)
    } catch (err) {
      console.error('Gagal mengambil statistik wallet:', err)
    } finally {
      setWalletLoading(false)
    }

    try {
      const banks = await bankAccountApi.getAll()
      setBankAccounts(banks)
      const verifiedBanks = banks.filter(b => b.is_verified !== false)
      const primary = verifiedBanks.find(b => b.is_primary) || verifiedBanks[0]
      if (primary) setSelectedBankId(primary.id)
    } catch (err) {
      console.error('Gagal mengambil daftar bank:', err)
    }

    setWithdrawHistoryLoading(true)
    try {
      const history = await withdrawApi.getHistory({ page: 1, limit: 10 })
      setWithdrawRecords(history.withdrawals || [])
    } catch (err) {
      console.error('Gagal mengambil riwayat penarikan:', err)
    } finally {
      setWithdrawHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileAndOrders()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (profile) {
      fetchWalletAndHistory()
    }
  }, [profile])

  // Open Edit Profile Modal and prefill data
  const handleOpenEditProfile = () => {
    if (!profile) return
    setEditNamaLengkap(profile.nama_lengkap || '')
    setEditNoHp(profile.no_hp || '')
    setEditBio(profile.bio || '')
    setEditFotoUrl(profile.foto_url || '')
    setEditProfileModalOpen(true)
  }

  // Open Edit Service Modal and prefill data
  const handleOpenEditService = (svc: WorkerService) => {
    setEditingService(svc)
    setEditNamaLayanan(svc.nama_layanan || '')
    setEditDeskripsi(svc.deskripsi || '')
    setEditHargaPerHari(String(svc.harga_per_hari || ''))
    setEditRankDari(svc.rank_dari || '')
    setEditRankKe(svc.rank_ke || '')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await authFetch('/api-proxy/workers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_lengkap: namaLengkap, no_hp: noHp, bio, foto_url: fotoUrl })
      })
      if (res.ok) {
        showSuccess('Berhasil mendaftar jadi worker!')
        fetchProfileAndOrders()
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal mendaftar jadi worker')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal mendaftar')
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const res = await authFetch('/api-proxy/workers/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: editNamaLengkap,
          no_hp: editNoHp,
          bio: editBio,
          foto_url: editFotoUrl
        })
      })
      if (res.ok) {
        showSuccess('Profil berhasil diperbarui!')
        setEditProfileModalOpen(false)
        fetchProfileAndOrders()
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal memperbarui profil')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal memperbarui profil')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await authFetch('/api-proxy/workers/me/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug_games: slugGames,
          nama_layanan: namaLayanan,
          deskripsi: deskripsi,
          harga_per_hari: Number(hargaPerHari),
          rank_dari: rankDari,
          rank_ke: rankKe
        })
      })
      if (res.ok) {
        showSuccess('Layanan berhasil ditambahkan!')
        setSlugGames(''); setNamaLayanan(''); setDeskripsi(''); setHargaPerHari(''); setRankDari(''); setRankKe('');
        fetchProfileAndOrders()
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal menambahkan layanan')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal menambahkan layanan')
    }
  }

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService) return
    setServiceUpdateLoading(true)
    try {
      const res = await authFetch(`/api-proxy/workers/me/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_layanan: editNamaLayanan,
          deskripsi: editDeskripsi,
          harga_per_hari: Number(editHargaPerHari),
          rank_dari: editRankDari,
          rank_ke: editRankKe
        })
      })
      if (res.ok) {
        showSuccess('Layanan berhasil diperbarui!')
        setEditingService(null)
        fetchProfileAndOrders()
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal memperbarui layanan')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal memperbarui layanan')
    } finally {
      setServiceUpdateLoading(false)
    }
  }

  const handleDeleteService = async () => {
    if (!deletingService) return
    setServiceDeleteLoading(true)
    try {
      const res = await authFetch(`/api-proxy/workers/me/services/${deletingService.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showSuccess('Layanan berhasil dihapus!')
        setDeletingService(null)
        fetchProfileAndOrders()
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal menghapus layanan')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal menghapus layanan')
    } finally {
      setServiceDeleteLoading(false)
    }
  }

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingBank(true)
    try {
      await bankAccountApi.create({
        nama_bank: newBankNama,
        tipe: newBankTipe,
        nomor_rekening: newBankNomor,
        nama_pemilik: newBankPemilik,
        kode_bank: newBankKode || undefined,
        is_primary: bankAccounts.length === 0
      })
      showSuccess('Rekening bank berhasil ditambahkan!')
      setNewBankNama('')
      setNewBankNomor('')
      setNewBankPemilik('')
      setNewBankKode('')
      setShowAddBankModal(false)
      fetchWalletAndHistory()
    } catch (err: any) {
      showError(err.message || 'Gagal menambahkan rekening bank')
    } finally {
      setAddingBank(false)
    }
  }

  const handleDeleteBankAccount = async (bankId: number) => {
    if (!confirm('Yakin ingin menghapus rekening ini?')) return
    try {
      await bankAccountApi.delete(bankId)
      showSuccess('Rekening bank berhasil dihapus!')
      fetchWalletAndHistory()
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus rekening bank')
    }
  }

  const handleSetPrimaryBank = async (bankId: number) => {
    try {
      await bankAccountApi.setPrimary(bankId)
      showSuccess('Rekening bank utama berhasil diatur!')
      fetchWalletAndHistory()
    } catch (err: any) {
      showError(err.message || 'Gagal mengatur rekening bank utama')
    }
  }

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBankId) {
      showError('Silakan pilih rekening bank terlebih dahulu')
      return
    }
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0) {
      showError('Jumlah penarikan tidak valid')
      return
    }
    if (walletInfo && amount > walletInfo.saldo) {
      showError('Saldo Anda tidak mencukupi')
      return
    }

    setWithdrawSubmitting(true)
    try {
      await withdrawApi.request({
        id_bank_account: selectedBankId,
        jumlah: amount,
        catatan_reseller: withdrawNote || undefined
      })
      showSuccess('Penarikan dana berhasil diajukan!')
      setWithdrawAmount('')
      setWithdrawNote('')
      setShowWithdrawModal(false)
      fetchWalletAndHistory()
    } catch (err: any) {
      showError(err.message || 'Gagal mengajukan penarikan')
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  const handleCancelWithdrawal = async (withdrawId: number) => {
    if (!confirm('Batalkan pengajuan penarikan ini?')) return
    try {
      await withdrawApi.cancel(withdrawId)
      showSuccess('Pengajuan penarikan dibatalkan!')
      fetchWalletAndHistory()
    } catch (err: any) {
      showError(err.message || 'Gagal membatalkan penarikan')
    }
  }

  const updateOrderStatus = async (orderId: number, action: 'set-durasi' | 'done', duration?: number) => {
    try {
      const body = action === 'set-durasi' ? JSON.stringify({ duration_hours: duration }) : undefined;
      const res = await authFetch(`/api-proxy/joki-orders/worker/${orderId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body
      })
      if (res.ok) {
        showSuccess('Status order diperbarui!')
        fetchProfileAndOrders()
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal memperbarui status order')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal memperbarui status order')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <p className="font-black text-xl uppercase tracking-widest text-gray-500 animate-pulse">Memuat Sesi...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center">
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-8 shadow-[8px_8px_0px_#111827] max-w-md text-center">
            <div className="w-16 h-16 bg-[#ffc900] border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0px_#111827] mx-auto mb-6 -rotate-3">
              <span className="text-2xl font-black">🔒</span>
            </div>
            <h2 className="text-2xl font-black uppercase mb-3">Harus Login Terlebih Dahulu</h2>
            <p className="text-gray-600 font-bold text-sm mb-6">Silakan masuk ke akun Anda untuk mengakses Worker Dashboard.</p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }))}
              className="bg-[#ff90e8] border-[3px] border-gray-900 px-6 py-2.5 font-black uppercase text-sm shadow-[4px_4px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] transition-all"
            >
              Masuk Sekarang
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        
        {/* Header Dashboard */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-[#ff90e8] border-2 border-gray-900 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded shadow-[2.5px_2.5px_0px_#111827] uppercase tracking-wider mb-2.5 inline-block">
              🎮 AREA PROFESSIONAL WORKER
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">Worker Dashboard</h1>
          </div>
          {profile && (
            <div className="flex gap-2">
              <button
                onClick={handleOpenEditProfile}
                className="bg-cyan-300 border-[3px] border-gray-900 px-5 py-2.5 font-black uppercase shadow-[4px_4px_0px_#111827] text-xs sm:text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] transition-all"
              >
                ⚙️ Edit Profil
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="font-bold">Memuat data worker...</p>
        ) : !profile ? (
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_#111827] max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black uppercase mb-2">Daftar Jadi Worker</h2>
            <p className="text-gray-500 font-bold text-xs sm:text-sm mb-6 pl-3 border-l-4 border-cyan-400">Mulailah karir joki game profesional Anda. Lengkapi form berikut untuk mendaftar.</p>
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-xs sm:text-sm uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <input required type="text" value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] transition-all" placeholder="Masukkan nama lengkap Anda" />
                </div>
                <div>
                  <label className="block font-black text-xs sm:text-sm uppercase tracking-wider mb-1.5">Nomor HP / WhatsApp</label>
                  <input required type="text" value={noHp} onChange={e => setNoHp(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] transition-all" placeholder="Contoh: 081234567890" />
                </div>
              </div>
              <div>
                <label className="block font-black text-xs sm:text-sm uppercase tracking-wider mb-1.5">Bio Singkat & Pengalaman</label>
                <textarea required rows={4} value={bio} onChange={e => setBio(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl p-4 font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] transition-all resize-none" placeholder="Tuliskan skill game, prestasi, atau pengalaman joki Anda (cth: Joki ML rank Mythical Glory, win rate 80%)" />
              </div>
              <div>
                <label className="block font-black text-xs sm:text-sm uppercase tracking-wider mb-1.5">Foto Profil / Avatar URL (Opsional)</label>
                <input type="text" value={fotoUrl} onChange={e => setFotoUrl(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] transition-all" placeholder="Masukkan URL foto profil Anda (opsional)" />
              </div>
              <button type="submit" className="w-full bg-[#ffc900] border-[3px] border-gray-900 py-3 font-black uppercase shadow-[4px_4px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all tracking-wider">Daftar Sekarang &rarr;</button>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Tab Navigation Menu */}
            <div className="flex border-b-[3px] border-gray-900 gap-1 sm:gap-2 overflow-x-auto pb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 sm:px-6 py-3 font-black uppercase text-xs sm:text-sm tracking-wider border-t-[3px] border-x-[3px] border-gray-900 rounded-t-xl transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#ffc900] text-gray-900 -translate-y-px shadow-[0px_4px_0px_#ffc900]'
                    : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📋 Overview
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-4 sm:px-6 py-3 font-black uppercase text-xs sm:text-sm tracking-wider border-t-[3px] border-x-[3px] border-gray-900 rounded-t-xl transition-all ${
                  activeTab === 'services'
                    ? 'bg-[#ff90e8] text-gray-900 -translate-y-px shadow-[0px_4px_0px_#ff90e8]'
                    : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🛠️ Layanan Joki
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`px-4 sm:px-6 py-3 font-black uppercase text-xs sm:text-sm tracking-wider border-t-[3px] border-x-[3px] border-gray-900 rounded-t-xl transition-all ${
                  activeTab === 'wallet'
                    ? 'bg-cyan-300 text-gray-900 -translate-y-px shadow-[0px_4px_0px_#67e8f9]'
                    : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🏦 Dompet & Penarikan
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Saldo Tersedia */}
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                    <div className="absolute top-0 right-0 bg-green-500 text-gray-900 font-black text-[9px] px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                      Siap Tarik
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Tersedia</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight truncate">
                      Rp {(walletInfo?.saldo || 0).toLocaleString('id-ID')}
                    </p>
                    {walletInfo && (walletInfo.saldo_tertahan > 0 || walletInfo.saldo_proses_withdraw > 0) && (
                      <div className="mt-1 space-y-0.5">
                        {walletInfo.saldo_tertahan > 0 && (
                          <p className="text-[10px] font-bold text-orange-600">
                            Ditahan: Rp {walletInfo.saldo_tertahan.toLocaleString('id-ID')}
                          </p>
                        )}
                        {walletInfo.saldo_proses_withdraw > 0 && (
                          <p className="text-[10px] font-bold text-blue-600">
                            Proses WD: Rp {walletInfo.saldo_proses_withdraw.toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-500">
                        {walletInfo ? `Pendapatan: Rp ${(walletInfo.total_pendapatan || 0).toLocaleString('id-ID')}` : 'Cair instan 24/7'}
                      </span>
                      <button 
                        onClick={() => setActiveTab('wallet')}
                        className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Tarik &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Total Selesai */}
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white font-black text-[9px] px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                      Sukses
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Selesai</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                      {completedOrders.length} <span className="text-sm font-bold text-gray-500">Orderan</span>
                    </p>
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                      <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                        ↗ Garansi Pekerjaan Selesai
                      </span>
                    </div>
                  </div>

                  {/* Layanan Aktif */}
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                    <div className="absolute top-0 right-0 bg-purple-500 text-white font-black text-[9px] px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                      Live
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Layanan Aktif</p>
                    <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                      {profile.services?.length || 0} <span className="text-sm font-bold text-gray-500">Layanan</span>
                    </p>
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                      <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                        👁 Total {totalViews} Dilihat
                      </span>
                    </div>
                  </div>

                  {/* Tingkat Worker */}
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all bg-gradient-to-br from-white to-[#ff90e8]/10">
                    <div className="absolute top-0 right-0 bg-[#ff90e8] text-gray-900 font-black text-[9px] px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                      VIP
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Tingkat Worker</p>
                    <p className="text-xl md:text-2xl font-black text-purple-700 tracking-tight">
                      {workerLevel.title}
                    </p>
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                      <span className="text-[10px] font-bold text-gray-600">
                        {workerLevel.desc}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pendapatan Bulan Ini */}
                {(walletStats || walletInfo) && (
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pendapatan Bulan Ini</p>
                      <p className="text-2xl font-black text-green-600">
                        Rp {(walletStats?.pendapatan_bulan_ini || walletInfo?.total_pendapatan || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-green-100 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[2px_2px_0px_#111827]">
                      <span className="text-2xl">📈</span>
                    </div>
                  </div>
                )}

                {/* Seksi Analytics & Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Progress Target Joki */}
                  <div className="lg:col-span-2 bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Kinerja Joki Bulan Ini</h3>
                        <p className="text-xs font-bold text-gray-500">Target Bonus: 10 Joki Selesai</p>
                      </div>
                      <span className="bg-[#ffc900] text-gray-900 font-black text-xs px-3 py-1 rounded-lg border-2 border-gray-900">
                        {completedOrders.length} / 10
                      </span>
                    </div>
                    
                    {/* Target Progress Bar */}
                    <div className="w-full bg-gray-100 border-[3px] border-gray-900 rounded-xl h-6 relative overflow-hidden mb-6">
                      <div 
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-[#ff90e8] h-full border-r-[3px] border-gray-900 transition-all duration-1000"
                        style={{ width: `${Math.min(100, (completedOrders.length / 10) * 100)}%` }}
                      />
                    </div>

                    {/* Rincian Game Joki (Visual CSS Bars) */}
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Distribusi Game Joki</h4>
                    <div className="space-y-3">
                      {(() => {
                        const gameStats: Record<string, number> = {}
                        orders.forEach(o => {
                          const name = o.nama_games || 'Lainnya'
                          gameStats[name] = (gameStats[name] || 0) + 1
                        })
                        const statsEntries = Object.entries(gameStats)
                        if (statsEntries.length === 0) {
                          return <p className="text-xs text-gray-400 font-bold">Belum ada data joki game.</p>
                        }
                        return statsEntries.map(([game, count]) => {
                          const pct = Math.round((count / (orders.length || 1)) * 100)
                          return (
                            <div key={game} className="flex items-center gap-3">
                              <span className="w-32 text-xs font-bold text-gray-700 truncate uppercase">{game}</span>
                              <div className="flex-1 bg-gray-50 border-2 border-gray-900 rounded-md h-4 overflow-hidden">
                                <div className="bg-blue-500 h-full border-r-2 border-gray-900" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-black text-gray-900 w-8 text-right">{count}</span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Tips Jadi Worker Top */}
                  <div className="bg-[#ff90e8]/10 border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">💡</span>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Tips Jadi Worker Top</h3>
                      </div>
                      <ul className="space-y-3 text-xs font-bold text-gray-700">
                        <li className="flex gap-2">
                          <span className="text-purple-600 font-black">✔</span>
                          <span>Berikan estimasi pengerjaan yang jujur & tepat waktu.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-purple-600 font-black">✔</span>
                          <span>Selalu komunikasikan progress joki Anda via chat.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-purple-600 font-black">✔</span>
                          <span>Jaga kerahasiaan & keamanan data login akun client Anda.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-purple-600 font-black">✔</span>
                          <span>Perbarui status pengerjaan secara real-time demi kenyamanan pelanggan.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Worker Profile Card */}
                  <div className="lg:col-span-1 bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0px_#111827] h-fit">
                    <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-gray-100 pb-2">Profil Saya</h3>
                    <div className="flex items-center gap-4 mb-4">
                      {profile.foto_url ? (
                        <div className="w-16 h-16 border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[2px_2px_0_#111827] shrink-0">
                          <img src={resolveImageUrl(profile.foto_url)} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-blue-600 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0_#111827] shrink-0">
                          <span className="text-white font-black text-xl">{profile.nama_lengkap.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-black text-lg truncate uppercase">{profile.nama_lengkap}</h4>
                        <p className="text-xs text-gray-500 font-bold truncate">@{profile.user?.username || 'username'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm font-bold border-t border-gray-100 pt-4">
                      <div className="flex justify-between"><span className="text-gray-500 uppercase">Status:</span><span className="uppercase text-blue-600 font-black">{profile.status}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 uppercase">WhatsApp:</span><span className="text-gray-800">{profile.no_hp || '—'}</span></div>
                      <div className="flex flex-col mt-2">
                        <span className="text-gray-500 uppercase text-xs mb-1">Bio & Pengalaman:</span>
                        <span className="text-gray-600 font-medium bg-gray-50 p-3 border-2 border-gray-900 rounded-xl leading-relaxed">{profile.bio || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Jobs Section */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xl font-black uppercase">Orderan Aktif</h3>
                      <span className="bg-gray-900 text-white text-xs font-black px-2.5 py-1 rounded shadow-[2px_2px_0_#ff90e8]">
                        {orders.filter(o => ['paid', 'in_progress'].includes(o.status)).length} PEKERJAAN
                      </span>
                    </div>

                    {orders.filter(o => ['paid', 'in_progress'].includes(o.status)).length === 0 ? (
                      <div className="bg-white border-[3px] border-dashed border-gray-900 p-8 rounded-2xl text-center shadow-[4px_4px_0_#111827]">
                        <p className="font-black text-gray-400 uppercase text-sm">Tidak ada pekerjaan aktif saat ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.filter(o => ['paid', 'in_progress'].includes(o.status)).map(order => (
                          <div key={order.id} className="bg-white border-[3px] border-gray-900 p-4 sm:p-5 rounded-2xl shadow-[5px_5px_0px_#111827]">
                            <div className="flex justify-between items-start mb-4 border-b-2 border-gray-100 pb-3">
                              <div>
                                <h4 className="font-black text-base sm:text-lg uppercase text-blue-600">{order.invoice_number}</h4>
                                <p className="text-xs font-black uppercase text-gray-400 mt-0.5">{order.nama_games}</p>
                              </div>
                              <span className={`font-black uppercase text-[10px] px-2.5 py-1 rounded border-2 border-gray-900 shadow-[1.5px_1.5px_0_#111827] ${
                                order.status === 'in_progress' ? 'bg-cyan-300 text-cyan-900' : 'bg-[#ffc900] text-yellow-900'
                              }`}>
                                {order.status === 'in_progress' ? '⚡ Sedang Dikerjakan' : '💰 Belum Dikerjakan'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-xs">
                              <div>
                                <p className="font-black uppercase text-gray-400 mb-0.5">Login Via</p>
                                <p className="font-bold text-gray-900 uppercase">{order.login_type || '-'}</p>
                              </div>
                              <div>
                                <p className="font-black uppercase text-gray-400 mb-0.5">Username / Email</p>
                                <p className="font-bold text-gray-900 truncate select-all">{order.game_username || order.game_email || '-'}</p>
                              </div>
                              <div>
                                <p className="font-black uppercase text-gray-400 mb-0.5">Password</p>
                                <p className="font-bold text-gray-900 select-all">{order.game_password || '-'}</p>
                              </div>
                              <div>
                                <p className="font-black uppercase text-gray-400 mb-0.5">Target Rank</p>
                                <p className="font-bold text-gray-900">{order.rank_saat_ini} ➡️ {order.rank_target}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="font-black uppercase text-gray-400 mb-0.5">Catatan Client</p>
                                <p className="font-bold text-gray-700 bg-gray-50 border-2 border-gray-900 rounded-lg p-2 mt-0.5">{order.catatan_user || 'Tidak ada catatan.'}</p>
                              </div>
                              <div className="col-span-2 flex items-end justify-end">
                                <p className="font-black text-sm text-blue-600">Tarif: Rp {order.harga.toLocaleString('id-ID')}</p>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                              {order.status === 'paid' && (
                                <button 
                                  onClick={() => {
                                    const hrs = prompt("Berapa jam estimasi pengerjaan?")
                                    if(hrs) updateOrderStatus(order.id, 'set-durasi', Number(hrs))
                                  }}
                                  className="bg-[#ffc900] border-[3px] border-gray-900 px-4 py-2 font-black uppercase text-xs shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827]"
                                >
                                  🚀 Mulai Pengerjaan
                                </button>
                              )}
                              {order.status === 'in_progress' && (
                                <button 
                                  onClick={() => {
                                    if(confirm('Yakin sudah selesai?')) updateOrderStatus(order.id, 'done')
                                  }}
                                  className="bg-green-400 border-[3px] border-gray-900 px-4 py-2 font-black uppercase text-xs shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827]"
                                >
                                  ✅ Selesaikan Pekerjaan
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Services */}
            {activeTab === 'services' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {/* Left Column: Services list */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xl font-black uppercase">Daftar Layanan Joki Anda</h3>
                  {profile.services && profile.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.services.map(svc => (
                        <div key={svc.id} className="bg-white border-[3px] border-gray-900 rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#111827] relative flex flex-col justify-between">
                          <div>
                            <span className="inline-block bg-[#ff90e8] border-2 border-gray-900 px-2.5 py-0.5 text-[9px] font-black uppercase shadow-[1.5px_1.5px_0_#111827] mb-2 text-gray-800">
                              🎮 {svc.game?.nama_games || svc.game?.slug_games || 'game'}
                            </span>
                            <h4 className="font-black text-base uppercase mb-1">{svc.nama_layanan}</h4>
                            {svc.deskripsi && <p className="text-xs text-gray-500 font-bold mb-3 leading-relaxed">{svc.deskripsi}</p>}
                          </div>
                          
                          <div className="border-t border-gray-100 pt-3 mt-3">
                            <div className="flex justify-between items-center text-xs font-black text-gray-500 mb-2">
                              <span>Rank Target:</span>
                              <span className="text-gray-900">{svc.rank_dari} ➡️ {svc.rank_ke}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-black text-gray-500">Tarif per Hari:</span>
                              <span className="text-sm font-black text-blue-600">Rp {svc.harga_per_hari.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleOpenEditService(svc)}
                                className="bg-blue-100 border-2 border-gray-900 text-blue-800 text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors uppercase"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingService(svc)}
                                className="bg-red-100 border-2 border-gray-900 text-red-700 text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors uppercase"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border-[3px] border-dashed border-gray-900 p-8 rounded-2xl text-center shadow-[4px_4px_0_#111827]">
                      <p className="font-black text-red-500 uppercase text-sm">Belum ada layanan joki yang terdaftar.</p>
                      <p className="text-xs text-gray-400 font-bold mt-1">Silakan gunakan form di samping untuk menambahkan layanan joki baru.</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Add Service form */}
                <div className="lg:col-span-1">
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[6px_6px_0px_#111827]">
                    <h3 className="text-lg font-black uppercase mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                      <span className="bg-[#ffc900] w-6 h-6 border-2 border-gray-900 rounded flex items-center justify-center text-xs">＋</span>
                      Tambah Layanan Baru
                    </h3>
                    <form onSubmit={handleAddService} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Slug Game</label>
                        <input required placeholder="Contoh: mobile-legends" value={slugGames} onChange={e => setSlugGames(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Nama Layanan</label>
                        <input required placeholder="Contoh: Joki ML Epic ke Mythic" value={namaLayanan} onChange={e => setNamaLayanan(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Deskripsi Layanan</label>
                        <textarea required placeholder="Tulis rincian layanan & garansi pengerjaan" value={deskripsi} onChange={e => setDeskripsi(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-lg p-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all resize-none" rows={2} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Harga per Hari (Rp)</label>
                        <input required type="number" placeholder="Contoh: 50000" value={hargaPerHari} onChange={e => setHargaPerHari(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Rank Dari</label>
                          <input required placeholder="Contoh: Epic" value={rankDari} onChange={e => setRankDari(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Rank Ke</label>
                          <input required placeholder="Contoh: Mythic" value={rankKe} onChange={e => setRankKe(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-lg px-3 py-2 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" />
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-[#ffc900] border-[3px] border-gray-900 py-2.5 font-black uppercase shadow-[3px_3px_0px_#111827] text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827] transition-all">Tambah Layanan</button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Wallet */}
            {activeTab === 'wallet' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#ffc900] border-[3px] border-gray-900 p-6 rounded-2xl shadow-[5px_5px_0px_#111827] flex flex-col justify-between">
                    <div>
                      <span className="font-black uppercase text-xs text-gray-800 tracking-wider">Saldo Tersedia</span>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 truncate">
                        Rp {(walletInfo?.saldo || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button
                      disabled={!walletInfo || walletInfo.saldo <= 0}
                      onClick={() => setShowWithdrawModal(true)}
                      className="mt-6 w-full text-center bg-black hover:bg-gray-800 text-white font-black uppercase text-xs py-3 rounded-xl border-[2px] border-gray-900 shadow-[2px_2px_0px_#ff90e8] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all disabled:opacity-50"
                    >
                      💸 Tarik Saldo Sekarang
                    </button>
                  </div>

                  <div className="bg-[#ff90e8] border-[3px] border-gray-900 p-6 rounded-2xl shadow-[5px_5px_0px_#111827] flex flex-col justify-between">
                    <div>
                      <span className="font-black uppercase text-xs text-gray-800 tracking-wider">Saldo Ditahan (Escrow)</span>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 truncate">
                        Rp {(walletInfo?.saldo_tertahan || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-700 font-bold mt-6 leading-relaxed">
                      * Saldo dari orderan yang belum selesai dikerjakan atau belum dikonfirmasi oleh pembeli.
                    </p>
                  </div>

                  <div className="bg-cyan-300 border-[3px] border-gray-900 p-6 rounded-2xl shadow-[5px_5px_0px_#111827] flex flex-col justify-between">
                    <div>
                      <span className="font-black uppercase text-xs text-gray-800 tracking-wider">Sedang Diproses</span>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 truncate">
                        Rp {(walletInfo?.saldo_proses_withdraw || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-700 font-bold mt-6 leading-relaxed">
                      * Saldo penarikan Anda yang sedang diverifikasi dan ditransfer oleh pihak keuangan GameHub.ID.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Bank Accounts list */}
                  <div className="lg:col-span-1 bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[6px_6px_0px_#111827] h-fit">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                      <h3 className="text-lg font-black uppercase">Rekening Saya</h3>
                      <button
                        onClick={() => setShowAddBankModal(true)}
                        className="bg-green-100 border-2 border-gray-900 text-green-800 text-[10px] font-black px-2.5 py-1 rounded hover:bg-green-200 transition-all uppercase"
                      >
                        ＋ Tambah
                      </button>
                    </div>

                    {bankAccounts.length === 0 ? (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-5 text-center rounded-xl">
                        <p className="text-xs text-gray-400 font-bold">Belum ada rekening payout.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bankAccounts.map(bank => (
                          <div key={bank.id} className={`p-4 border-2 border-gray-900 rounded-xl relative ${
                            bank.is_primary ? 'bg-cyan-50 shadow-[2px_2px_0px_#06b6d4]' : 'bg-gray-50'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-black text-sm uppercase text-cyan-800">{bank.nama_bank}</span>
                              {bank.is_primary && (
                                <span className="bg-cyan-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#111827]">
                                  UTAMA
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-gray-700 space-y-0.5">
                              <p>No: <span className="select-all text-gray-900">{bank.nomor_rekening}</span></p>
                              <p>A.N: <span className="text-gray-900 uppercase">{bank.nama_pemilik}</span></p>
                              <p>Status: <span className={`uppercase font-black text-[9px] ${bank.is_verified === false ? 'text-red-500' : 'text-green-600'}`}>{bank.is_verified === false ? 'Belum Verifikasi' : 'Terverifikasi'}</span></p>
                            </div>
                            <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-gray-200">
                              {!bank.is_primary && bank.is_verified !== false && (
                                <button
                                  onClick={() => handleSetPrimaryBank(bank.id)}
                                  className="text-[9px] font-black text-cyan-700 hover:underline uppercase"
                                >
                                  Utamakan
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBankAccount(bank.id)}
                                className="text-[9px] font-black text-red-600 hover:underline uppercase"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Withdrawal History */}
                  <div className="lg:col-span-2 bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[6px_6px_0px_#111827]">
                    <h3 className="text-lg font-black uppercase mb-4 pb-2 border-b border-gray-100">Riwayat Penarikan Dana</h3>

                    {withdrawHistoryLoading ? (
                      <p className="font-bold text-sm">Memuat riwayat...</p>
                    ) : withdrawRecords.length === 0 ? (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-8 text-center rounded-2xl">
                        <p className="text-sm font-bold text-gray-400">Belum ada catatan pengajuan penarikan dana.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b-[2px] border-gray-900 bg-gray-50 font-black uppercase text-gray-500">
                              <th className="p-3">Tanggal</th>
                              <th className="p-3">Rekening</th>
                              <th className="p-3 text-right">Jumlah</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {withdrawRecords.map(rec => (
                              <tr key={rec.id} className="border-b border-gray-200 hover:bg-gray-50 font-semibold text-gray-800">
                                <td className="p-3 truncate">
                                  {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </td>
                                <td className="p-3">
                                  <p className="font-black text-gray-900 uppercase">{rec.bank_account?.nama_bank || '—'}</p>
                                  <p className="text-[10px] text-gray-500 font-bold">{rec.bank_account?.nomor_rekening || '—'}</p>
                                </td>
                                <td className="p-3 text-right font-black text-gray-900">
                                  Rp {rec.jumlah.toLocaleString('id-ID')}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border-2 border-gray-900 uppercase shadow-[1px_1px_0px_#111827] ${
                                    rec.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    rec.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    rec.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    rec.status === 'rejected' ? 'bg-red-100 text-red-800 font-black' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {rec.status}
                                  </span>
                                  {rec.alasan_penolakan && (
                                    <p className="text-[9px] text-red-600 font-bold mt-1 text-center italic">* {rec.alasan_penolakan}</p>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {rec.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelWithdrawal(rec.id)}
                                      className="bg-red-100 border border-gray-900 text-red-700 text-[9px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#111827] hover:bg-red-200 transition-colors uppercase"
                                    >
                                      Batal
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editProfileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setEditProfileModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-gray-900 bg-cyan-50 flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 uppercase">Edit Profil Worker</h2>
                <button onClick={() => setEditProfileModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Nama Lengkap</label>
                  <input required type="text" value={editNamaLengkap} onChange={e => setEditNamaLengkap(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Nomor HP</label>
                  <input required type="text" value={editNoHp} onChange={e => setEditNoHp(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Bio Singkat</label>
                  <textarea required rows={3} value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl p-4 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">URL Foto Profil</label>
                  <input type="text" value={editFotoUrl} onChange={e => setEditFotoUrl(e.target.value)} placeholder="/uploads/foto.jpg" className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={profileLoading} className="flex-1 py-3 bg-[#ffc900] text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50">
                    {profileLoading ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                  <button type="button" onClick={() => setEditProfileModalOpen(false)} className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all">
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {editingService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setEditingService(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-gray-900 bg-cyan-50 flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 uppercase">Edit Layanan Joki</h2>
                <button onClick={() => setEditingService(null)} className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdateService} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Nama Layanan</label>
                  <input required type="text" value={editNamaLayanan} onChange={e => setEditNamaLayanan(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Deskripsi Layanan</label>
                  <textarea required rows={2} value={editDeskripsi} onChange={e => setEditDeskripsi(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl p-4 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Harga per Hari (Rp)</label>
                  <input required type="number" value={editHargaPerHari} onChange={e => setEditHargaPerHari(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Rank Dari</label>
                    <input required type="text" value={editRankDari} onChange={e => setEditRankDari(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Rank Ke</label>
                    <input required type="text" value={editRankKe} onChange={e => setEditRankKe(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={serviceUpdateLoading} className="flex-1 py-3 bg-[#ffc900] text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50">
                    {serviceUpdateLoading ? 'Menyimpan...' : 'Simpan Layanan'}
                  </button>
                  <button type="button" onClick={() => setEditingService(null)} className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all">
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Service Confirmation Modal */}
      <AnimatePresence>
        {deletingService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setDeletingService(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#ef4444] w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-3 bg-red-500 border-b-[3px] border-gray-900" />
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 border-[3px] border-red-500 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#ef4444]">
                  <svg width="32" height="32" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">Hapus Layanan?</h3>
                <p className="text-sm font-bold text-gray-500 mb-4">Anda akan menghapus layanan:</p>
                <p className="font-black text-gray-900 text-md bg-gray-100 border-2 border-gray-900 px-3 py-1.5 rounded-lg inline-block shadow-[2px_2px_0px_#111827] mb-6">
                  {deletingService.nama_layanan}
                </p>

                <div className="flex gap-3">
                  <button onClick={handleDeleteService} disabled={serviceDeleteLoading} className="flex-1 py-3 bg-red-500 text-white font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50">
                    {serviceDeleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                  <button onClick={() => setDeletingService(null)} className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all">
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Bank Account Modal */}
      <AnimatePresence>
        {showAddBankModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowAddBankModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-gray-900 bg-green-50 flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 uppercase">Tambah Rekening Baru</h2>
                <button onClick={() => setShowAddBankModal(false)} className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddBankAccount} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Tipe Akun</label>
                  <select value={newBankTipe} onChange={e => setNewBankTipe(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                    <option value="bank">Bank Transfer</option>
                    <option value="ewallet">E-Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Nama Bank / Provider E-Wallet</label>
                  <input required type="text" placeholder="Contoh: BCA, BNI, Mandiri, OVO, Gopey, Dana" value={newBankNama} onChange={e => setNewBankNama(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Nomor Rekening / No HP</label>
                  <input required type="text" placeholder="Masukkan nomor rekening atau nomor e-wallet" value={newBankNomor} onChange={e => setNewBankNomor(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Nama Pemilik Rekening</label>
                  <input required type="text" placeholder="Nama lengkap sesuai terdaftar di rekening" value={newBankPemilik} onChange={e => setNewBankPemilik(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Kode Bank (Opsional)</label>
                  <input type="text" placeholder="Contoh: 014 (BCA), 009 (BNI)" value={newBankKode} onChange={e => setNewBankKode(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={addingBank} className="flex-1 py-3 bg-[#ffc900] text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50">
                    {addingBank ? 'Menyimpan...' : 'Simpan Rekening'}
                  </button>
                  <button type="button" onClick={() => setShowAddBankModal(false)} className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all">
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-gray-900 bg-cyan-50 flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 uppercase">Pengajuan Tarik Saldo</h2>
                <button onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-px hover:shadow-none hover:bg-gray-100 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleWithdrawRequest} className="p-6 space-y-4">
                <div className="bg-cyan-50 border-2 border-gray-900 p-4 rounded-xl text-xs font-bold text-cyan-900">
                  <p>Saldo Tersedia: <span className="font-black text-sm">Rp {(walletInfo?.saldo || 0).toLocaleString('id-ID')}</span></p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Pilih Rekening Tujuan</label>
                  {bankAccounts.length === 0 ? (
                    <div className="p-3 border-[3px] border-red-500 rounded-xl bg-red-50 text-red-700 text-xs font-bold text-center">
                      Belum ada rekening. Silakan tambahkan rekening bank terlebih dahulu di tab Keuangan.
                    </div>
                  ) : (
                    <select value={selectedBankId || ''} onChange={e => setSelectedBankId(Number(e.target.value))} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                      <option value="" disabled>-- Pilih Rekening bank --</option>
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.id} disabled={b.is_verified === false}>
                          {b.nama_bank} - {b.nomor_rekening} A.N {b.nama_pemilik} {b.is_verified === false ? '(Belum Terverifikasi)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Jumlah Penarikan (Rp)</label>
                  <input required type="number" placeholder="Masukkan jumlah dana yang ingin ditarik" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1.5 font-bold">Catatan (Opsional)</label>
                  <textarea rows={2} placeholder="Tuliskan catatan tambahan untuk admin jika perlu" value={withdrawNote} onChange={e => setWithdrawNote(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl p-4 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={withdrawSubmitting || !selectedBankId} className="flex-1 py-3 bg-[#ffc900] text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50">
                    {withdrawSubmitting ? 'Mengirim...' : 'Ajukan Penarikan'}
                  </button>
                  <button type="button" onClick={() => setShowWithdrawModal(false)} className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all">
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
