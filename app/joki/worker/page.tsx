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
import Link from 'next/link'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
    reader.readAsDataURL(file)
  })
}

export default function WorkerDashboard() {
  const { success: showSuccess, error: showError } = useToast()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<JokiOrder[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'wallet' | 'invitations'>('overview')

  // Financial Stats & Wallet data
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [walletStats, setWalletStats] = useState<any>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([])
  const [withdrawHistoryLoading, setWithdrawHistoryLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [isReseller, setIsReseller] = useState(true)

  // Helper calculations for dashboard statistics
  const completedOrders = orders.filter(o => ['confirmed', 'completed', 'done'].includes(o.status?.toLowerCase()))
  const activeOrders = orders.filter(o => ['paid', 'in_progress'].includes(o.status?.toLowerCase()))

  const getWorkerLevel = () => {
    const completedCount = completedOrders.length
    if (completedCount >= 15) return { title: '👑 GLOBAL MYTHIC', badge: 'MYTHIC', desc: 'Bebas Potongan Admin' }
    if (completedCount >= 8) return { title: '⭐ LEGENDARY', badge: 'LEGEND', desc: 'Potongan Admin 2%' }
    if (completedCount >= 3) return { title: '🥈 EPIC', badge: 'EPIC', desc: 'Potongan Admin 3%' }
    return { title: '🥉 WARRIOR', badge: 'WARRIOR', desc: 'Potongan Admin 5%' }
  }
  const workerLevel = getWorkerLevel()

  const getLevelProgress = () => {
    const count = completedOrders.length
    if (count >= 15) {
      return { progress: 100, label: 'Tingkat Maksimal Tercapai!', nextLevel: '👑 GLOBAL MYTHIC' }
    }
    if (count >= 8) {
      const needed = 15 - count
      const pct = Math.round(((count - 8) / 7) * 100)
      return { progress: pct, label: `${needed} order lagi untuk mencapai GLOBAL MYTHIC`, nextLevel: '👑 GLOBAL MYTHIC' }
    }
    if (count >= 3) {
      const needed = 8 - count
      const pct = Math.round(((count - 3) / 5) * 100)
      return { progress: pct, label: `${needed} order lagi untuk mencapai LEGENDARY`, nextLevel: '⭐ LEGENDARY' }
    }
    const needed = 3 - count
    const pct = Math.round((count / 3) * 100)
    return { progress: pct, label: `${needed} order lagi untuk mencapai EPIC`, nextLevel: '🥈 EPIC' }
  }
  const levelProgress = getLevelProgress()

  // Registration form
  const [namaLengkap, setNamaLengkap] = useState('')
  const [noHp, setNoHp] = useState('')
  const [bio, setBio] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState('')
  const [isDraggingFoto, setIsDraggingFoto] = useState(false)
  const [inviteCode, setInviteCode] = useState('')

  // New service form (Joki Products API)
  const [availableGames, setAvailableGames] = useState<any[]>([])
  const [selectedGameId, setSelectedGameId] = useState('')
  const [namaLayanan, setNamaLayanan] = useState('')
  const [kategoriJoki, setKategoriJoki] = useState('Rank')
  const [deskripsi, setDeskripsi] = useState('')
  const [hargaPerHari, setHargaPerHari] = useState('')
  const [minimalOrder, setMinimalOrder] = useState('1')
  const [gambarProdukFile, setGambarProdukFile] = useState<File | null>(null)
  const [gambarProdukPreview, setGambarProdukPreview] = useState('')
  const [isDraggingGambarProduk, setIsDraggingGambarProduk] = useState(false)
  const [jokiProducts, setJokiProducts] = useState<any[]>([])

  // Sub-product management states
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null)
  const [subFormProdukId, setSubFormProdukId] = useState<number | null>(null)
  const [subNamaSub, setSubNamaSub] = useState('')
  const [subSatuan, setSubSatuan] = useState('rank')
  const [subHargaPerUnit, setSubHargaPerUnit] = useState('')
  const [subMinUnit, setSubMinUnit] = useState('1')
  const [subMaxUnit, setSubMaxUnit] = useState('')
  const [subLoading, setSubLoading] = useState(false)

  // Edit sub-product states
  const [editingSub, setEditingSub] = useState<any | null>(null)
  const [editSubNamaSub, setEditSubNamaSub] = useState('')
  const [editSubSatuan, setEditSubSatuan] = useState('rank')
  const [editSubHargaPerUnit, setEditSubHargaPerUnit] = useState('')
  const [editSubMinUnit, setEditSubMinUnit] = useState('1')
  const [editSubMaxUnit, setEditSubMaxUnit] = useState('')
  const [editSubLoading, setEditSubLoading] = useState(false)

  const totalViews = jokiProducts?.reduce((sum, s) => sum + (s.is_active ? 25 : 12), 0) || 0

  // Edit Profile Form States
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
  const [editNamaLengkap, setEditNamaLengkap] = useState('')
  const [editNoHp, setEditNoHp] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editFotoUrl, setEditFotoUrl] = useState('')
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null)
  const [editFotoPreview, setEditFotoPreview] = useState('')
  const [isDraggingEditFoto, setIsDraggingEditFoto] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  // Edit Service Form States (Joki Products API)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [editGameId, setEditGameId] = useState('')
  const [editNamaLayanan, setEditNamaLayanan] = useState('')
  const [editKategoriJoki, setEditKategoriJoki] = useState('')
  const [editDeskripsi, setEditDeskripsi] = useState('')
  const [editHargaPerHari, setEditHargaPerHari] = useState('')
  const [editMinimalOrder, setEditMinimalOrder] = useState('1')
  const [editGambarProdukFile, setEditGambarProdukFile] = useState<File | null>(null)
  const [editGambarProdukPreview, setEditGambarProdukPreview] = useState('')
  const [isDraggingEditGambar, setIsDraggingEditGambar] = useState(false)
  const [editIsActive, setEditIsActive] = useState(true)
  const [serviceUpdateLoading, setServiceUpdateLoading] = useState(false)

  // Delete Service States
  const [deletingService, setDeletingService] = useState<any | null>(null)
  const [serviceDeleteLoading, setServiceDeleteLoading] = useState(false)

  // Worker Invitations States
  const [invitations, setInvitations] = useState<any[]>([])
  const [invitationLoading, setInvitationLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [newInviteCode, setNewInviteCode] = useState('')

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

  // Order Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionModalConfig, setActionModalConfig] = useState({
    title: '',
    description: '',
    inputType: 'none' as 'none' | 'text' | 'number',
    inputPlaceholder: '',
    confirmText: '',
    confirmColor: 'bg-blue-600',
    onConfirm: (val: string) => {}
  })
  const [actionModalValue, setActionModalValue] = useState('')

  const fetchAvailableGames = async () => {
    try {
      const res = await authFetch('/api-proxy/games')
      if (res.ok) {
        const data = await res.json()
        const payload = data?.data ?? data
        const rawGames = Array.isArray(payload) ? payload : payload?.games
        if (Array.isArray(rawGames)) {
          setAvailableGames(rawGames)
          if (rawGames.length > 0) {
            setSelectedGameId(String(rawGames[0].id))
          }
        }
      }
    } catch (err) {
      console.error('Error fetching games:', err)
    }
  }

  const fetchJokiProducts = async (workerId: number) => {
    try {
      // Use public endpoint which includes subs (sub-products) in response
      const res = await authFetch(`/api-proxy/joki-produk?id_worker=${workerId}`)
      if (res.ok) {
        const data = await res.json()
        const rawList = data.data ?? data ?? []
        console.log('[worker] fetchJokiProducts raw:', JSON.stringify(rawList).slice(0, 1000))
        // Normalize: backend may return sub-products under various keys
        const normalized = (Array.isArray(rawList) ? rawList : []).map((item: any) => ({
          ...item,
          subs: item.subs
            || item.JokiSubProduks
            || item.joki_sub_produks
            || item.sub_produks
            || item.SubProduks
            || item.sub_products
            || item.SubProducts
            || item.subProducts
            || []
        }))
        setJokiProducts(normalized)
      }
    } catch (err) {
      console.error('Error fetching joki products:', err)
      showError('Gagal memuat produk joki')
    }
  }

  const fetchInvitations = async () => {
    setInvitationLoading(true)
    try {
      const res = await authFetch('/api-proxy/workers/me/invitations')
      if (res.ok) {
        const data = await res.json()
        setInvitations(data.data ?? data ?? [])
      }
    } catch (err) {
      console.error('Error fetching invitations:', err)
    } finally {
      setInvitationLoading(false)
    }
  }

  const fetchProfileAndOrders = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api-proxy/workers/me/profile')
      if (res.ok) {
        const data = await res.json()
        const workerProfile = data.data
        setProfile(workerProfile)

        if (workerProfile) {
          fetchAvailableGames()
          fetchJokiProducts(workerProfile.id)
          fetchInvitations()
        }

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

  const fetchWorkerLocalWallet = () => {
    if (!profile) return
    setWalletLoading(true)

    const completedCount = completedOrders.length
    let feePercent = 0.05
    if (completedCount >= 15) feePercent = 0
    else if (completedCount >= 8) feePercent = 0.02
    else if (completedCount >= 3) feePercent = 0.03

    const totalNetEarnings = completedOrders.reduce((sum, o) => {
      const fee = o.harga * feePercent
      return sum + (o.harga - fee)
    }, 0)

    const localBanksKey = `worker_banks_${profile.id}`
    const localWithdrawKey = `worker_withdrawals_${profile.id}`

    const banks = JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem(localBanksKey) || '[]') : '[]')
    const withdrawals = JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem(localWithdrawKey) || '[]') : '[]')

    setBankAccounts(banks)
    setWithdrawRecords(withdrawals)

    const pendingWd = withdrawals
      .filter((w: any) => ['pending', 'processing'].includes(w.status?.toLowerCase()))
      .reduce((sum: number, w: any) => sum + w.jumlah, 0)

    const completedWd = withdrawals
      .filter((w: any) => ['completed', 'approved'].includes(w.status?.toLowerCase()))
      .reduce((sum: number, w: any) => sum + w.jumlah, 0)

    const activeOrdersEscrow = activeOrders.reduce((sum, o) => sum + (o.harga * (1 - feePercent)), 0)

    const saldoTersedia = Math.max(0, totalNetEarnings - completedWd - pendingWd)

    setWalletInfo({
      saldo: saldoTersedia,
      saldo_tertahan: activeOrdersEscrow,
      saldo_proses_withdraw: pendingWd,
      saldo_total: saldoTersedia + activeOrdersEscrow + pendingWd,
      total_penarikan: completedWd,
      total_pendapatan: totalNetEarnings,
      total_belum_dicairkan: saldoTersedia
    })

    setWalletStats({
      saldo: saldoTersedia,
      total_pendapatan: totalNetEarnings,
      total_penarikan: completedWd,
      pendapatan_bulan_ini: totalNetEarnings,
      grafik_pendapatan: [
        { label: 'Bulan Ini', jumlah: totalNetEarnings }
      ]
    })

    setWalletLoading(false)

    const verifiedBanks = banks.filter((b: any) => b.is_verified !== false)
    const primary = verifiedBanks.find((b: any) => b.is_primary) || verifiedBanks[0]
    if (primary) setSelectedBankId(primary.id)
    else setSelectedBankId(null)
  }

  const fetchWalletAndHistory = () => {
    fetchWorkerLocalWallet()
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
  }, [profile, orders])

  // Open Edit Profile Modal and prefill data
  const handleOpenEditProfile = () => {
    if (!profile) return
    setEditNamaLengkap(profile.nama_lengkap || '')
    setEditNoHp(profile.no_hp || '')
    setEditBio(profile.bio || '')
    setEditFotoUrl(profile.foto_url || '')
    setEditFotoFile(null)
    setEditFotoPreview(profile.foto_url ? resolveImageUrl(profile.foto_url) : '')
    setEditProfileModalOpen(true)
  }

  // Open Edit Service Modal and prefill data
  const handleOpenEditService = (svc: any) => {
    const rawHarga = svc.harga || svc.harga_per_hari || 0
    setEditingService(svc)
    setEditGameId(String(svc.id_games || svc.game?.id || ''))
    setEditNamaLayanan(svc.nama_produk || svc.nama_layanan || '')
    setEditKategoriJoki(svc.kategori_joki || 'Rank')
    setEditDeskripsi(svc.deskripsi || '')
    setEditHargaPerHari(rawHarga ? Number(rawHarga).toLocaleString('id-ID') : '')
    setEditMinimalOrder(String(svc.minimal_order || '1'))
    setEditGambarProdukFile(null)
    setEditGambarProdukPreview(svc.gambar_produk ? resolveImageUrl(svc.gambar_produk) : '')
    setEditIsActive(svc.is_active !== false)
  }

  // Format harga jadi Rupiah
  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value.replace(/\D/g, '')
    if (val) {
      setter(parseInt(val).toLocaleString('id-ID'))
    } else {
      setter('')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let base64Foto = ''
      if (fotoFile) {
        base64Foto = await fileToBase64(fotoFile)
      }

      const res = await authFetch('/api-proxy/workers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: namaLengkap,
          no_hp: noHp,
          bio: bio,
          foto_url: base64Foto || null,
          invite_code: inviteCode ? inviteCode.trim() : undefined
        })
      })
      if (res.ok) {
        showSuccess('Berhasil mendaftar jadi worker!')
        setFotoFile(null)
        setFotoPreview('')
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
      let finalFotoUrl = editFotoUrl
      if (editFotoFile) {
        finalFotoUrl = await fileToBase64(editFotoFile)
      }

      const res = await authFetch('/api-proxy/workers/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: editNamaLengkap,
          no_hp: editNoHp,
          bio: editBio,
          foto_url: finalFotoUrl || null
        })
      })
      if (res.ok) {
        showSuccess('Profil berhasil diperbarui!')
        setEditFotoFile(null)
        setEditFotoPreview('')
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
    if (!profile) return
    try {
      let base64Gambar = ''
      if (gambarProdukFile) {
        base64Gambar = await fileToBase64(gambarProdukFile)
      }

      const res = await authFetch('/api-proxy/joki-produk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_games: Number(selectedGameId),
          nama_produk: namaLayanan,
          kategori_joki: kategoriJoki,
          deskripsi: deskripsi,
          harga: 0,
          minimal_order: 1,
          gambar_produk: base64Gambar || null
        })
      })
      if (res.ok) {
        showSuccess('Layanan joki berhasil ditambahkan!')
        setNamaLayanan('')
        setDeskripsi('')
        setHargaPerHari('')
        setMinimalOrder('1')
        setGambarProdukFile(null)
        setGambarProdukPreview('')
        fetchJokiProducts(profile.id)
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
    if (!editingService || !profile) return
    setServiceUpdateLoading(true)
    try {
      let base64Gambar = null
      if (editGambarProdukFile) {
        base64Gambar = await fileToBase64(editGambarProdukFile)
      }

      const res = await authFetch(`/api-proxy/joki-produk/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_games: Number(editGameId),
          nama_produk: editNamaLayanan,
          kategori_joki: editKategoriJoki,
          deskripsi: editDeskripsi,
          harga: 0,
          minimal_order: 1,
          is_active: editIsActive,
          ...(base64Gambar ? { gambar_produk: base64Gambar } : {})
        })
      })
      if (res.ok) {
        showSuccess('Layanan joki berhasil diperbarui!')
        setEditingService(null)
        fetchJokiProducts(profile.id)
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
    if (!deletingService || !profile) return
    setServiceDeleteLoading(true)
    try {
      const res = await authFetch(`/api-proxy/joki-produk/${deletingService.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showSuccess('Layanan joki berhasil dihapus!')
        setDeletingService(null)
        fetchJokiProducts(profile.id)
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

  // Sub-product CRUD handlers
  const resetSubForm = () => {
    setSubNamaSub('')
    setSubSatuan('rank')
    setSubHargaPerUnit('')
    setSubMinUnit('1')
    setSubMaxUnit('')
  }

  const handleAddSubProduct = async (produkId: number) => {
    if (!profile) return
    setSubLoading(true)
    try {
      const res = await authFetch(`/api-proxy/joki-produk/${produkId}/sub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_sub: subNamaSub,
          satuan: subSatuan,
          harga_per_unit: Number(subHargaPerUnit.replace(/\D/g, '')),
          min_unit: Number(subMinUnit) || 1,
          max_unit: subMaxUnit ? Number(subMaxUnit) : null
        })
      })
      if (res.ok) {
        showSuccess('Sub-produk berhasil ditambahkan!')
        resetSubForm()
        setSubFormProdukId(null)
        fetchJokiProducts(profile.id)
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal menambahkan sub-produk')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal menambahkan sub-produk')
    } finally {
      setSubLoading(false)
    }
  }

  const handleUpdateSubProduct = async (produkId: number, subId: number) => {
    if (!profile) return
    setEditSubLoading(true)
    try {
      const res = await authFetch(`/api-proxy/joki-produk/${produkId}/sub/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_sub: editSubNamaSub,
          satuan: editSubSatuan,
          harga_per_unit: Number(editSubHargaPerUnit.replace(/\D/g, '')),
          min_unit: Number(editSubMinUnit) || 1,
          max_unit: editSubMaxUnit ? Number(editSubMaxUnit) : null
        })
      })
      if (res.ok) {
        showSuccess('Sub-produk berhasil diperbarui!')
        setEditingSub(null)
        fetchJokiProducts(profile.id)
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal memperbarui sub-produk')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal memperbarui sub-produk')
    } finally {
      setEditSubLoading(false)
    }
  }

  const handleDeleteSubProduct = async (produkId: number, subId: number) => {
    if (!confirm('Hapus sub-produk ini?')) return
    try {
      const res = await authFetch(`/api-proxy/joki-produk/${produkId}/sub/${subId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showSuccess('Sub-produk berhasil dihapus!')
        if (profile) fetchJokiProducts(profile.id)
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal menghapus sub-produk')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal menghapus sub-produk')
    }
  }

  const openEditSub = (sub: any) => {
    setEditingSub(sub)
    setEditSubNamaSub(sub.nama_sub || '')
    setEditSubSatuan(sub.satuan || 'rank')
    const rawHarga = sub.harga_per_unit || 0
    setEditSubHargaPerUnit(rawHarga ? Number(rawHarga).toLocaleString('id-ID') : '')
    setEditSubMinUnit(String(sub.min_unit || 1))
    setEditSubMaxUnit(sub.max_unit ? String(sub.max_unit) : '')
  }

  const handleGenerateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteSubmitting(true)
    setNewInviteCode('')
    try {
      const res = await authFetch('/api-proxy/workers/me/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail ? inviteEmail.trim() : null
        })
      })

      if (res.ok) {
        const data = await res.json()
        const code = data?.data?.code ?? data?.code
        if (code) {
          setNewInviteCode(code)
          showSuccess('Kode undangan berhasil dibuat!')
          setInviteEmail('')
          fetchInvitations()
        } else {
          showError('Gagal membuat kode undangan')
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        showError(errData.message || errData.error || 'Gagal membuat kode undangan')
      }
    } catch (err) {
      console.error(err)
      showError('Gagal membuat kode undangan')
    } finally {
      setInviteSubmitting(false)
    }
  }

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingBank(true)
    try {
      const localBanksKey = `worker_banks_${profile?.id}`
      const currentBanks = JSON.parse(localStorage.getItem(localBanksKey) || '[]')
      const newBank = {
        id: Date.now(),
        nama_bank: newBankNama,
        tipe: newBankTipe,
        nomor_rekening: newBankNomor,
        nama_pemilik: newBankPemilik,
        kode_bank: newBankKode || undefined,
        is_primary: currentBanks.length === 0,
        is_verified: true
      }
      const updated = [...currentBanks, newBank]
      localStorage.setItem(localBanksKey, JSON.stringify(updated))
      showSuccess('Rekening bank berhasil ditambahkan!')
      setNewBankNama('')
      setNewBankNomor('')
      setNewBankPemilik('')
      setNewBankKode('')
      setShowAddBankModal(false)
      fetchWorkerLocalWallet()
    } catch (err: any) {
      showError(err.message || 'Gagal menambahkan rekening bank')
    } finally {
      setAddingBank(false)
    }
  }

  const handleDeleteBankAccount = async (bankId: number) => {
    if (!confirm('Yakin ingin menghapus rekening ini?')) return
    try {
      const localBanksKey = `worker_banks_${profile?.id}`
      const currentBanks = JSON.parse(localStorage.getItem(localBanksKey) || '[]')
      const updated = currentBanks.filter((b: any) => b.id !== bankId)
      if (updated.length > 0 && !updated.some((b: any) => b.is_primary)) {
        updated[0].is_primary = true
      }
      localStorage.setItem(localBanksKey, JSON.stringify(updated))
      showSuccess('Rekening bank berhasil dihapus!')
      fetchWorkerLocalWallet()
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus rekening bank')
    }
  }

  const handleSetPrimaryBank = async (bankId: number) => {
    try {
      const localBanksKey = `worker_banks_${profile?.id}`
      const currentBanks = JSON.parse(localStorage.getItem(localBanksKey) || '[]')
      const updated = currentBanks.map((b: any) => ({
        ...b,
        is_primary: b.id === bankId
      }))
      localStorage.setItem(localBanksKey, JSON.stringify(updated))
      showSuccess('Rekening bank utama berhasil diatur!')
      fetchWorkerLocalWallet()
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
      const localWithdrawKey = `worker_withdrawals_${profile?.id}`
      const currentWds = JSON.parse(localStorage.getItem(localWithdrawKey) || '[]')
      const localBanksKey = `worker_banks_${profile?.id}`
      const currentBanks = JSON.parse(localStorage.getItem(localBanksKey) || '[]')
      const selectedBank = currentBanks.find((b: any) => b.id === selectedBankId)

      const newWd = {
        id: Date.now(),
        jumlah: amount,
        status: 'pending',
        catatan_reseller: withdrawNote || undefined,
        bank_account: selectedBank,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const updated = [newWd, ...currentWds]
      localStorage.setItem(localWithdrawKey, JSON.stringify(updated))
      showSuccess('Penarikan dana berhasil diajukan!')
      setWithdrawAmount('')
      setWithdrawNote('')
      setShowWithdrawModal(false)
      fetchWorkerLocalWallet()

      // Auto approve after 3 seconds for local simulation
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const wds = JSON.parse(localStorage.getItem(localWithdrawKey) || '[]')
          const wdIdx = wds.findIndex((w: any) => w.id === newWd.id)
          if (wdIdx !== -1 && wds[wdIdx].status === 'pending') {
            wds[wdIdx].status = 'completed'
            wds[wdIdx].updatedAt = new Date().toISOString()
            localStorage.setItem(localWithdrawKey, JSON.stringify(wds))
            fetchWorkerLocalWallet()
          }
        }
      }, 3000)

    } catch (err: any) {
      showError(err.message || 'Gagal mengajukan penarikan')
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  const handleCancelWithdrawal = async (withdrawId: number) => {
    if (!confirm('Batalkan pengajuan penarikan ini?')) return
    try {
      const localWithdrawKey = `worker_withdrawals_${profile?.id}`
      const currentWds = JSON.parse(localStorage.getItem(localWithdrawKey) || '[]')
      const updated = currentWds.map((w: any) => {
        if (w.id === withdrawId) {
          return { ...w, status: 'cancelled', updatedAt: new Date().toISOString() }
        }
        return w
      })
      localStorage.setItem(localWithdrawKey, JSON.stringify(updated))
      showSuccess('Pengajuan penarikan dibatalkan!')
      fetchWorkerLocalWallet()
    } catch (err: any) {
      showError(err.message || 'Gagal membatalkan penarikan')
    }
  }

  const updateOrderStatus = async (orderId: number, action: 'set-durasi' | 'done', payloadData?: any) => {
    try {
      let body;
      if (action === 'set-durasi') {
        body = JSON.stringify({ durasi_hari: payloadData });
      } else if (action === 'done') {
        body = JSON.stringify({ catatan: payloadData });
      }
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

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    showSuccess(`${label} berhasil disalin!`)
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
        <div className="mb-10 bg-white border-[3px] border-gray-900 p-6 sm:p-8 rounded-2xl shadow-[6px_6px_0px_#111827] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-3 bg-[#ffc900] border-r-[3px] border-gray-900" />
          <div className="pl-3">
            <span className="bg-[#ff90e8] border-2 border-gray-900 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded shadow-[2px_2px_0px_#111827] uppercase tracking-wider mb-2.5 inline-block">
              🎮 AREA PROFESSIONAL WORKER
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">Worker Dashboard</h1>
            <p className="text-gray-500 font-bold text-xs sm:text-sm mt-1">Kelola layanan joki, pantau orderan aktif, dan tarik pendapatan Anda.</p>
          </div>
          {profile && (
            <div className="flex gap-2 shrink-0 pl-3 md:pl-0">
              <button
                onClick={handleOpenEditProfile}
                className="bg-cyan-300 border-[3px] border-gray-900 px-5 py-3 font-black uppercase shadow-[4px_4px_0px_#111827] text-xs sm:text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
              >
                <span>⚙️</span>
                <span>Edit Profil</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-[4px] border-gray-900 border-t-[#ffc900] rounded-full animate-spin mb-4" />
            <p className="font-black text-sm uppercase text-gray-500 tracking-wider">Memuat data worker...</p>
          </div>
        ) : !profile ? (
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 sm:p-10 shadow-[8px_8px_0_#111827] max-w-2xl mx-auto relative overflow-hidden">
            {/* Retro header tape */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#ffc900] via-[#ff90e8] to-[#90e0ff] border-b-[3px] border-gray-900" />
            
            <div className="mb-8">
              <span className="bg-[#ff90e8] border-2 border-gray-900 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded shadow-[2px_2px_0px_#111827] uppercase tracking-wider mb-3 inline-block">
                🚀 REGISTER AS PROFESSIONAL
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-gray-900 tracking-tight mt-1">Daftar Jadi Worker</h2>
              <p className="text-gray-500 font-bold text-xs sm:text-sm mt-2 pl-3 border-l-4 border-[#ff90e8]">
                Mulailah karir joki game profesional Anda. Lengkapi form berikut untuk mendaftar.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block font-black text-xs uppercase tracking-wider mb-2 text-gray-700">Nama Lengkap</label>
                  <input 
                    required 
                    type="text" 
                    value={namaLengkap} 
                    onChange={e => setNamaLengkap(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 font-bold bg-white focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] focus:bg-[#ff90e8]/5 transition-all duration-200" 
                    placeholder="Masukkan nama lengkap Anda" 
                  />
                </div>
                <div>
                  <label className="block font-black text-xs uppercase tracking-wider mb-2 text-gray-700">Nomor HP / WhatsApp</label>
                  <input 
                    required 
                    type="text" 
                    value={noHp} 
                    onChange={e => setNoHp(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 font-bold bg-white focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] focus:bg-[#ff90e8]/5 transition-all duration-200" 
                    placeholder="Contoh: 081234567890" 
                  />
                </div>
                <div>
                  <label className="block font-black text-xs uppercase tracking-wider mb-2 text-gray-700">Kode Undangan (Opsional)</label>
                  <input 
                    type="text" 
                    value={inviteCode} 
                    onChange={e => setInviteCode(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 font-bold bg-white focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] focus:bg-[#ff90e8]/5 transition-all duration-200" 
                    placeholder="INV-XXXXX" 
                  />
                </div>
              </div>
              <div>
                <label className="block font-black text-xs uppercase tracking-wider mb-2 text-gray-700">Bio Singkat & Pengalaman</label>
                <textarea 
                  required 
                  rows={4} 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  className="w-full border-[3px] border-gray-900 rounded-xl p-4 font-bold bg-white focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] focus:bg-[#ff90e8]/5 transition-all resize-none duration-200" 
                  placeholder="Tuliskan skill game, prestasi, atau pengalaman joki Anda (cth: Joki ML rank Mythical Glory, win rate 80%)" 
                />
              </div>
              <div>
                <label className="block font-black text-xs uppercase tracking-wider mb-2 text-gray-700">Foto Profil (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => {
                    const file = e.target.files?.[0] || null
                    setFotoFile(file)
                    if (file) setFotoPreview(URL.createObjectURL(file))
                  }} 
                  className="hidden" 
                  id="worker-foto-register" 
                />
                <label
                  htmlFor="worker-foto-register"
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFoto(true) }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingFoto(false) }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDraggingFoto(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file && file.type.startsWith('image/')) {
                      setFotoFile(file)
                      setFotoPreview(URL.createObjectURL(file))
                    }
                  }}
                  className={`flex flex-col items-center justify-center w-full border-[3px] border-dashed border-gray-900 rounded-xl py-6 px-4 cursor-pointer transition-all group ${
                    isDraggingFoto 
                      ? 'bg-purple-50 border-purple-500 shadow-[4px_4px_0px_#a855f7]' 
                      : 'bg-white hover:bg-[#ff90e8]/5 hover:shadow-[4px_4px_0px_#ff90e8]'
                  }`}
                >
                  {fotoPreview ? (
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-14 h-14 border-[3px] border-gray-900 rounded-xl overflow-hidden shrink-0 shadow-[2px_2px_0px_#111827]">
                        <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-black text-gray-900 truncate">{fotoFile?.name || 'Foto profil terpilih'}</p>
                        <p className="text-[10px] font-black text-[#ff90e8] uppercase tracking-wider mt-1">Klik untuk mengganti foto</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-[#ff90e8] transition-colors mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Pilih atau Seret Foto Profil</p>
                    </>
                  )}
                </label>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-[#ffc900] border-[3px] border-gray-900 py-3.5 font-black uppercase shadow-[4px_4px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <span>Daftar Sekarang</span>
                <span>&rarr;</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Tab Navigation Menu */}
            <div className="flex border-b-[3px] border-gray-900 gap-2 overflow-x-auto pb-px scrollbar-none">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-3.5 font-black uppercase text-xs sm:text-sm tracking-wider border-t-[3px] border-x-[3px] border-gray-900 rounded-t-xl transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-[#ffc900] text-gray-900 -translate-y-px shadow-[0px_4px_0px_#ffc900]'
                    : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:translate-y-[-2px]'
                }`}
              >
                📋 Overview
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-5 py-3.5 font-black uppercase text-xs sm:text-sm tracking-wider border-t-[3px] border-x-[3px] border-gray-900 rounded-t-xl transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'services'
                    ? 'bg-[#ff90e8] text-gray-900 -translate-y-px shadow-[0px_4px_0px_#ff90e8]'
                    : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:translate-y-[-2px]'
                }`}
              >
                🛠️ Layanan Joki
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`px-5 py-3.5 font-black uppercase text-xs sm:text-sm tracking-wider border-t-[3px] border-x-[3px] border-gray-900 rounded-t-xl transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'wallet'
                    ? 'bg-cyan-300 text-gray-900 -translate-y-px shadow-[0px_4px_0px_#67e8f9]'
                    : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:translate-y-[-2px]'
                }`}
              >
                🏦 Dompet & Penarikan
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`px-5 py-3.5 font-black uppercase text-xs sm:text-sm tracking-wider border-t-[3px] border-x-[3px] border-gray-900 rounded-t-xl transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'invitations'
                    ? 'bg-purple-300 text-gray-900 -translate-y-px shadow-[0px_4px_0px_#a855f7]'
                    : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:translate-y-[-2px]'
                }`}
              >
                ✉️ Undang Worker
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Saldo Tersedia */}
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                    <div className="absolute top-0 right-0 bg-green-500 text-gray-900 font-black text-[9px] px-2.5 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                      Siap Tarik
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Saldo Tersedia</span>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight truncate">
                      Rp {(walletInfo?.saldo || 0).toLocaleString('id-ID')}
                    </p>
                    {walletInfo && (walletInfo.saldo_tertahan > 0 || walletInfo.saldo_proses_withdraw > 0) && (
                      <div className="mt-2 space-y-1 bg-gray-50 border-2 border-dashed border-gray-300 p-2 rounded-lg text-[9px] font-bold">
                        {walletInfo.saldo_tertahan > 0 && (
                          <p className="text-orange-600 flex justify-between">
                            <span>Ditahan (Escrow):</span>
                            <span>Rp {walletInfo.saldo_tertahan.toLocaleString('id-ID')}</span>
                          </p>
                        )}
                        {walletInfo.saldo_proses_withdraw > 0 && (
                          <p className="text-blue-600 flex justify-between">
                            <span>Proses WD:</span>
                            <span>Rp {walletInfo.saldo_proses_withdraw.toLocaleString('id-ID')}</span>
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase">
                        {walletInfo ? `Total Pendapatan: Rp ${(walletInfo.total_pendapatan || 0).toLocaleString('id-ID')}` : 'Cair instan'}
                      </span>
                      <button 
                        onClick={() => setActiveTab('wallet')}
                        className="text-[10px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded"
                      >
                        Tarik &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Total Selesai */}
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white font-black text-[9px] px-2.5 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                      Sukses
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Selesai</span>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                      {completedOrders.length} <span className="text-sm font-bold text-gray-500">Orderan</span>
                    </p>
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                      <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                        ↗ Garansi Pekerjaan Selesai
                      </span>
                    </div>
                  </div>

                  {/* Layanan Aktif */}
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                    <div className="absolute top-0 right-0 bg-purple-500 text-white font-black text-[9px] px-2.5 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                      Live
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Layanan Joki</span>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                      {jokiProducts?.length || 0} <span className="text-sm font-bold text-gray-500">Layanan</span>
                    </p>
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                      <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                        👁 Total {totalViews} Dilihat
                      </span>
                    </div>
                  </div>

                  {/* Tingkat Worker */}
                  <div className="border-[3px] border-gray-900 rounded-2xl p-6 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all bg-gradient-to-br from-[#ffc900]/10 via-[#ff90e8]/10 to-[#90e0ff]/10">
                    <div className="absolute top-0 right-0 bg-[#ff90e8] text-gray-900 font-black text-[9px] px-2.5 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                      VIP
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tingkat Worker</span>
                    <p className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight uppercase">
                      {workerLevel.title}
                    </p>
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                      <span className="text-[10px] font-bold text-gray-600">
                        {workerLevel.desc}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pendapatan Bulan Ini Banner */}
                {(walletStats || walletInfo) && (
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[4px_4px_0px_#111827] flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 bottom-0 right-0 w-32 bg-stripes bg-[#ff90e8]/10 opacity-60 pointer-events-none" />
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Pendapatan Bulan Ini</span>
                      <p className="text-3xl font-black text-green-600">
                        Rp {(walletStats?.pendapatan_bulan_ini || walletInfo?.total_pendapatan || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-green-100 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_#111827] shrink-0">
                      <span className="text-2xl">📈</span>
                    </div>
                  </div>
                )}

                {/* Seksi Analytics & Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Progress Target Joki */}
                  <div className="lg:col-span-2 bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4 gap-2">
                        <div>
                          <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Progres Kenaikan Tingkat</h3>
                          <p className="text-xs font-bold text-gray-500 leading-normal">{levelProgress.label}</p>
                        </div>
                        <span className="bg-[#ffc900] text-gray-900 font-black text-xs px-3 py-1.5 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] whitespace-nowrap">
                          {completedOrders.length} Order Selesai
                        </span>
                      </div>
                      
                      {/* Target Progress Bar */}
                      <div className="w-full bg-gray-100 border-[3px] border-gray-900 rounded-xl h-7 relative overflow-hidden mb-6 shadow-[2px_2px_0px_#111827]">
                        <div 
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-[#ff90e8] h-full border-r-[3px] border-gray-900 transition-all duration-1000"
                          style={{ width: `${levelProgress.progress}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center font-black text-[9px] sm:text-[10px] text-gray-900 uppercase tracking-wider mix-blend-difference">
                          {levelProgress.progress}% MENUJU {levelProgress.nextLevel}
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* Rincian Game Joki */}
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 border-t border-dashed border-gray-200 pt-4">Distribusi Game Joki</h4>
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
                                <span className="w-28 text-xs font-bold text-gray-700 truncate uppercase">{game}</span>
                                <div className="flex-1 bg-gray-50 border-2 border-gray-900 rounded-lg h-4 overflow-hidden shadow-[1px_1px_0px_#111827]">
                                  <div className="bg-[#ff90e8] h-full border-r-2 border-gray-900" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[10px] font-black text-gray-900 w-8 text-right bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded shrink-0">{count}</span>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Tips Jadi Worker Top */}
                  <div className="bg-gradient-to-br from-[#ff90e8]/5 to-[#ff90e8]/10 border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827] flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#ff90e8]/20 rounded-full" />
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 bg-[#ffc900] border-2 border-gray-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#111827] rotate-3">
                          <span className="text-sm">💡</span>
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Tips Jadi Worker Top</h3>
                      </div>
                      <ul className="space-y-4 text-xs font-bold text-gray-700">
                        <li className="flex gap-2.5 items-start">
                          <span className="text-purple-600 font-black text-sm shrink-0">✔</span>
                          <span className="leading-relaxed">Berikan estimasi pengerjaan yang jujur & tepat waktu.</span>
                        </li>
                        <li className="flex gap-2.5 items-start">
                          <span className="text-purple-600 font-black text-sm shrink-0">✔</span>
                          <span className="leading-relaxed">Selalu komunikasikan progress joki Anda via chat.</span>
                        </li>
                        <li className="flex gap-2.5 items-start">
                          <span className="text-purple-600 font-black text-sm shrink-0">✔</span>
                          <span className="leading-relaxed">Jaga kerahasiaan & keamanan data login akun client Anda.</span>
                        </li>
                        <li className="flex gap-2.5 items-start">
                          <span className="text-purple-600 font-black text-sm shrink-0">✔</span>
                          <span className="leading-relaxed">Perbarui status pengerjaan secara real-time demi kenyamanan pelanggan.</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-6 border-t border-dashed border-gray-200 pt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                      GameHub.ID Partner Program
                    </div>
                  </div>
                </div>

                {/* Profil & Orderan Aktif */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Worker Profile Card */}
                  <div className="lg:col-span-1 bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0px_#111827] h-fit relative overflow-hidden">
                    <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-gray-100 pb-2 flex items-center gap-2">
                      <span>👤</span>
                      <span>Profil Saya</span>
                    </h3>
                    <div className="flex items-center gap-4 mb-5 bg-gray-50 border-2 border-gray-900 p-3 rounded-xl shadow-[2px_2px_0px_#111827]">
                      {profile.foto_url ? (
                        <div className="w-14 h-14 border-2 border-gray-900 rounded-lg overflow-hidden shrink-0 shadow-[1.5px_1.5px_0_#111827]">
                          <img src={resolveImageUrl(profile.foto_url)} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-blue-600 border-2 border-gray-900 rounded-lg flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0_#111827]">
                          <span className="text-white font-black text-lg">{profile.nama_lengkap.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-black text-sm uppercase truncate tracking-tight">{profile.nama_lengkap}</h4>
                        <p className="text-[10px] text-gray-500 font-bold truncate">@{profile.user?.username || 'username'}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-xs font-bold">
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 uppercase">Status:</span>
                        <span className="uppercase text-blue-600 font-black px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">{profile.status}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-100">
                        <span className="text-gray-500 uppercase">WhatsApp:</span>
                        <span className="text-gray-800 font-black">{profile.no_hp || '—'}</span>
                      </div>
                      <div className="flex flex-col mt-3">
                        <span className="text-gray-500 uppercase text-[10px] mb-1.5 tracking-wider block">Bio & Pengalaman:</span>
                        <span className="text-gray-600 font-medium bg-gray-50 p-3.5 border-2 border-gray-900 rounded-xl leading-relaxed text-xs block max-h-48 overflow-y-auto">
                          {profile.bio || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Jobs Section */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-lg font-black uppercase flex items-center gap-2">
                        <span>⚡</span>
                        <span>Orderan Aktif</span>
                      </h3>
                      <span className="bg-gray-900 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-[2.5px_2.5px_0_#ff90e8] uppercase tracking-wider">
                        {orders.filter(o => ['paid', 'in_progress'].includes(o.status)).length} Pekerjaan
                      </span>
                    </div>

                    {orders.filter(o => ['paid', 'in_progress'].includes(o.status)).length === 0 ? (
                      <div className="bg-white border-[3px] border-dashed border-gray-400 p-10 rounded-2xl text-center shadow-[4px_4px_0_#111827] flex flex-col items-center justify-center">
                        <span className="text-3xl mb-2 block">😴</span>
                        <p className="font-black text-gray-400 uppercase text-xs tracking-wider">Tidak ada pekerjaan aktif saat ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {orders.filter(o => ['paid', 'in_progress'].includes(o.status)).map(order => (
                          <div key={order.id} className="bg-white border-[3px] border-gray-900 p-5 sm:p-6 rounded-2xl shadow-[5px_5px_0px_#111827] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_#111827] transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 left-0 h-1.5 bg-blue-500" />
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 border-b-2 border-gray-100 pb-3 mt-1">
                              <div>
                                <h4 className="font-black text-md uppercase text-blue-600 tracking-tight">{order.invoice_number}</h4>
                                <span className="inline-block bg-[#ff90e8]/20 border border-[#ff90e8]/45 text-[#9d174d] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider mt-1">
                                  🎮 {order.nama_games}
                                </span>
                              </div>
                              <span className={`font-black uppercase text-[10px] px-2.5 py-1 rounded border-2 border-gray-900 shadow-[1.5px_1.5px_0_#111827] ${
                                order.status === 'in_progress' ? 'bg-cyan-300 text-cyan-950 animate-pulse' : 'bg-[#ffc900] text-yellow-950'
                              }`}>
                                {order.status === 'in_progress' ? '⚡ Sedang Dikerjakan' : '💰 Belum Dikerjakan'}
                              </span>
                            </div>
                            
                            {/* Mobile Safe Grid Layout */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="bg-gray-50 border-2 border-gray-900 rounded-xl p-3">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Login Via</span>
                                <p className="font-black text-gray-900 uppercase text-xs">{order.login_type || '-'}</p>
                              </div>
                              
                              <div className="bg-gray-50 border-2 border-gray-900 rounded-xl p-3 relative">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Username / Email</span>
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-bold text-gray-900 text-xs truncate select-all">{order.game_username || order.game_email || '-'}</p>
                                  {(order.game_username || order.game_email) && (
                                    <button 
                                      type="button"
                                      onClick={() => copyToClipboard(order.game_username || order.game_email || '', 'Username')}
                                      className="text-[9px] font-black uppercase text-blue-600 bg-white border border-gray-300 hover:border-gray-900 px-1.5 py-0.5 rounded transition-all shrink-0 hover:-translate-y-px hover:shadow-[1px_1px_0_#111827]"
                                    >
                                      Salin
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 border-2 border-gray-900 rounded-xl p-3 relative">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Password</span>
                                <div className="flex items-center justify-between gap-1">
                                  <p className="font-bold text-gray-900 text-xs truncate select-all">{order.game_password || '-'}</p>
                                  {order.game_password && (
                                    <button 
                                      type="button"
                                      onClick={() => copyToClipboard(order.game_password || '', 'Password')}
                                      className="text-[9px] font-black uppercase text-blue-600 bg-white border border-gray-300 hover:border-gray-900 px-1.5 py-0.5 rounded transition-all shrink-0 hover:-translate-y-px hover:shadow-[1px_1px_0_#111827]"
                                    >
                                      Salin
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 border-2 border-gray-900 rounded-xl p-3">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Target Rank</span>
                                <p className="font-black text-gray-900 text-xs">{order.rank_saat_ini} ➡️ {order.rank_target}</p>
                              </div>

                              <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-gray-50 border-2 border-gray-900 rounded-xl p-3.5">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Catatan Client</span>
                                <p className="font-bold text-gray-700 leading-relaxed text-xs">{order.catatan_user || 'Tidak ada catatan.'}</p>
                              </div>

                              <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center justify-between bg-blue-50/50 border-2 border-dashed border-gray-900 rounded-xl p-3">
                                <span className="text-[10px] font-black uppercase text-gray-500">Tarif / Pendapatan:</span>
                                <span className="text-xs sm:text-sm font-black text-blue-700">Rp {Number(order.harga || 0).toLocaleString('id-ID')}</span>
                              </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
                              {order.room_chat_id && (
                                <Link href={`/chat/${order.room_chat_id}`} className="w-full sm:w-auto bg-blue-200 border-[3px] border-gray-900 px-5 py-2.5 font-black uppercase text-xs shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-1.5 text-blue-900">
                                  💬 Chat Client
                                </Link>
                              )}
                              {order.status === 'paid' && (
                                <button 
                                  onClick={() => {
                                    setActionModalConfig({
                                      title: 'Mulai Pengerjaan',
                                      description: 'Berapa hari estimasi pengerjaan joki ini?',
                                      inputType: 'number',
                                      inputPlaceholder: 'Contoh: 3',
                                      confirmText: 'Mulai Sekarang',
                                      confirmColor: 'bg-[#ffc900]',
                                      onConfirm: (val) => updateOrderStatus(order.id, 'set-durasi', Number(val))
                                    })
                                    setActionModalValue('')
                                    setActionModalOpen(true)
                                  }}
                                  className="w-full sm:w-auto bg-[#ffc900] border-[3px] border-gray-900 px-5 py-2.5 font-black uppercase text-xs shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
                                >
                                  🚀 Mulai Pengerjaan
                                </button>
                              )}
                              {order.status === 'in_progress' && (
                                <button 
                                  onClick={() => {
                                    setActionModalConfig({
                                      title: 'Selesaikan Pekerjaan',
                                      description: 'Tulis catatan penyelesaian order ini.',
                                      inputType: 'text',
                                      inputPlaceholder: 'Contoh: Sudah push ke Legend',
                                      confirmText: 'Selesai',
                                      confirmColor: 'bg-green-400',
                                      onConfirm: (val) => updateOrderStatus(order.id, 'done', val)
                                    })
                                    setActionModalValue('')
                                    setActionModalOpen(true)
                                  }}
                                  className="w-full sm:w-auto bg-green-400 border-[3px] border-gray-900 px-5 py-2.5 font-black uppercase text-xs shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
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
                  <h3 className="text-lg font-black uppercase flex items-center gap-2">
                    <span>🛠️</span>
                    <span>Daftar Layanan Joki Anda</span>
                  </h3>
                  
                  {jokiProducts && jokiProducts.length > 0 ? (
                    <div className="space-y-5">
                      {jokiProducts.map(svc => (
                        <div key={svc.id} className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[4px_4px_0px_#111827] relative hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#111827] transition-all overflow-hidden">
                          <div className="p-5">
                            <div className="flex gap-4 items-start">
                              {svc.gambar_produk && (
                                <div className="w-20 h-20 border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[2px_2px_0px_#111827] bg-gray-100 shrink-0">
                                  <img src={resolveImageUrl(svc.gambar_produk)} alt={svc.nama_produk || svc.nama_layanan} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                  <span className="inline-block bg-[#ff90e8] border-2 border-gray-900 px-2.5 py-0.5 text-[9px] font-black uppercase shadow-[1.5px_1.5px_0_#111827] text-gray-900">
                                    🎮 {svc.game?.nama_games || svc.game?.slug_games || 'game'}
                                  </span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border border-gray-900 shadow-[1px_1px_0_#111827] uppercase shrink-0 ${
                                    svc.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {svc.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                </div>
                                <h4 className="font-black text-md uppercase mb-1 text-gray-900 tracking-tight leading-snug">{svc.nama_produk || svc.nama_layanan}</h4>
                                {svc.deskripsi && <p className="text-[11px] text-gray-500 font-bold leading-relaxed line-clamp-2">{svc.deskripsi}</p>}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="bg-purple-50 border border-purple-200 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded uppercase">{svc.kategori_joki || 'Rank'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sub-products section */}
                          <div className="border-t-[3px] border-dashed border-gray-200">
                            <button
                              type="button"
                              onClick={() => setExpandedServiceId(expandedServiceId === svc.id ? null : svc.id)}
                              className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
                                📦 Sub-Produk ({svc.subs?.length || 0})
                              </span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${expandedServiceId === svc.id ? 'rotate-180' : ''}`}>
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </button>

                            {expandedServiceId === svc.id && (
                              <div className="px-5 pb-5 space-y-3 bg-gray-50/50">
                                {svc.subs && svc.subs.length > 0 ? (
                                  <div className="space-y-2 pt-2">
                                    {svc.subs.map((sub: any) => (
                                      <div key={sub.id} className="bg-white border-2 border-gray-900 rounded-xl p-3 shadow-[2px_2px_0px_#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        {editingSub?.id === sub.id ? (
                                          /* Inline edit sub-product form */
                                          <div className="w-full space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                              <input
                                                type="text" required
                                                placeholder="Nama sub"
                                                value={editSubNamaSub}
                                                onChange={e => setEditSubNamaSub(e.target.value)}
                                                className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600"
                                              />
                                              <select
                                                value={editSubSatuan}
                                                onChange={e => setEditSubSatuan(e.target.value)}
                                                className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600 bg-white"
                                              >
                                                <option value="rank">rank</option>
                                                <option value="bintang">bintang</option>
                                                <option value="level">level</option>
                                                <option value="tier">tier</option>
                                                <option value="match">match</option>
                                              </select>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                              <input
                                                type="text" required
                                                placeholder="Harga/unit"
                                                value={editSubHargaPerUnit}
                                                onChange={e => handleHargaChange(e, setEditSubHargaPerUnit)}
                                                className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600"
                                              />
                                              <input
                                                type="number" min="1"
                                                placeholder="Min"
                                                value={editSubMinUnit}
                                                onChange={e => setEditSubMinUnit(e.target.value)}
                                                className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600"
                                              />
                                              <input
                                                type="number" min="1"
                                                placeholder="Max (kosong=∞)"
                                                value={editSubMaxUnit}
                                                onChange={e => setEditSubMaxUnit(e.target.value)}
                                                className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600"
                                              />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                              <button
                                                type="button"
                                                disabled={editSubLoading}
                                                onClick={() => handleUpdateSubProduct(svc.id, sub.id)}
                                                className="bg-green-300 border-2 border-gray-900 text-green-900 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase disabled:opacity-50"
                                              >
                                                {editSubLoading ? '...' : 'Simpan'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingSub(null)}
                                                className="bg-gray-100 border-2 border-gray-900 text-gray-700 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase"
                                              >
                                                Batal
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          /* Display sub-product row */
                                          <>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-xs uppercase text-gray-900">{sub.nama_sub}</span>
                                                <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{sub.satuan}</span>
                                              </div>
                                              <div className="flex flex-wrap gap-3 text-[10px] font-bold text-gray-500">
                                                <span>💰 Rp {Number(sub.harga_per_unit).toLocaleString('id-ID')} / {sub.satuan}</span>
                                                <span>📏 Min: {sub.min_unit || 1}</span>
                                                {sub.max_unit && <span>Max: {sub.max_unit}</span>}
                                              </div>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => openEditSub(sub)}
                                                className="bg-blue-50 border border-gray-900 text-blue-700 text-[9px] font-black px-2 py-1 rounded hover:bg-blue-100 transition-colors uppercase"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteSubProduct(svc.id, sub.id)}
                                                className="bg-red-50 border border-gray-900 text-red-600 text-[9px] font-black px-2 py-1 rounded hover:bg-red-100 transition-colors uppercase"
                                              >
                                                Hapus
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <p className="text-[11px] font-bold text-gray-400">Belum ada sub-produk. Tambahkan untuk menentukan tarif per unit.</p>
                                  </div>
                                )}

                                {/* Inline add sub-product form */}
                                {subFormProdukId === svc.id ? (
                                  <div className="bg-[#ffc900]/10 border-2 border-[#ffc900] rounded-xl p-3 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">＋ Tambah Sub-Produk Baru</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text" required
                                        placeholder="Nama sub (cth: Grandmaster)"
                                        value={subNamaSub}
                                        onChange={e => setSubNamaSub(e.target.value)}
                                        className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600 bg-white"
                                      />
                                      <select
                                        value={subSatuan}
                                        onChange={e => setSubSatuan(e.target.value)}
                                        className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600 bg-white"
                                      >
                                        <option value="rank">rank</option>
                                        <option value="bintang">bintang</option>
                                        <option value="level">level</option>
                                        <option value="tier">tier</option>
                                        <option value="match">match</option>
                                      </select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <input
                                        type="text" required
                                        placeholder="Harga per unit"
                                        value={subHargaPerUnit}
                                        onChange={e => handleHargaChange(e, setSubHargaPerUnit)}
                                        className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600 bg-white"
                                      />
                                      <input
                                        type="number" min="1"
                                        placeholder="Min unit"
                                        value={subMinUnit}
                                        onChange={e => setSubMinUnit(e.target.value)}
                                        className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600 bg-white"
                                      />
                                      <input
                                        type="number" min="1"
                                        placeholder="Max (kosong=∞)"
                                        value={subMaxUnit}
                                        onChange={e => setSubMaxUnit(e.target.value)}
                                        className="border-2 border-gray-900 rounded-lg px-2.5 py-2 text-[11px] font-bold focus:outline-none focus:border-blue-600 bg-white"
                                      />
                                    </div>
                                    <div className="flex gap-2 justify-end pt-1">
                                      <button
                                        type="button"
                                        disabled={subLoading || !subNamaSub || !subHargaPerUnit}
                                        onClick={() => handleAddSubProduct(svc.id)}
                                        className="bg-[#ffc900] border-2 border-gray-900 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase disabled:opacity-50"
                                      >
                                        {subLoading ? 'Menyimpan...' : 'Simpan Sub-Produk'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setSubFormProdukId(null); resetSubForm() }}
                                        className="bg-white border-2 border-gray-900 text-gray-700 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => { setSubFormProdukId(svc.id); resetSubForm() }}
                                    className="w-full py-2.5 border-2 border-dashed border-gray-400 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-500 hover:border-[#ffc900] hover:text-gray-900 hover:bg-[#ffc900]/10 transition-all"
                                  >
                                    ＋ Tambah Sub-Produk
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="border-t-[3px] border-gray-900 px-5 py-3 bg-gray-50 flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEditService(svc)}
                              className="bg-blue-100 border-2 border-gray-900 text-blue-800 text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-blue-200 shadow-[2px_2px_0px_#111827] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase"
                            >
                              Edit Produk
                            </button>
                            <button
                              onClick={() => setDeletingService(svc)}
                              className="bg-red-100 border-2 border-gray-900 text-red-700 text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-red-200 shadow-[2px_2px_0px_#111827] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border-[3px] border-dashed border-gray-400 p-10 rounded-2xl text-center shadow-[4px_4px_0_#111827] flex flex-col items-center justify-center">
                      <span className="text-3xl mb-2 block">😔</span>
                      <p className="font-black text-red-500 uppercase text-xs tracking-wider">Belum ada layanan joki yang terdaftar.</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1.5 leading-normal">Silakan gunakan form di samping untuk menambahkan layanan joki baru.</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Add Service form */}
                <div className="lg:col-span-1">
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 sm:p-6 shadow-[6px_6px_0px_#111827] relative">
                    <h3 className="text-md font-black uppercase mb-5 pb-2.5 border-b-2 border-gray-100 flex items-center gap-2">
                      <span className="bg-[#ffc900] w-6 h-6 border-2 border-gray-900 rounded flex items-center justify-center text-xs shadow-[1.5px_1.5px_0_#111827] font-black">＋</span>
                      Tambah Layanan Baru
                    </h3>
                    
                    <form onSubmit={handleAddService} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Pilih Game</label>
                        <select
                          required
                          value={selectedGameId}
                          onChange={e => setSelectedGameId(e.target.value)}
                          className="w-full border-[3px] border-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all"
                        >
                          {availableGames.map(game => (
                            <option key={game.id} value={game.id}>
                              {game.nama_games ?? game.nama_game ?? game.name ?? game.slug_games}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Nama Layanan</label>
                        <input 
                          required 
                          placeholder="Contoh: Joki ML Epic ke Mythic" 
                          value={namaLayanan} 
                          onChange={e => setNamaLayanan(e.target.value)} 
                          className="w-full border-[3px] border-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Kategori Joki</label>
                        <select
                          required
                          value={kategoriJoki}
                          onChange={e => setKategoriJoki(e.target.value)}
                          className="w-full border-[3px] border-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all"
                        >
                          <option value="Rank">Rank</option>
                          <option value="Paket">Paket</option>
                          <option value="Paket Rank">Paket Rank</option>
                          <option value="per-bintang">Per Bintang</option>
                          <option value="Flat">Flat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Deskripsi Layanan</label>
                        <textarea 
                          required 
                          placeholder="Tulis rincian layanan & garansi pengerjaan" 
                          value={deskripsi} 
                          onChange={e => setDeskripsi(e.target.value)} 
                          className="w-full border-[3px] border-gray-900 rounded-xl p-3.5 text-xs font-bold bg-white focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all resize-none" 
                          rows={3} 
                        />
                      </div>
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">💡 Tips Tarif</p>
                        <p className="text-[10px] font-bold text-gray-500 leading-relaxed">Tarif ditentukan lewat Sub-Produk. Setelah membuat produk, tambahkan sub-produk (contoh: Grandmaster - Rp 5.000 / rank).</p>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Gambar Produk (Opsional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0] || null
                            setGambarProdukFile(file)
                            if (file) setGambarProdukPreview(URL.createObjectURL(file))
                          }}
                          className="hidden"
                          id="joki-gambar-produk"
                        />
                        <label
                          htmlFor="joki-gambar-produk"
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingGambarProduk(true) }}
                          onDragLeave={(e) => { e.preventDefault(); setIsDraggingGambarProduk(false) }}
                          onDrop={(e) => {
                            e.preventDefault()
                            setIsDraggingGambarProduk(false)
                            const file = e.dataTransfer.files?.[0]
                            if (file && file.type.startsWith('image/')) {
                              setGambarProdukFile(file)
                              setGambarProdukPreview(URL.createObjectURL(file))
                            }
                          }}
                          className={`flex flex-col items-center justify-center w-full border-[3px] border-dashed border-gray-900 rounded-xl py-5 px-3 cursor-pointer transition-all group ${
                            isDraggingGambarProduk
                              ? 'bg-purple-50 border-purple-500 shadow-[3px_3px_0px_#a855f7]'
                              : 'bg-white hover:bg-[#ff90e8]/5 hover:shadow-[3px_3px_0px_#ff90e8]'
                          }`}
                        >
                          {gambarProdukPreview ? (
                            <div className="flex items-center gap-3 w-full">
                              <div className="w-12 h-12 border-[2.5px] border-gray-900 rounded-lg overflow-hidden shrink-0 shadow-[1.5px_1.5px_0px_#111827]">
                                <img src={gambarProdukPreview} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <p className="text-[10px] font-black text-gray-900 truncate">{gambarProdukFile?.name || 'Gambar terpilih'}</p>
                                <p className="text-[8px] font-black text-[#ff90e8] uppercase tracking-wider mt-0.5">Ganti Gambar</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-[#ff90e8] transition-colors mb-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Seret atau Klik Unggah Gambar</p>
                            </>
                          )}
                        </label>
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-[#ffc900] border-[3px] border-gray-900 py-3.5 font-black uppercase shadow-[3px_3px_0px_#111827] text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5 tracking-wider mt-3"
                      >
                        <span>Tambah Layanan</span>
                        <span>&rarr;</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Wallet */}
            {activeTab === 'wallet' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-[#ffc900] border-[3px] border-gray-900 p-6 rounded-2xl shadow-[6px_6px_0px_#111827] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#111827] transition-all">
                    <div className="flex flex-col">
                      <span className="bg-black text-[#ffc900] text-[9px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#ffc900] uppercase tracking-wider mb-3 self-start">
                        SALDO TERSEDIA
                      </span>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 truncate">
                        Rp {(walletInfo?.saldo || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button
                      disabled={!walletInfo || walletInfo.saldo <= 0}
                      onClick={() => setShowWithdrawModal(true)}
                      className="mt-6 w-full text-center bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-black uppercase text-xs py-3.5 rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#ff90e8] disabled:shadow-none hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0px_#ff90e8] disabled:translate-none transition-all disabled:opacity-50"
                    >
                      💸 Tarik Saldo Sekarang
                    </button>
                  </div>

                  <div className="bg-[#ff90e8] border-[3px] border-gray-900 p-6 rounded-2xl shadow-[6px_6px_0px_#111827] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#111827] transition-all">
                    <div className="flex flex-col">
                      <span className="bg-black text-[#ff90e8] text-[9px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#ff90e8] uppercase tracking-wider mb-3 self-start">
                        SALDO DITAHAN (ESCROW)
                      </span>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 truncate">
                        Rp {(walletInfo?.saldo_tertahan || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-800 font-bold mt-6 leading-relaxed bg-white/40 border border-black/10 p-2.5 rounded-xl">
                      * Saldo dari orderan yang belum selesai dikerjakan atau belum dikonfirmasi oleh pembeli.
                    </p>
                  </div>

                  <div className="bg-cyan-300 border-[3px] border-gray-900 p-6 rounded-2xl shadow-[6px_6px_0px_#111827] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_#111827] transition-all">
                    <div className="flex flex-col">
                      <span className="bg-black text-cyan-300 text-[9px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#67e8f9] uppercase tracking-wider mb-3 self-start">
                        SEDANG DIPROSES
                      </span>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 truncate">
                        Rp {(walletInfo?.saldo_proses_withdraw || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-800 font-bold mt-6 leading-relaxed bg-white/40 border border-black/10 p-2.5 rounded-xl">
                      * Saldo penarikan Anda yang sedang diverifikasi dan ditransfer oleh pihak keuangan GameHub.ID.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Bank Accounts list */}
                  <div className="lg:col-span-1 bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[6px_6px_0px_#111827] h-fit">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b-3 border-gray-900">
                      <h3 className="text-sm font-black uppercase flex items-center gap-2">
                        <span className="bg-[#ffc900] w-6 h-6 border-2 border-gray-900 rounded flex items-center justify-center text-xs shadow-[1.5px_1.5px_0_#111827] font-black">💳</span>
                        Rekening Saya
                      </h3>
                      <button
                        onClick={() => setShowAddBankModal(true)}
                        className="bg-green-300 hover:bg-green-400 border-2 border-gray-900 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_#111827] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#111827] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase"
                      >
                        ＋ Tambah
                      </button>
                    </div>

                    {bankAccounts.length === 0 ? (
                      <div className="bg-white border-[3px] border-dashed border-gray-300 p-8 text-center rounded-2xl">
                        <p className="text-xs text-gray-400 font-bold">Belum ada rekening payout.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bankAccounts.map(bank => (
                          <div key={bank.id} className={`p-4 border-[3px] border-gray-900 rounded-2xl relative transition-all ${
                            bank.is_primary ? 'bg-cyan-50 shadow-[4px_4px_0px_#67e8f9]' : 'bg-white shadow-[3px_3px_0px_#111827]'
                          }`}>
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-dashed border-gray-200">
                              <span className="font-black text-sm uppercase text-gray-900 tracking-tight">{bank.nama_bank}</span>
                              {bank.is_primary ? (
                                <span className="bg-cyan-300 border-2 border-gray-900 text-gray-900 text-[9px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#111827] uppercase tracking-wider">
                                  UTAMA
                                </span>
                              ) : (
                                <span className="bg-gray-100 border-2 border-gray-250 text-gray-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                  TAMBAHAN
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-gray-700 space-y-1.5">
                              <p className="flex justify-between">
                                <span className="text-gray-400 text-[10px] uppercase font-black">No. Rekening</span>
                                <span className="select-all text-gray-950 font-black">{bank.nomor_rekening}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-gray-400 text-[10px] uppercase font-black">Pemilik</span>
                                <span className="text-gray-950 font-black uppercase">{bank.nama_pemilik}</span>
                              </p>
                              <p className="flex justify-between items-center">
                                <span className="text-gray-400 text-[10px] uppercase font-black">Status</span>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black border border-gray-900 ${
                                  bank.is_verified === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {bank.is_verified === false ? 'BELUM DIVERIFIKASI' : 'TERVERIFIKASI'}
                                </span>
                              </p>
                            </div>
                            <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-dashed border-gray-200">
                              {!bank.is_primary && bank.is_verified !== false && (
                                <button
                                  onClick={() => handleSetPrimaryBank(bank.id)}
                                  className="bg-cyan-100 hover:bg-cyan-200 border-2 border-gray-900 text-cyan-800 text-[9px] font-black px-2.5 py-1 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase"
                                >
                                  Utamakan
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBankAccount(bank.id)}
                                className="bg-red-100 hover:bg-red-200 border-2 border-gray-900 text-red-700 text-[9px] font-black px-2.5 py-1 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase"
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
                    <div className="flex justify-between items-center mb-6 pb-3 border-b-3 border-gray-900">
                      <h3 className="text-sm font-black uppercase flex items-center gap-2">
                        <span className="bg-[#ff90e8] w-6 h-6 border-2 border-gray-900 rounded flex items-center justify-center text-xs shadow-[1.5px_1.5px_0_#111827] font-black">📋</span>
                        Riwayat Penarikan Dana
                      </h3>
                    </div>

                    {withdrawHistoryLoading ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-8 h-8 border-[3px] border-gray-900 border-t-cyan-500 rounded-full animate-spin mb-2" />
                        <p className="font-black text-xs uppercase text-gray-500">Memuat riwayat...</p>
                      </div>
                    ) : withdrawRecords.length === 0 ? (
                      <div className="bg-white border-[3px] border-dashed border-gray-300 p-8 text-center rounded-2xl">
                        <p className="text-xs text-gray-400 font-bold">Belum ada catatan pengajuan penarikan dana.</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b-[3px] border-gray-900 bg-gray-50 font-black uppercase text-gray-600">
                                <th className="p-3 border-r-2 border-gray-900">Tanggal</th>
                                <th className="p-3 border-r-2 border-gray-900">Rekening Tujuan</th>
                                <th className="p-3 border-r-2 border-gray-900 text-right">Jumlah</th>
                                <th className="p-3 border-r-2 border-gray-900 text-center">Status</th>
                                <th className="p-3 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {withdrawRecords.map(rec => (
                                <tr key={rec.id} className="border-b-2 border-gray-900 hover:bg-gray-50/50 font-bold text-gray-800 last:border-b-0">
                                  <td className="p-3 truncate border-r-2 border-gray-900 font-bold">
                                    {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                  </td>
                                  <td className="p-3 border-r-2 border-gray-900">
                                    <p className="font-black text-gray-950 uppercase">{rec.bank_account?.nama_bank || '—'}</p>
                                    <p className="text-[10px] text-gray-500 font-black tracking-tight">{rec.bank_account?.nomor_rekening || '—'} A.N {rec.bank_account?.nama_pemilik || '—'}</p>
                                  </td>
                                  <td className="p-3 text-right font-black text-gray-950 border-r-2 border-gray-900 text-sm">
                                    Rp {rec.jumlah.toLocaleString('id-ID')}
                                  </td>
                                  <td className="p-3 text-center border-r-2 border-gray-900">
                                    <div className="flex flex-col items-center">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border-2 border-gray-900 uppercase shadow-[1.5px_1.5px_0px_#111827] ${
                                        rec.status === 'completed' ? 'bg-green-105 text-green-800 border-green-900' :
                                        rec.status === 'pending' ? 'bg-yellow-105 text-yellow-805 border-yellow-900' :
                                        rec.status === 'processing' ? 'bg-blue-105 text-blue-805 border-blue-900' :
                                        rec.status === 'rejected' ? 'bg-red-105 text-red-805 border-red-900' :
                                        'bg-gray-100 text-gray-800 border-gray-400'
                                      }`}>
                                        {rec.status}
                                      </span>
                                      {rec.alasan_penolakan && (
                                        <p className="text-[9px] text-red-600 font-black mt-1 text-center italic max-w-[150px] leading-tight">* {rec.alasan_penolakan}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    {rec.status === 'pending' && (
                                      <button
                                        onClick={() => handleCancelWithdrawal(rec.id)}
                                        className="bg-red-100 border-2 border-gray-900 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-[2px_2px_0px_#111827] hover:bg-red-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#111827] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase"
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

                        {/* Mobile Card List View */}
                        <div className="block md:hidden space-y-4">
                          {withdrawRecords.map(rec => (
                            <div key={rec.id} className="bg-white border-[3px] border-gray-900 rounded-2xl p-4 shadow-[4px_4px_0_#111827] relative">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] text-gray-400 font-black uppercase">
                                  {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border-2 border-gray-900 uppercase shadow-[1.5px_1.5px_0px_#111827] ${
                                  rec.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  rec.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  rec.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  rec.status === 'rejected' ? 'bg-red-100 text-red-805 font-black' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {rec.status}
                                </span>
                              </div>
                              
                              <div className="space-y-1 mb-3">
                                <p className="text-lg font-black text-gray-900">
                                  Rp {rec.jumlah.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[11px] font-bold text-gray-700">
                                  Tujuan: <span className="font-black text-gray-950 uppercase">{rec.bank_account?.nama_bank || '—'}</span> - {rec.bank_account?.nomor_rekening || '—'}
                                </p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase">
                                  A.N: {rec.bank_account?.nama_pemilik || '—'}
                                </p>
                              </div>

                              {rec.alasan_penolakan && (
                                <div className="bg-red-50 border-2 border-red-200 p-2.5 rounded-xl text-[10px] text-red-600 font-bold mb-3 italic">
                                  * Alasan penolakan: {rec.alasan_penolakan}
                                </div>
                              )}

                              {rec.status === 'pending' && (
                                <div className="flex justify-end pt-3 border-t border-dashed border-gray-200">
                                  <button
                                    onClick={() => handleCancelWithdrawal(rec.id)}
                                    className="w-full bg-red-100 border-2 border-gray-900 text-red-700 text-[10px] font-black py-2.5 rounded-xl shadow-[2px_2px_0px_#111827] hover:bg-red-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#111827] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase"
                                  >
                                    Batal Penarikan
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Undang Worker */}
            {activeTab === 'invitations' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {/* Left Column: List of invitations */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-black uppercase flex items-center gap-2">
                    <span>✉️</span>
                    <span>Riwayat Undangan Terkirim</span>
                  </h3>

                  {invitationLoading ? (
                    <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-10 text-center shadow-[4px_4px_0_#111827] flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-[4px] border-gray-900 border-t-[#ffc900] rounded-full animate-spin mb-3" />
                      <p className="font-black text-xs uppercase text-gray-500 tracking-wider">Memuat daftar undangan...</p>
                    </div>
                  ) : invitations && invitations.length > 0 ? (
                    <div className="space-y-4">
                      {invitations.map((inv) => (
                        <div key={inv.id || inv.code} className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#111827] transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <span className="font-black text-md text-gray-900 select-all font-mono bg-gray-100 border-2 border-gray-900 px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_#111827]">
                                {inv.code}
                              </span>
                              <button
                                onClick={() => copyToClipboard(inv.code, 'Kode Undangan')}
                                className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-200 hover:border-gray-900 px-2 py-0.5 rounded transition-all hover:-translate-y-px hover:shadow-[1px_1px_0_#111827]"
                              >
                                Salin
                              </button>
                            </div>
                            <p className="text-xs font-bold text-gray-500">
                              Target: <span className="text-gray-800">{inv.email || 'Siapa saja (Umum)'}</span>
                            </p>
                            {inv.expired_at && (
                              <p className="text-[10px] font-bold text-gray-400">
                                Kadaluarsa: {new Date(inv.expired_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            )}
                            {inv.invitee && (
                              <div className="mt-2 bg-green-50 border-2 border-green-300 p-2 rounded-xl text-[10px] font-bold text-green-800 flex items-center gap-1.5 self-start">
                                <span>🎉</span>
                                <span>Diterima oleh: <strong className="uppercase">{inv.invitee.nama_lengkap}</strong></span>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center">
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase tracking-wider ${
                              inv.status === 'accepted' || inv.invitee
                                ? 'bg-green-300 text-green-950'
                                : inv.status === 'expired'
                                ? 'bg-red-300 text-red-950'
                                : 'bg-[#ffc900] text-yellow-950 animate-pulse'
                            }`}>
                              {inv.status === 'accepted' || inv.invitee ? 'Accepted' : inv.status === 'expired' ? 'Expired' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border-[3px] border-dashed border-gray-400 p-10 rounded-2xl text-center shadow-[4px_4px_0_#111827] flex flex-col items-center justify-center">
                      <span className="text-3xl mb-2 block">✉️</span>
                      <p className="font-black text-gray-400 uppercase text-xs tracking-wider">Belum ada undangan dibuat.</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1.5 leading-normal">
                        Gunakan form di sebelah kanan untuk mengundang worker baru bergabung.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Generate invite code form */}
                <div className="lg:col-span-1">
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 sm:p-6 shadow-[6px_6px_0px_#111827] relative space-y-5">
                    <h3 className="text-md font-black uppercase pb-2.5 border-b-2 border-gray-100 flex items-center gap-2">
                      <span className="bg-purple-300 w-6 h-6 border-2 border-gray-900 rounded flex items-center justify-center text-xs shadow-[1.5px_1.5px_0_#111827] font-black">＋</span>
                      Buat Undangan Baru
                    </h3>

                    <form onSubmit={handleGenerateInvitation} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1.5">Email Calon Worker (Opsional)</label>
                        <input
                          type="email"
                          placeholder="calon-worker@email.com"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          className="w-full border-[3px] border-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ff90e8] transition-all"
                        />
                        <p className="text-[9px] font-bold text-gray-400 mt-1 leading-normal">
                          Kosongkan jika ingin membuat kode undangan umum yang bisa digunakan oleh siapa saja.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={inviteSubmitting}
                        className="w-full bg-[#ff90e8] border-[3px] border-gray-900 py-3.5 font-black uppercase shadow-[3px_3px_0px_#111827] text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5 tracking-wider"
                      >
                        <span>{inviteSubmitting ? 'Memproses...' : 'Buat Kode Undangan'}</span>
                        <span>&rarr;</span>
                      </button>
                    </form>

                    {newInviteCode && (
                      <div className="bg-purple-50 border-[3px] border-purple-950 p-4 rounded-xl shadow-[3px_3px_0px_#a855f7] space-y-2.5 mt-4">
                        <span className="block text-[9px] font-black text-purple-700 uppercase tracking-widest">KODE UNDANGAN ANDA:</span>
                        <div className="flex items-center justify-between bg-white border-2 border-gray-900 p-2.5 rounded-xl shadow-[2px_2px_0px_#111827]">
                          <span className="font-black text-md font-mono select-all text-gray-900">{newInviteCode}</span>
                          <button
                            onClick={() => copyToClipboard(newInviteCode, 'Kode Undangan')}
                            className="bg-purple-400 hover:bg-purple-500 border-2 border-gray-900 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-lg transition-all active:translate-y-px"
                          >
                            Salin
                          </button>
                        </div>
                        <p className="text-[9.5px] font-bold text-purple-900 leading-normal">
                          Bagikan kode di atas kepada calon worker. Kode ini berlaku selama 7 hari.
                        </p>
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
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-gray-900 bg-[#ffc900] flex items-center justify-between">
                <h2 className="text-md font-black text-gray-900 uppercase flex items-center gap-2">
                  <span>📝</span> Edit Profil Worker
                </h2>
                <button 
                  onClick={() => setEditProfileModalOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nama Lengkap</label>
                  <input 
                    required 
                    type="text" 
                    value={editNamaLengkap} 
                    onChange={e => setEditNamaLengkap(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ff90e8] transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nomor HP</label>
                  <input 
                    required 
                    type="text" 
                    value={editNoHp} 
                    onChange={e => setEditNoHp(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ff90e8] transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Bio Singkat</label>
                  <textarea 
                    required 
                    rows={3} 
                    value={editBio} 
                    onChange={e => setEditBio(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl p-4 text-xs font-bold bg-white focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ff90e8] transition-all resize-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Foto Profil</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0] || null
                      setEditFotoFile(file)
                      if (file) setEditFotoPreview(URL.createObjectURL(file))
                    }} 
                    className="hidden" 
                    id="worker-foto-edit" 
                  />
                  <label
                    htmlFor="worker-foto-edit"
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingEditFoto(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingEditFoto(false) }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingEditFoto(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file && file.type.startsWith('image/')) {
                        setEditFotoFile(file)
                        setEditFotoPreview(URL.createObjectURL(file))
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-full border-[3px] border-dashed border-gray-900 rounded-xl py-6 px-4 cursor-pointer transition-all group ${
                      isDraggingEditFoto 
                        ? 'bg-purple-50 border-purple-500 shadow-[4px_4px_0px_#a855f7]' 
                        : 'bg-white hover:bg-[#ff90e8]/5 hover:shadow-[4px_4px_0px_#ff90e8]'
                    }`}
                  >
                    {editFotoPreview ? (
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-14 h-14 border-[3px] border-gray-900 rounded-xl overflow-hidden shrink-0 shadow-[2px_2px_0px_#111827]">
                          <img src={editFotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-xs font-black text-gray-900 truncate">{editFotoFile?.name || 'Foto profil saat ini'}</p>
                          <p className="text-[10px] font-black text-[#ff90e8] uppercase tracking-wider mt-1">Klik untuk mengganti foto</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-[#ff90e8] transition-colors mb-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Pilih atau Seret Foto Profil</p>
                      </>
                    )}
                  </label>
                </div>
                <div className="flex gap-3 pt-4 border-t border-dashed border-gray-200">
                  <button 
                    type="submit" 
                    disabled={profileLoading} 
                    className="flex-1 py-3 bg-[#ffc900] text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50"
                  >
                    {profileLoading ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditProfileModalOpen(false)} 
                    className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
                  >
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
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-gray-900 bg-[#ff90e8] flex items-center justify-between">
                <h2 className="text-md font-black text-gray-900 uppercase flex items-center gap-2">
                  <span>🛠️</span> Edit Layanan Joki
                </h2>
                <button 
                  onClick={() => setEditingService(null)} 
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdateService} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Pilih Game</label>
                  <select
                    required
                    value={editGameId}
                    onChange={e => setEditGameId(e.target.value)}
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all"
                  >
                    {availableGames.map(game => (
                      <option key={game.id} value={game.id}>
                        {game.nama_games ?? game.nama_game ?? game.name ?? game.slug_games}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nama Layanan</label>
                  <input 
                    required 
                    type="text" 
                    value={editNamaLayanan} 
                    onChange={e => setEditNamaLayanan(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Kategori Joki</label>
                  <select
                    required
                    value={editKategoriJoki}
                    onChange={e => setEditKategoriJoki(e.target.value)}
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all"
                  >
                    <option value="Rank">Rank</option>
                    <option value="Paket">Paket</option>
                    <option value="Paket Rank">Paket Rank</option>
                    <option value="per-bintang">Per Bintang</option>
                    <option value="Flat">Flat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Deskripsi Layanan</label>
                  <textarea 
                    required 
                    rows={2} 
                    value={editDeskripsi} 
                    onChange={e => setEditDeskripsi(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl p-4 text-xs font-bold bg-white focus:bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all resize-none" 
                  />
                </div>
                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">📦 Sub-Produk</p>
                  <p className="text-[10px] font-bold text-blue-700 mt-1 leading-relaxed">Kelola sub-produk (tarif per unit) langsung dari kartu layanan di halaman utama tab Layanan Joki.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Gambar Produk (Opsional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null
                      setEditGambarProdukFile(file)
                      if (file) setEditGambarProdukPreview(URL.createObjectURL(file))
                    }}
                    className="hidden"
                    id="joki-edit-gambar-produk"
                  />
                  <label
                    htmlFor="joki-edit-gambar-produk"
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingEditGambar(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingEditGambar(false) }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDraggingEditGambar(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file && file.type.startsWith('image/')) {
                        setEditGambarProdukFile(file)
                        setEditGambarProdukPreview(URL.createObjectURL(file))
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-full border-[3px] border-dashed border-gray-900 rounded-xl py-6 px-4 cursor-pointer transition-all group ${
                      isDraggingEditGambar
                        ? 'bg-purple-50 border-purple-500 shadow-[3px_3px_0px_#a855f7]'
                        : 'bg-white hover:bg-[#ff90e8]/5 hover:shadow-[3px_3px_0px_#ff90e8]'
                    }`}
                  >
                    {editGambarProdukPreview ? (
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-14 h-14 border-[3px] border-gray-900 rounded-xl overflow-hidden shrink-0 shadow-[2px_2px_0px_#111827]">
                          <img src={editGambarProdukPreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-xs font-black text-gray-900 truncate">{editGambarProdukFile?.name || 'Gambar saat ini'}</p>
                          <p className="text-[10px] font-black text-[#ff90e8] uppercase tracking-wider mt-1">Klik untuk mengganti gambar</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-[#ff90e8] transition-colors mb-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Pilih atau Seret Gambar Produk</p>
                      </>
                    )}
                  </label>
                </div>
                <div className="flex items-center gap-3 py-2 bg-gray-50 border-2 border-dashed border-gray-200 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editIsActive}
                    onChange={e => setEditIsActive(e.target.checked)}
                    className="w-5 h-5 accent-gray-900 border-2 border-gray-900 rounded cursor-pointer"
                  />
                  <label htmlFor="editIsActive" className="text-xs font-black uppercase text-gray-900 cursor-pointer select-none">
                    Layanan Aktif / Tampilkan di Publik
                  </label>
                </div>
                <div className="flex gap-3 pt-4 border-t border-dashed border-gray-200">
                  <button 
                    type="submit" 
                    disabled={serviceUpdateLoading} 
                    className="flex-1 py-3 bg-[#ff90e8] text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50"
                  >
                    {serviceUpdateLoading ? 'Menyimpan...' : 'Simpan Layanan'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingService(null)} 
                    className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
                  >
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
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#ef4444] w-full max-w-sm overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-3 bg-red-500 border-b-[3px] border-gray-900" />
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 border-[3px] border-red-500 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#ef4444]">
                  <svg width="32" height="32" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-md font-black text-gray-900 uppercase tracking-wider mb-2">Hapus Layanan Joki?</h3>
                <p className="text-xs font-bold text-gray-500 mb-4">Anda akan menghapus secara permanen:</p>
                <p className="font-black text-gray-900 text-xs bg-gray-150 border-[3px] border-gray-900 px-4 py-2.5 rounded-xl inline-block shadow-[3px_3px_0px_#111827] mb-6">
                  {deletingService.nama_produk || deletingService.nama_layanan}
                </p>

                <div className="flex gap-3 pt-2 border-t border-dashed border-gray-150">
                  <button 
                    onClick={handleDeleteService} 
                    disabled={serviceDeleteLoading} 
                    className="flex-1 py-3 bg-red-500 text-white font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50"
                  >
                    {serviceDeleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                  <button 
                    onClick={() => setDeletingService(null)} 
                    className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
                  >
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
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-gray-900 bg-green-200 flex items-center justify-between">
                <h2 className="text-md font-black text-gray-900 uppercase flex items-center gap-2">
                  <span>💳</span> Tambah Rekening Baru
                </h2>
                <button 
                  onClick={() => setShowAddBankModal(false)} 
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddBankAccount} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Tipe Akun</label>
                  <select 
                    value={newBankTipe} 
                    onChange={e => setNewBankTipe(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="ewallet">E-Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nama Bank / Provider E-Wallet</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Contoh: BCA, BNI, Mandiri, OVO, Gopey, Dana" 
                    value={newBankNama} 
                    onChange={e => setNewBankNama(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nomor Rekening / No HP</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Masukkan nomor rekening atau nomor e-wallet" 
                    value={newBankNomor} 
                    onChange={e => setNewBankNomor(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Nama Pemilik Rekening</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Nama lengkap sesuai terdaftar di rekening" 
                    value={newBankPemilik} 
                    onChange={e => setNewBankPemilik(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Kode Bank (Opsional)</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 014 (BCA), 009 (BNI)" 
                    value={newBankKode} 
                    onChange={e => setNewBankKode(e.target.value)} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ffc900] transition-all" 
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-dashed border-gray-200">
                  <button 
                    type="submit" 
                    disabled={addingBank} 
                    className="flex-1 py-3 bg-[#ffc900] text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50"
                  >
                    {addingBank ? 'Menyimpan...' : 'Simpan Rekening'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddBankModal(false)} 
                    className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
                  >
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
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b-[3px] border-gray-900 bg-cyan-200 flex items-center justify-between">
                <h2 className="text-md font-black text-gray-900 uppercase flex items-center gap-2">
                  <span>💸</span> Pengajuan Tarik Saldo
                </h2>
                <button 
                  onClick={() => setShowWithdrawModal(false)} 
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleWithdrawRequest} className="p-6 space-y-4">
                <div className="bg-cyan-50 border-[3px] border-gray-900 p-4 rounded-xl text-xs font-black text-cyan-900 shadow-[3px_3px_0px_#67e8f9]">
                  <p>Saldo Tersedia: <span className="text-sm font-black text-gray-955">Rp {(walletInfo?.saldo || 0).toLocaleString('id-ID')}</span></p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Pilih Rekening Tujuan</label>
                  {bankAccounts.length === 0 ? (
                    <div className="p-4 border-[3px] border-red-500 rounded-xl bg-red-50 text-red-700 text-xs font-bold text-center shadow-[3px_3px_0px_#ef4444]">
                      Belum ada rekening. Silakan tambahkan rekening bank terlebih dahulu di tab Keuangan.
                    </div>
                  ) : (
                    <select 
                      value={selectedBankId || ''} 
                      onChange={e => setSelectedBankId(Number(e.target.value))} 
                      className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ff90e8] transition-all"
                    >
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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Jumlah Penarikan (Rp)</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="Masukkan jumlah dana yang ingin ditarik" 
                    value={withdrawAmount} 
                    onChange={e => setWithdrawAmount(e.target.value)} 
                    className="w-full border-[3px] border-gray-950 rounded-xl px-4 py-3 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ff90e8] transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Catatan (Opsional)</label>
                  <textarea 
                    rows={2} 
                    placeholder="Tuliskan catatan tambahan untuk admin jika perlu" 
                    value={withdrawNote} 
                    onChange={e => setWithdrawNote(e.target.value)} 
                    className="w-full border-[3px] border-gray-950 rounded-xl p-4 text-xs font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#ff90e8] transition-all resize-none" 
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-dashed border-gray-200">
                  <button 
                    type="submit" 
                    disabled={withdrawSubmitting || !selectedBankId} 
                    className="flex-1 py-3 bg-[#ffc900] text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all disabled:opacity-50"
                  >
                    {withdrawSubmitting ? 'Mengirim...' : 'Ajukan Penarikan'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowWithdrawModal(false)} 
                    className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Generic Action Modal */}
      <AnimatePresence>
        {actionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setActionModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_#111827] w-full max-w-md overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className={`p-5 border-b-[3px] border-gray-900 ${actionModalConfig.confirmColor} flex items-center justify-between`}>
                <h2 className="text-md font-black text-gray-900 uppercase">
                  {actionModalConfig.title}
                </h2>
                <button 
                  onClick={() => setActionModalOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-900 rounded-lg shadow-[1.5px_1.5px_0px_#111827] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_#111827] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-bold text-gray-600">{actionModalConfig.description}</p>
                {actionModalConfig.inputType !== 'none' && (
                  <input 
                    type={actionModalConfig.inputType}
                    autoFocus
                    placeholder={actionModalConfig.inputPlaceholder}
                    value={actionModalValue}
                    onChange={(e) => setActionModalValue(e.target.value)}
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-white focus:outline-none focus:shadow-[3px_3px_0px_#111827] transition-all"
                  />
                )}
                <div className="flex gap-3 pt-4 border-t border-dashed border-gray-200">
                  <button 
                    onClick={() => {
                      if (actionModalConfig.inputType !== 'none' && !actionModalValue.trim()) {
                        showError('Mohon isi kolom yang tersedia')
                        return
                      }
                      actionModalConfig.onConfirm(actionModalValue)
                      setActionModalOpen(false)
                    }}
                    className={`flex-1 py-3 ${actionModalConfig.confirmColor} text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all`}
                  >
                    {actionModalConfig.confirmText}
                  </button>
                  <button 
                    onClick={() => setActionModalOpen(false)} 
                    className="px-6 py-3 bg-white text-gray-900 font-black uppercase tracking-wider text-xs rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1.5px_1.5px_0px_#111827] hover:translate-y-0.5 hover:translate-x-0.5 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
