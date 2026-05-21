'use client'

import { useState, useEffect, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/contexts/ToastContext'
import { authFetch } from '@/lib/authApi'
import { orderAkunApi } from '@/lib/orderAkunApi'
import { walletApi, WalletInfo, WalletTransaction, WalletStats } from '@/lib/walletApi'
import { bankAccountApi, withdrawApi, BankAccount, WithdrawRecord } from '@/lib/withdrawApi'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

type ResellerStatus = 'none' | 'pending' | 'approved' | 'rejected'

interface ResellerData {
  id: number
  nama_lengkap: string
  no_hp: string
  alamat?: string
  ktp_url?: string
  status: ResellerStatus
}



export default function ResellerPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  const router = useRouter()

  const [status, setStatus] = useState<ResellerStatus>('none')
  const [resellerData, setResellerData] = useState<ResellerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form fields pendaftaran
  const [namaLengkap, setNamaLengkap] = useState('')
  const [noHp, setNoHp] = useState('')
  const [alamat, setAlamat] = useState('')
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [ktpPreview, setKtpPreview] = useState('')
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // State khusus Dashboard Approved
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'withdraw'>('overview')
  const [postedAccounts, setPostedAccounts] = useState<any[]>([])
  const [sellerOrders, setSellerOrders] = useState<any[]>([])
  const [filterGame, setFilterGame] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [saldo, setSaldo] = useState(0)
  
  // State Wallet
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null)
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([])
  const [walletTxPage, setWalletTxPage] = useState(1)
  const [walletTxTotalPages, setWalletTxTotalPages] = useState(1)
  const [walletTxFilter, setWalletTxFilter] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)

  // State Modal Penarikan
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([])

  // State Bank Accounts & Withdraw Records
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([])
  const [withdrawRecordsPage, setWithdrawRecordsPage] = useState(1)
  const [withdrawRecordsTotalPages, setWithdrawRecordsTotalPages] = useState(1)
  const [withdrawRecordsLoading, setWithdrawRecordsLoading] = useState(false)
  // State Modal Tambah Rekening
  const [showAddBankModal, setShowAddBankModal] = useState(false)
  const [newBankNama, setNewBankNama] = useState('')
  const [newBankTipe, setNewBankTipe] = useState('bank')
  const [newBankNomor, setNewBankNomor] = useState('')
  const [newBankPemilik, setNewBankPemilik] = useState('')
  const [newBankKode, setNewBankKode] = useState('')
  const [addingBank, setAddingBank] = useState(false)

  // Cek status reseller dan mode demo
  useEffect(() => {
    if (authLoading) return

    // Cek apakah mode demo aktif di localStorage
    const demoMode = localStorage.getItem('reseller_demo_mode')
    if (demoMode === 'true') {
      setStatus('approved')
      setResellerData({
        id: 888,
        nama_lengkap: user?.name || 'Reseller Sultan Demo',
        no_hp: '08123456789',
        status: 'approved'
      })
      setLoading(false)
      return
    }

    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    checkResellerStatus()
  }, [authLoading, isAuthenticated, user])

  const fetchMyAccounts = async () => {
    try {
      const res = await authFetch('/api-proxy/jual-beli-akun/user/my-listings')
      if (res.ok) {
        const data = await res.json()
        const rawData = data.data || []
        const mappedAccounts = rawData.map((item: any) => {
          let parsedScreenshots: any[] = []
          try {
            if (typeof item.screenshots === 'string') {
              parsedScreenshots = JSON.parse(item.screenshots)
            } else if (Array.isArray(item.screenshots)) {
              parsedScreenshots = item.screenshots
            }
          } catch(e) {}

          let firstScreenshotUrl = ''
          if (parsedScreenshots.length > 0) {
            const first = parsedScreenshots[0]
            if (typeof first === 'string') {
              firstScreenshotUrl = first
            } else if (first && typeof first === 'object' && first.url_gambar) {
              firstScreenshotUrl = first.url_gambar
            }
          }
          
          return {
            id: item.id,
            judul: item.nama_post,
            harga: Number(item.harga_jual),
            status: item.status_listing === 'sold' ? 'terjual' : 'tersedia',
            deskripsi: item.deskripsi_detail,
            game: item.accountGame?.nama_game || 'Unknown Game',
            gambar: firstScreenshotUrl 
                    ? resolveImageUrl(firstScreenshotUrl) 
                    : item.accountGame?.gambar_game 
                      ? resolveImageUrl(item.accountGame.gambar_game) 
                      : '',
            views: item.view_count || 0,
            tanggal: item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
          }
        })
        setPostedAccounts(mappedAccounts)
      } else {
        setPostedAccounts([])
      }
    } catch {
      setPostedAccounts([])
    }
  }

  // Fetch seller orders for stats
  const fetchSellerOrders = async () => {
    try {
      const data = (await orderAkunApi.getSellerOrders()) as any
      const orders = Array.isArray(data) ? data : (data.orders || data.data || [])
      setSellerOrders(orders)
    } catch (err) {
      console.error('Fetch seller orders error:', err)
    }
  }

  // Fetch wallet data from /api/wallet endpoints
  const fetchWalletInfo = async () => {
    try {
      const info = await walletApi.getInfo()
      setWalletInfo(info)
      setSaldo(info.saldo || 0)
    } catch (err) {
      console.error('Fetch wallet info error:', err)
      // Fallback: compute saldo from seller orders if wallet API fails
      if (sellerOrders.length > 0) {
        const completedOrders = sellerOrders.filter((o: any) => ['confirmed', 'completed'].includes(o.status?.toLowerCase()))
        const totalSaldo = completedOrders.reduce((acc: number, o: any) => acc + Number(o.harga || o.total_bayar || 0), 0)
        setSaldo(totalSaldo)
      }
    }
  }

  const fetchWalletStats = async () => {
    try {
      const stats = await walletApi.getStats()
      setWalletStats(stats)
    } catch (err) {
      console.error('Fetch wallet stats error:', err)
    }
  }

  const fetchWalletTransactions = async (page = 1, tipe = '') => {
    setWalletLoading(true)
    try {
      const res = await walletApi.getTransactions({ page, tipe: tipe || undefined })
      setWalletTransactions(res.transactions)
      setWalletTxPage(res.page)
      setWalletTxTotalPages(res.total_pages)
    } catch (err) {
      console.error('Fetch wallet transactions error:', err)
    } finally {
      setWalletLoading(false)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const banks = await bankAccountApi.getAll()
      setBankAccounts(banks)
      // Auto-select verified primary, then any verified bank
      const verifiedBanks = banks.filter(b => b.is_verified !== false)
      const primary = verifiedBanks.find(b => b.is_primary) || verifiedBanks[0]
      if (primary) setSelectedBankId(primary.id)
      else setSelectedBankId(null)
    } catch (err) {
      console.error('Fetch bank accounts error:', err)
    }
  }

  const fetchWithdrawRecords = async (page = 1) => {
    setWithdrawRecordsLoading(true)
    try {
      const res = await withdrawApi.getHistory({ page, limit: 10 })
      setWithdrawRecords(res.withdrawals)
      setWithdrawRecordsPage(res.page)
      setWithdrawRecordsTotalPages(res.total_pages)
    } catch (err) {
      console.error('Fetch withdraw records error:', err)
    } finally {
      setWithdrawRecordsLoading(false)
    }
  }

  // Muat data akun postingan & saldo saat dashboard berstatus approved
  useEffect(() => {
    if (status === 'approved') {
      const isDemo = localStorage.getItem('reseller_demo_mode') === 'true'
      if (isDemo) {
        const saved = localStorage.getItem('reseller_posted_accounts')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            setPostedAccounts(parsed)
          } catch {
            setPostedAccounts([])
          }
        } else {
          setPostedAccounts([])
        }
        const savedSaldo = localStorage.getItem('reseller_mock_saldo')
        if (savedSaldo) setSaldo(parseInt(savedSaldo))
      } else {
        fetchMyAccounts()
        fetchSellerOrders()
        fetchWalletInfo()
        fetchWalletStats()
        fetchWalletTransactions()
        fetchBankAccounts()
        fetchWithdrawRecords()
      }
    }
  }, [status])

  const checkResellerStatus = async () => {
    try {
      const res = await authFetch('/api-proxy/resellers/me')
      if (res.ok) {
        const data = await res.json()
        const r = data?.data || data?.reseller || data
        if (r && r.status) {
          setStatus(r.status)
          setResellerData(r)
        }
      }
    } catch {
      // Tidak ada record reseller
    } finally {
      setLoading(false)
    }
  }

  // Fungsi Mode Demo
  const activateDemoMode = () => {
    localStorage.setItem('reseller_demo_mode', 'true')
    setStatus('approved')
    setResellerData({
      id: 888,
      nama_lengkap: user?.name || 'Reseller Sultan Demo',
      no_hp: '08123456789',
      status: 'approved'
    })
    showSuccess('Mode Demo Dashboard Aktif! Selamat mengeksplorasi fitur premium.')
  }

  const exitDemoMode = () => {
    localStorage.removeItem('reseller_demo_mode')
    setStatus('none')
    setResellerData(null)
    showSuccess('Keluar dari Mode Demo.')
  }

  // Fungsi Kamera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      setIsCameraOpen(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.error(e))
        }
      }, 100)
    } catch (err) {
      showError('Gagal mengakses kamera. Pastikan izin kamera diberikan.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'ktp.jpg', { type: 'image/jpeg' })
            setKtpFile(file)
            setKtpPreview(URL.createObjectURL(blob))
            stopCamera()
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleSubmitRegistration = async (e: FormEvent) => {
    e.preventDefault()
    if (!namaLengkap.trim() || !noHp.trim()) {
      showError('Nama lengkap dan nomor HP wajib diisi!')
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('nama_lengkap', namaLengkap.trim())
      fd.append('no_hp', noHp.trim())
      if (alamat.trim()) fd.append('alamat', alamat.trim())
      if (ktpFile) fd.append('ktp', ktpFile)

      const res = await authFetch('/api-proxy/resellers/register', {
        method: 'POST',
        body: fd,
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && (data.success !== false)) {
        showSuccess('Pendaftaran reseller berhasil! Menunggu konfirmasi admin.')
        setStatus('pending')
        setResellerData(data?.data || data?.reseller || data)
      } else {
        // Fallback lokal
        showSuccess('Simulasi Pendaftaran Berhasil (Mode Offline/Fallback).')
        setStatus('pending')
        setResellerData({
          id: Date.now(),
          nama_lengkap: namaLengkap.trim(),
          no_hp: noHp.trim(),
          alamat: alamat.trim(),
          status: 'pending'
        })
      }
    } catch (err) {
      showSuccess('Simulasi Pendaftaran Berhasil (Fallback Lokal).')
      setStatus('pending')
      setResellerData({
        id: Date.now(),
        nama_lengkap: namaLengkap.trim(),
        no_hp: noHp.trim(),
        alamat: alamat.trim(),
        status: 'pending'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ── FUNGSI INTERAKTIF DASHBOARD ──
  const handleToggleStatus = async (id: string) => {
    const isDemo = localStorage.getItem('reseller_demo_mode') === 'true'
    
    // Optimistic update
    const targetAccount = postedAccounts.find(a => a.id === id)
    if (!targetAccount) return
    
    const nextStatus = targetAccount.status === 'tersedia' ? 'terjual' : 'tersedia'
    
    // Bila API hanya support mark as sold
    if (!isDemo && nextStatus === 'terjual') {
      try {
        const res = await authFetch(`/api-proxy/jual-beli-akun/${id}/sold`, { method: 'PUT' })
        if (!res.ok) throw new Error('Gagal update status')
      } catch (err) {
        showError('Gagal mengupdate status di server')
        return
      }
    }

    const updated = postedAccounts.map(a => {
      if (a.id === id) {
        if (nextStatus === 'terjual') {
          if (isDemo) {
            const penambahan = Number(a.harga) || 0
            setSaldo(prev => {
              const current = prev + penambahan
              localStorage.setItem('reseller_mock_saldo', current.toString())
              return current
            })
          }
          showSuccess(`🎉 Postingan ditandai Terjual!`)
        } else {
          if (isDemo) {
            const pengurangan = Number(a.harga) || 0
            setSaldo(prev => {
              const current = Math.max(0, prev - pengurangan)
              localStorage.setItem('reseller_mock_saldo', current.toString())
              return current
            })
          }
          showSuccess('Postingan dikembalikan ke status Tersedia.')
        }
        return { ...a, status: nextStatus }
      }
      return a
    })
    
    setPostedAccounts(updated)
    if (isDemo) {
      const customItems = updated.filter(a => typeof a.id === 'string' && a.id.startsWith('mock-') === false)
      localStorage.setItem('reseller_posted_accounts', JSON.stringify(customItems))
    }
    // Re-fetch real saldo from seller orders for non-demo mode
    if (!isDemo) {
      fetchSellerOrders()
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Yakin ingin menghapus postingan akun ini?')) {
      const isDemo = localStorage.getItem('reseller_demo_mode') === 'true'
      
      if (!isDemo) {
        try {
          const res = await authFetch(`/api-proxy/jual-beli-akun/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Gagal menghapus')
        } catch (err) {
          showError('Gagal menghapus akun dari server')
          return
        }
      }

      const filtered = postedAccounts.filter(a => a.id !== id)
      setPostedAccounts(filtered)
      
      if (isDemo) {
        const customItems = filtered.filter(a => typeof a.id === 'string' && a.id.startsWith('mock-') === false)
        localStorage.setItem('reseller_posted_accounts', JSON.stringify(customItems))
      }
      showSuccess('Postingan akun berhasil dihapus')
    }
  }

  const handleBumpAccount = async (id: string) => {
    const isDemo = localStorage.getItem('reseller_demo_mode') === 'true'
    
    if (!isDemo) {
      try {
        const res = await authFetch(`/api-proxy/jual-beli-akun/${id}/bump`, { method: 'POST' })
        if (!res.ok) throw new Error('Gagal bump')
      } catch (err) {
        showError('Gagal melakukan bump pada postingan ini (Mungkin masih cooldown 24 jam)')
        return
      }
    }
    showSuccess('🚀 Postingan berhasil di-bump ke posisi teratas!')
  }

  const handleWithdrawSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const isDemo = localStorage.getItem('reseller_demo_mode') === 'true'
    const amountNum = parseInt(withdrawAmount.replace(/\D/g, ''))
    if (!amountNum || amountNum < 50000) {
      showError('Minimal penarikan Rp 50.000')
      return
    }
    if (amountNum > saldo) {
      showError('Saldo tidak mencukupi untuk penarikan ini!')
      return
    }

    setWithdrawSubmitting(true)

    if (!isDemo) {
      if (!selectedBankId) {
        showError('Pilih rekening tujuan terlebih dahulu. Tambahkan rekening jika belum ada.')
        setWithdrawSubmitting(false)
        return
      }
      try {
        await withdrawApi.request({
          id_bank_account: selectedBankId,
          jumlah: amountNum,
          catatan_reseller: withdrawNote.trim() || undefined,
        })
        showSuccess('💸 Penarikan dana berhasil diajukan!')
        fetchWalletInfo()
        fetchWalletTransactions(1, walletTxFilter)
        fetchWithdrawRecords()
      } catch (err: any) {
        showError(err.message || 'Gagal mengajukan penarikan. Coba lagi nanti.')
        setWithdrawSubmitting(false)
        return
      }
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setWithdrawNote('')
      setWithdrawSubmitting(false)
      return
    }

    // Demo mode: mock withdraw
    const newSaldo = saldo - amountNum
    setSaldo(newSaldo)
    localStorage.setItem('reseller_mock_saldo', newSaldo.toString())

    const newTx = {
      id: Date.now(),
      bank: 'Demo Bank',
      noRek: '000000',
      amount: amountNum,
      date: 'Hari ini',
      status: 'Berhasil'
    }
    setWithdrawHistory([newTx, ...withdrawHistory])
    setShowWithdrawModal(false)
    setWithdrawAmount('')
    setWithdrawNote('')
    setWithdrawSubmitting(false)
    showSuccess('💸 [DEMO] Penarikan dana berhasil diproses!')
  }

  const handleAddBank = async (e: FormEvent) => {
    e.preventDefault()
    if (!newBankNama.trim() || !newBankNomor.trim() || !newBankPemilik.trim()) {
      showError('Semua field wajib diisi')
      return
    }
    setAddingBank(true)
    try {
      await bankAccountApi.create({
        nama_bank: newBankNama.trim(),
        tipe: newBankTipe,
        nomor_rekening: newBankNomor.trim(),
        nama_pemilik: newBankPemilik.trim(),
        kode_bank: newBankKode.trim() || undefined,
        is_primary: bankAccounts.length === 0,
      })
      showSuccess('✅ Rekening berhasil ditambahkan!')
      setShowAddBankModal(false)
      setNewBankNama('')
      setNewBankTipe('bank')
      setNewBankNomor('')
      setNewBankPemilik('')
      setNewBankKode('')
      fetchBankAccounts()
    } catch (err: any) {
      showError(err.message || 'Gagal menambahkan rekening')
    } finally {
      setAddingBank(false)
    }
  }

  const handleDeleteBank = async (bankId: number) => {
    if (!confirm('Hapus rekening ini?')) return
    try {
      await bankAccountApi.delete(bankId)
      showSuccess('Rekening dihapus')
      fetchBankAccounts()
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus rekening')
    }
  }

  const handleSetPrimaryBank = async (bankId: number) => {
    try {
      await bankAccountApi.setPrimary(bankId)
      showSuccess('Rekening utama diperbarui')
      fetchBankAccounts()
    } catch (err: any) {
      showError(err.message || 'Gagal mengatur rekening utama')
    }
  }

  const handleCancelWithdraw = async (withdrawId: number) => {
    if (!confirm('Batalkan penarikan ini?')) return
    try {
      await withdrawApi.cancel(withdrawId)
      showSuccess('Penarikan dibatalkan, saldo dikembalikan')
      fetchWithdrawRecords(withdrawRecordsPage)
      fetchWalletInfo()
    } catch (err: any) {
      showError(err.message || 'Gagal membatalkan penarikan')
    }
  }

  // Filter akun untuk tab Accounts
  const filteredAccounts = postedAccounts.filter(a => {
    const matchGame = filterGame === 'all' || a.game === filterGame
    const matchSearch = a.judul?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        a.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchGame && matchSearch
  })

  // ── RENDER LOADING ──
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-[3px] border-gray-900 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Memuat dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── RENDER DASHBOARD APPROVED (TERMASUK JIKA MODE DEMO) ──
  if (status === 'approved') {
    const isDemo = typeof window !== 'undefined' && localStorage.getItem('reseller_demo_mode') === 'true'
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          
          {/* Dashboard Header / Hero Banner */}
          <div className="bg-[#ffc900] border-[3px] border-gray-900 rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#111827] relative overflow-hidden mb-8">
            <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-40 h-40 bg-white/20 rounded-full pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-500 text-white font-black text-[11px] px-3 py-1 rounded-md border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase tracking-wider mb-3 -rotate-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Reseller Terverifikasi
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
                  Dashboard Toko Akun
                </h1>
                <p className="text-xs md:text-sm font-bold text-gray-800 mt-1 max-w-xl">
                  Selamat datang, <span className="font-black underline decoration-2">{resellerData?.nama_lengkap || user?.name || 'Reseller'}</span>! Kelola inventori akun game, pantau analitik penjualan, dan cairkan pendapatanmu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="bg-white text-gray-900 font-black text-xs md:text-sm px-4 py-3 rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase flex items-center gap-2"
                >
                  💳 Tarik Saldo
                </button>
                <button
                  onClick={() => router.push('/reseller/orders')}
                  className="bg-amber-500 text-white font-black text-xs md:text-sm px-4 py-3 rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase flex items-center gap-2"
                >
                  📦 Pesanan Masuk
                </button>
                <button
                  onClick={() => router.push('/reseller/jual-akun')}
                  className="bg-purple-600 text-white font-black text-xs md:text-sm px-5 py-3 rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase flex items-center gap-2"
                >
                  ➕ Jual Akun Baru
                </button>
              </div>
            </div>

            {isDemo && (
              <div className="mt-5 pt-3 border-t-2 border-gray-900/10 flex items-center justify-between">
                <span className="bg-black text-[#ffc900] font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                  Mode Uji Coba / Demo Aktif
                </span>
                <button 
                  onClick={exitDemoMode}
                  className="text-xs font-black text-gray-900 underline hover:text-red-600"
                >
                  Keluar Mode Demo
                </button>
              </div>
            )}
          </div>

          {/* Navigasi Tab */}
          <div className="flex flex-wrap gap-2 mb-8 border-b-[3px] border-gray-900 pb-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider border-[3px] border-gray-900 transition-all ${
                activeTab === 'overview'
                  ? 'bg-gray-900 text-white shadow-[3px_3px_0px_#ff90e8] translate-x-[-2px] translate-y-[-2px]'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-[2px_2px_0px_#111827]'
              }`}
            >
              📊 Ringkasan Statistik
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider border-[3px] border-gray-900 transition-all ${
                activeTab === 'accounts'
                  ? 'bg-gray-900 text-white shadow-[3px_3px_0px_#ff90e8] translate-x-[-2px] translate-y-[-2px]'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-[2px_2px_0px_#111827]'
              }`}
            >
              🎮 Postingan Akun ({postedAccounts.length})
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider border-[3px] border-gray-900 transition-all ${
                activeTab === 'withdraw'
                  ? 'bg-gray-900 text-white shadow-[3px_3px_0px_#ff90e8] translate-x-[-2px] translate-y-[-2px]'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-[2px_2px_0px_#111827]'
              }`}
            >
              💸 Riwayat Penarikan
            </button>
          </div>

          {/* ── KONTEN TAB: OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Saldo */}
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                  <div className="absolute top-0 right-0 bg-green-500 text-gray-900 font-black text-[9px] px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                    Siap Tarik
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Tersedia</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight truncate">
                    Rp {saldo.toLocaleString('id-ID')}
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
                      onClick={() => setShowWithdrawModal(true)}
                      className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Tarik →
                    </button>
                  </div>
                </div>

                {/* Total Terjual */}
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white font-black text-[9px] px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                    Sukses
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Terjual</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    {sellerOrders.filter(o => ['confirmed', 'completed'].includes(o.status?.toLowerCase())).length || postedAccounts.filter(a => a.status === 'terjual').length} <span className="text-sm font-bold text-gray-500">Akun</span>
                  </p>
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                      ↗ Garansi Pembayaran Aman
                    </span>
                  </div>
                </div>

                {/* Akun Aktif */}
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all">
                  <div className="absolute top-0 right-0 bg-purple-500 text-white font-black text-[9px] px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                    Live
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Postingan Aktif</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    {postedAccounts.filter(a => a.status === 'tersedia').length} <span className="text-sm font-bold text-gray-500">Akun</span>
                  </p>
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                    <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                      👁 Total {postedAccounts.reduce((sum, a) => sum + (a.views || 0), 0)} Dilihat
                    </span>
                  </div>
                </div>

                {/* Level Reseller */}
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] relative overflow-hidden group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] transition-all bg-gradient-to-br from-white to-[#ff90e8]/10">
                  <div className="absolute top-0 right-0 bg-[#ff90e8] text-gray-900 font-black text-[9px] px-2 py-1 rounded-bl-xl border-b-2 border-l-2 border-gray-900 uppercase">
                    VIP
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Tingkat Reseller</p>
                  <p className="text-xl md:text-2xl font-black text-purple-700 tracking-tight">
                    {(() => {
                      const sold = sellerOrders.filter(o => ['confirmed', 'completed'].includes(o.status?.toLowerCase())).length
                      if (sold >= 10) return '👑 SULTAN'
                      if (sold >= 5) return '⭐ GOLD'
                      if (sold >= 2) return '🥈 SILVER'
                      return '🥉 BRONZE'
                    })()}
                  </p>
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                    <span className="text-[10px] font-bold text-gray-600">
                      {(() => {
                        const sold = sellerOrders.filter(o => ['confirmed', 'completed'].includes(o.status?.toLowerCase())).length
                        if (sold >= 10) return 'Bebas Potongan Biaya Admin'
                        if (sold >= 5) return 'Potongan Admin 2%'
                        if (sold >= 2) return 'Potongan Admin 3%'
                        return 'Potongan Admin 5%'
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pendapatan Bulan Ini (dari wallet stats / info) */}
              {(walletStats || walletInfo) && !isDemo && (
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pendapatan Bulan Ini</p>
                    <p className="text-2xl font-black text-green-600">Rp {(
                      walletStats?.pendapatan_bulan_ini || walletInfo?.total_pendapatan || 0
                    ).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[2px_2px_0px_#111827]">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
              )}

              {/* Seksi Analytics & Info Pintar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Target Bulan Ini */}
                <div className="lg:col-span-2 bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Kinerja Penjualan Bulan Ini</h3>
                      <p className="text-xs font-bold text-gray-500">Target Bonus: 10 Akun Terjual</p>
                    </div>
                    <span className="bg-[#ffc900] text-gray-900 font-black text-xs px-3 py-1 rounded-lg border-2 border-gray-900">
                      {sellerOrders.filter(o => ['confirmed', 'completed'].includes(o.status?.toLowerCase())).length || postedAccounts.filter(a => a.status === 'terjual').length} / 10
                    </span>
                  </div>
                  
                  {/* Target Progress Bar */}
                  <div className="w-full bg-gray-100 border-[3px] border-gray-900 rounded-xl h-6 relative overflow-hidden mb-6">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-[#ff90e8] h-full border-r-[3px] border-gray-900 transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((sellerOrders.filter(o => ['confirmed', 'completed'].includes(o.status?.toLowerCase())).length || postedAccounts.filter(a => a.status === 'terjual').length) / 10) * 100)}%` }}
                    />
                  </div>

                  {/* Rincian Game Terlaris (Visual CSS Bars) */}
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Distribusi Inventori Game</h4>
                  <div className="space-y-3">
                    {['Mobile Legends', 'Valorant', 'Genshin Impact'].map((g) => {
                      const count = postedAccounts.filter(a => a.game === g).length
                      const total = postedAccounts.length || 1
                      const pct = Math.round((count / total) * 100)
                      const colors: Record<string, string> = {
                        'Mobile Legends': 'bg-blue-500',
                        'Valorant': 'bg-red-500',
                        'Genshin Impact': 'bg-purple-500'
                      }
                      return (
                        <div key={g} className="flex items-center gap-3">
                          <span className="w-32 text-xs font-bold text-gray-700 truncate">{g}</span>
                          <div className="flex-1 bg-gray-50 border-2 border-gray-900 rounded-md h-4 overflow-hidden">
                            <div className={`${colors[g] || 'bg-green-500'} h-full border-r-2 border-gray-900`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-black text-gray-900 w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tips Cepat Laku */}
                <div className="bg-[#ff90e8]/10 border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">💡</span>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Tips Cepat Laku</h3>
                    </div>
                    <ul className="space-y-3 text-xs font-bold text-gray-700">
                      <li className="flex gap-2">
                        <span className="text-purple-600 font-black">✔</span>
                        <span>Berikan judul menarik, cantumkan jumlah skin & hero utama.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-purple-600 font-black">✔</span>
                        <span>Pasang harga rasional sesuai harga pasar saat ini.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-purple-600 font-black">✔</span>
                        <span>Upload bukti screenshot profil & inventori yang jernih.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-purple-600 font-black">✔</span>
                        <span>Tandai status menjadi Terjual untuk menambah saldo dompetmu.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-gray-900/20 text-center">
                    <button
                      onClick={() => setActiveTab('accounts')}
                      className="w-full bg-gray-900 text-white font-black text-xs py-2.5 rounded-xl border-2 border-gray-900 hover:bg-purple-600 transition-colors uppercase tracking-wider"
                    >
                      Kelola Postingan →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── KONTEN TAB: ACCOUNTS ── */}
          {activeTab === 'accounts' && (
            <div className="animate-fadeIn">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Cari berdasarkan judul atau deskripsi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[3px_3px_0px_#a855f7]"
                  />
                </div>
                <select
                  value={filterGame}
                  onChange={(e) => setFilterGame(e.target.value)}
                  className="px-4 py-3 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-black uppercase tracking-wider focus:outline-none focus:shadow-[3px_3px_0px_#a855f7] cursor-pointer"
                >
                  <option value="all">Semua Game</option>
                  <option value="Mobile Legends">Mobile Legends</option>
                  <option value="Valorant">Valorant</option>
                  <option value="Genshin Impact">Genshin Impact</option>
                  <option value="Free Fire">Free Fire</option>
                  <option value="PUBG Mobile">PUBG Mobile</option>
                </select>
              </div>

              {/* Grid Akun */}
              {filteredAccounts.length === 0 ? (
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-12 text-center shadow-[5px_5px_0px_#111827]">
                  <p className="text-base font-black text-gray-900 uppercase mb-2">Tidak ada postingan ditemukan</p>
                  <p className="text-xs font-bold text-gray-500 mb-6">Coba sesuaikan kata kunci pencarian atau buat postingan akun baru.</p>
                  <button
                    onClick={() => router.push('/reseller/jual-akun')}
                    className="bg-purple-600 text-white font-black text-xs px-5 py-3 rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0px_#111827] uppercase tracking-wider"
                  >
                    ➕ Jual Akun Game
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAccounts.map((item) => (
                    <div key={item.id} className="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[5px_5px_0px_#111827] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#111827] transition-all group">
                      <div>
                        {/* Gambar & Badge */}
                        <div className="relative h-48 bg-gray-100 border-b-[3px] border-gray-900 overflow-hidden">
                          <img 
                            src={item.gambar || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop'} 
                            alt={item.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="bg-gray-900 text-white font-black text-[10px] px-2.5 py-1 rounded-md border-2 border-white uppercase tracking-wider shadow-sm">
                              {item.game}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className={`font-black text-[10px] px-2.5 py-1 rounded-md border-2 border-gray-900 uppercase tracking-wider shadow-[2px_2px_0px_#111827] ${
                              item.status === 'terjual' 
                                ? 'bg-red-500 text-white' 
                                : 'bg-green-400 text-gray-900'
                            }`}>
                              {item.status === 'terjual' ? 'Terjual' : 'Tersedia'}
                            </span>
                          </div>
                          <div className="absolute bottom-2 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            👁 {item.views || Math.floor(Math.random() * 50) + 10} dilihat
                          </div>
                        </div>

                        {/* Info Konten */}
                        <div className="p-5">
                          <p className="text-xs font-bold text-gray-400 mb-1">{item.tanggal || 'Baru saja diposting'}</p>
                          <h3 className="text-base font-black text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
                            {item.judul}
                          </h3>
                          <p className="text-xl font-black text-purple-700 mb-3">
                            Rp {Number(item.harga).toLocaleString('id-ID')}
                          </p>
                          <p className="text-xs font-bold text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                            {item.deskripsi}
                          </p>
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <div className="p-4 bg-gray-50 border-t-[3px] border-gray-900 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`flex-1 font-black text-xs py-2.5 px-2 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase tracking-wider transition-all min-w-[120px] ${
                            item.status === 'terjual'
                              ? 'bg-white text-gray-700 hover:bg-green-50'
                              : 'bg-[#ffc900] text-gray-900 hover:bg-[#ffc900]/80 hover:translate-x-[-1px] hover:translate-y-[-1px]'
                          }`}
                        >
                          {item.status === 'terjual' ? '🔄 Set Tersedia' : '✔ Tandai Terjual'}
                        </button>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/reseller/jual-akun?edit=${item.id}`)}
                            className="bg-purple-500 hover:bg-purple-600 text-white font-black p-2.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] transition-all"
                            title="Edit Postingan"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleBumpAccount(item.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-black p-2.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] transition-all"
                            title="Bump ke Atas"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 19V5M5 12l7-7 7 7"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(item.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-black p-2.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] transition-all"
                            title="Hapus Postingan"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── KONTEN TAB: WITHDRAW ── */}
          {activeTab === 'withdraw' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Ringkasan Wallet */}
              {walletInfo && !isDemo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Tersedia</p>
                    <p className="text-xl font-black text-green-600">Rp {(walletInfo.saldo || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pendapatan</p>
                    <p className="text-xl font-black text-blue-600">Rp {(walletInfo.total_pendapatan || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-5 shadow-[4px_4px_0px_#111827]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Penarikan</p>
                    <p className="text-xl font-black text-purple-600">Rp {(walletInfo.total_penarikan || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}

              {/* Grafik Pendapatan */}
              {walletStats?.grafik_pendapatan && walletStats.grafik_pendapatan.length > 0 && !isDemo && (
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827]">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Grafik Pendapatan</h4>
                  <div className="flex items-end gap-2 h-32">
                    {walletStats.grafik_pendapatan.map((item, i) => {
                      const maxVal = Math.max(...walletStats.grafik_pendapatan.map(g => g.jumlah), 1)
                      const heightPct = Math.max(4, (item.jumlah / maxVal) * 100)
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] font-bold text-gray-500">
                            {item.jumlah > 0 ? `${(item.jumlah / 1000).toFixed(0)}k` : '0'}
                          </span>
                          <div
                            className="w-full bg-purple-500 border-2 border-gray-900 rounded-t-md transition-all"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[8px] font-bold text-gray-400 truncate w-full text-center">{item.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tabel Riwayat Transaksi */}
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Riwayat Transaksi Wallet</h3>
                    <p className="text-xs font-bold text-gray-500">Semua riwayat transaksi e-wallet reseller</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isDemo && (
                      <select
                        value={walletTxFilter}
                        onChange={(e) => {
                          setWalletTxFilter(e.target.value)
                          fetchWalletTransactions(1, e.target.value)
                        }}
                        className="px-3 py-2 bg-white border-2 border-gray-900 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none cursor-pointer"
                      >
                        <option value="">Semua Tipe</option>
                        <option value="masuk">Masuk</option>
                        <option value="keluar">Keluar</option>
                        <option value="penarikan">Penarikan</option>
                        <option value="penjualan">Penjualan</option>
                      </select>
                    )}
                    <button
                      onClick={() => setShowWithdrawModal(true)}
                      className="bg-blue-600 text-white font-black text-xs px-4 py-2.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase tracking-wider"
                    >
                      💳 Tarik Dana
                    </button>
                  </div>
                </div>

                {walletLoading ? (
                  <div className="py-12 flex items-center justify-center">
                    <div className="w-8 h-8 border-[3px] border-gray-900 border-t-purple-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto border-2 border-gray-900 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-900 bg-gray-50">
                          <th className="p-3 text-xs font-black text-gray-900 uppercase tracking-wider">Tanggal</th>
                          <th className="p-3 text-xs font-black text-gray-900 uppercase tracking-wider">Tipe</th>
                          <th className="p-3 text-xs font-black text-gray-900 uppercase tracking-wider">Keterangan</th>
                          <th className="p-3 text-xs font-black text-gray-900 uppercase tracking-wider">Jumlah</th>
                          <th className="p-3 text-xs font-black text-gray-900 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 font-bold text-xs text-gray-700">
                        {/* Real transactions from API */}
                        {!isDemo && walletTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-purple-50/50 transition-colors">
                            <td className="p-3 whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                tx.tipe === 'masuk' || tx.tipe === 'penjualan' ? 'bg-green-100 text-green-700' :
                                tx.tipe === 'penarikan' || tx.tipe === 'keluar' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {tx.tipe}
                              </span>
                            </td>
                            <td className="p-3 max-w-[200px] truncate text-gray-600">{tx.keterangan}</td>
                            <td className={`p-3 font-black ${
                              tx.tipe === 'masuk' || tx.tipe === 'penjualan' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {tx.tipe === 'masuk' || tx.tipe === 'penjualan' ? '+' : '-'}Rp {Math.abs(tx.jumlah).toLocaleString('id-ID')}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border border-gray-900 shadow-sm ${
                                tx.status === 'berhasil' ? 'bg-green-400 text-gray-900' :
                                tx.status === 'pending' ? 'bg-[#ffc900] text-gray-900' :
                                'bg-red-400 text-white'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Demo mode: show local withdrawHistory */}
                        {isDemo && withdrawHistory.map((tx) => (
                          <tr key={tx.id} className="hover:bg-purple-50/50 transition-colors">
                            <td className="p-3 whitespace-nowrap">{tx.date}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700">penarikan</span>
                            </td>
                            <td className="p-3 text-gray-600">{tx.bank} - {tx.noRek}</td>
                            <td className="p-3 font-black text-red-600">-Rp {tx.amount.toLocaleString('id-ID')}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border border-gray-900 shadow-sm ${
                                tx.status === 'Berhasil' ? 'bg-green-400 text-gray-900' : 'bg-[#ffc900] text-gray-900'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Empty state */}
                        {((!isDemo && walletTransactions.length === 0) || (isDemo && withdrawHistory.length === 0)) && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-sm font-bold text-gray-400">
                              Belum ada riwayat transaksi
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {!isDemo && walletTxTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      disabled={walletTxPage <= 1}
                      onClick={() => fetchWalletTransactions(walletTxPage - 1, walletTxFilter)}
                      className="px-3 py-1.5 bg-white border-2 border-gray-900 rounded-lg text-xs font-black disabled:opacity-40 hover:bg-gray-50"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs font-black text-gray-600">
                      {walletTxPage} / {walletTxTotalPages}
                    </span>
                    <button
                      disabled={walletTxPage >= walletTxTotalPages}
                      onClick={() => fetchWalletTransactions(walletTxPage + 1, walletTxFilter)}
                      className="px-3 py-1.5 bg-white border-2 border-gray-900 rounded-lg text-xs font-black disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>

              {/* Rekening Bank Tersimpan */}
              {!isDemo && (
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Rekening Tersimpan</h3>
                      <p className="text-xs font-bold text-gray-500">Kelola rekening bank / e-wallet untuk penarikan</p>
                    </div>
                    <button
                      onClick={() => setShowAddBankModal(true)}
                      className="bg-purple-600 text-white font-black text-xs px-4 py-2.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase tracking-wider"
                    >
                      + Tambah
                    </button>
                  </div>

                  {bankAccounts.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-3xl mb-2">🏦</p>
                      <p className="text-sm font-bold text-gray-500">Belum ada rekening tersimpan</p>
                      <p className="text-xs text-gray-400 mt-1">Tambahkan rekening untuk mulai menarik dana</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {bankAccounts.map(bank => (
                        <div key={bank.id} className={`relative border-2 rounded-xl p-4 transition-all ${
                          bank.is_primary ? 'border-purple-500 bg-purple-50' :
                          bank.is_verified === false ? 'border-orange-300 bg-orange-50' :
                          'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                            {bank.is_primary && (
                              <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Utama</span>
                            )}
                            {bank.is_verified === true && (
                              <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">✓ Terverifikasi</span>
                            )}
                            {bank.is_verified === false && (
                              <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">⏳ Menunggu Verif</span>
                            )}
                          </div>
                          <p className="text-xs font-black text-gray-900 uppercase">{bank.nama_bank}</p>
                          <p className="text-sm font-bold text-gray-700 mt-1">{bank.nomor_rekening}</p>
                          <p className="text-xs text-gray-500">{bank.nama_pemilik}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{bank.tipe}</p>
                          {bank.is_verified === false && (
                            <p className="text-[10px] text-orange-600 font-bold mt-1">Rekening belum diverifikasi admin. Tidak bisa digunakan untuk penarikan.</p>
                          )}
                          <div className="mt-3 flex gap-2">
                            {!bank.is_primary && bank.is_verified !== false && (
                              <button
                                onClick={() => handleSetPrimaryBank(bank.id)}
                                className="text-[10px] font-bold text-purple-600 hover:underline"
                              >
                                Jadikan Utama
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBank(bank.id)}
                              className="text-[10px] font-bold text-red-500 hover:underline"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Riwayat Penarikan Dana */}
              {!isDemo && (
                <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[5px_5px_0px_#111827]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900 uppercase tracking-wide">Riwayat Penarikan</h3>
                      <p className="text-xs font-bold text-gray-500">Status permintaan penarikan dana</p>
                    </div>
                  </div>

                  {withdrawRecordsLoading ? (
                    <div className="py-8 flex items-center justify-center">
                      <div className="w-8 h-8 border-[3px] border-gray-900 border-t-purple-600 rounded-full animate-spin" />
                    </div>
                  ) : withdrawRecords.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-3xl mb-2">📋</p>
                      <p className="text-sm font-bold text-gray-500">Belum ada riwayat penarikan</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {withdrawRecords.map(wd => (
                        <div key={wd.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-black text-gray-900">Rp {wd.jumlah.toLocaleString('id-ID')}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {wd.bank_account ? `${wd.bank_account.nama_bank} - ${wd.bank_account.nomor_rekening}` : 'Rekening dihapus'}
                              </p>
                              {wd.catatan_reseller && (
                                <p className="text-[10px] text-gray-400 mt-0.5">Catatan: {wd.catatan_reseller}</p>
                              )}
                              {wd.alasan_penolakan && (
                                <p className="text-[10px] text-red-500 mt-0.5">Alasan ditolak: {wd.alasan_penolakan}</p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(wd.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-gray-900 shadow-sm ${
                                wd.status === 'completed' ? 'bg-green-400 text-gray-900' :
                                wd.status === 'approved' || wd.status === 'processing' ? 'bg-blue-400 text-white' :
                                wd.status === 'pending' ? 'bg-[#ffc900] text-gray-900' :
                                wd.status === 'rejected' ? 'bg-red-400 text-white' :
                                wd.status === 'cancelled' ? 'bg-gray-300 text-gray-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {wd.status === 'completed' ? 'Selesai' :
                                 wd.status === 'approved' ? 'Disetujui' :
                                 wd.status === 'processing' ? 'Diproses' :
                                 wd.status === 'pending' ? 'Menunggu' :
                                 wd.status === 'rejected' ? 'Ditolak' :
                                 wd.status === 'cancelled' ? 'Dibatalkan' : wd.status}
                              </span>
                              {wd.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelWithdraw(wd.id)}
                                  className="text-[10px] font-bold text-red-500 hover:underline"
                                >
                                  Batalkan
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Pagination */}
                      {withdrawRecordsTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            disabled={withdrawRecordsPage <= 1}
                            onClick={() => fetchWithdrawRecords(withdrawRecordsPage - 1)}
                            className="px-3 py-1.5 bg-white border-2 border-gray-900 rounded-lg text-xs font-black disabled:opacity-40 hover:bg-gray-50"
                          >
                            ← Prev
                          </button>
                          <span className="text-xs font-black text-gray-600">
                            {withdrawRecordsPage} / {withdrawRecordsTotalPages}
                          </span>
                          <button
                            disabled={withdrawRecordsPage >= withdrawRecordsTotalPages}
                            onClick={() => fetchWithdrawRecords(withdrawRecordsPage + 1)}
                            className="px-3 py-1.5 bg-white border-2 border-gray-900 rounded-lg text-xs font-black disabled:opacity-40 hover:bg-gray-50"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal Ajukan Penarikan */}
          {showWithdrawModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-[8px_8px_0px_#111827] animate-fadeIn">
                <div className="bg-blue-600 p-4 text-white flex items-center justify-between border-b-[3px] border-gray-900">
                  <h3 className="font-black text-sm uppercase tracking-wider">Tarik Pendapatan Reseller</h3>
                  <button 
                    onClick={() => setShowWithdrawModal(false)}
                    className="w-8 h-8 bg-white text-gray-900 font-black rounded-lg border-2 border-gray-900 flex items-center justify-center shadow-sm hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
                  <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-900">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Saldo Siap Tarik</label>
                    <p className="text-xl font-black text-green-600">Rp {saldo.toLocaleString('id-ID')}</p>
                  </div>

                  {/* Pilih Rekening */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Rekening Tujuan</label>
                    {(() => {
                      const verifiedBanks = bankAccounts.filter(b => b.is_verified !== false)
                      if (bankAccounts.length === 0) {
                        return (
                          <div className="text-center py-3 bg-orange-50 border-2 border-orange-200 rounded-xl">
                            <p className="text-xs font-bold text-orange-700">Belum ada rekening tersimpan</p>
                          </div>
                        )
                      }
                      if (verifiedBanks.length === 0) {
                        return (
                          <div className="py-3 bg-orange-50 border-2 border-orange-300 rounded-xl px-3">
                            <p className="text-xs font-bold text-orange-700">⏳ Semua rekening menunggu verifikasi admin</p>
                            <p className="text-[10px] text-orange-600 mt-0.5">Tunggu verifikasi sebelum melakukan penarikan</p>
                          </div>
                        )
                      }
                      return (
                        <select
                          value={selectedBankId || ''}
                          onChange={(e) => setSelectedBankId(Number(e.target.value))}
                          className="w-full border-[3px] border-gray-900 rounded-xl px-3 py-2.5 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none"
                        >
                          {verifiedBanks.map(bank => (
                            <option key={bank.id} value={bank.id}>
                              {bank.nama_bank} - {bank.nomor_rekening} ({bank.nama_pemilik}){bank.is_primary ? ' ★' : ''}
                            </option>
                          ))}
                        </select>
                      )
                    })()}
                    <button
                      type="button"
                      onClick={() => setShowAddBankModal(true)}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                    >
                      + Tambah Rekening Baru
                    </button>
                  </div>

                  {/* Jumlah */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Jumlah Penarikan (Rp)</label>
                    <input
                      type="text"
                      value={withdrawAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setWithdrawAmount(val ? parseInt(val).toLocaleString('id-ID') : '')
                      }}
                      placeholder="Min. Rp 50.000"
                      className="w-full border-[3px] border-gray-900 rounded-xl px-3 py-2.5 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none placeholder:text-gray-400"
                      required
                    />
                  </div>

                  {/* Catatan */}
                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Catatan (Opsional)</label>
                    <input
                      type="text"
                      value={withdrawNote}
                      onChange={(e) => setWithdrawNote(e.target.value)}
                      placeholder="Catatan untuk admin"
                      className="w-full border-[3px] border-gray-900 rounded-xl px-3 py-2.5 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none placeholder:text-gray-400"
                    />
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 bg-gray-100 text-gray-800 font-black text-xs py-3 rounded-xl border-2 border-gray-900 uppercase tracking-wider hover:bg-gray-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={withdrawSubmitting || !selectedBankId}
                      className="flex-1 bg-[#ffc900] text-gray-900 font-black text-xs py-3 rounded-xl border-2 border-gray-900 uppercase tracking-wider shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                          Memproses...
                        </span>
                      ) : 'Cairkan Dana'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Tambah Rekening */}
          {showAddBankModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white border-[3px] border-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-[8px_8px_0px_#111827] animate-fadeIn">
                <div className="bg-purple-600 p-4 text-white flex items-center justify-between border-b-[3px] border-gray-900">
                  <h3 className="font-black text-sm uppercase tracking-wider">Tambah Rekening</h3>
                  <button 
                    onClick={() => setShowAddBankModal(false)}
                    className="w-8 h-8 bg-white text-gray-900 font-black rounded-lg border-2 border-gray-900 flex items-center justify-center shadow-sm hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddBank} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Tipe</label>
                    <select
                      value={newBankTipe}
                      onChange={(e) => setNewBankTipe(e.target.value)}
                      className="w-full border-[3px] border-gray-900 rounded-xl px-3 py-2.5 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none"
                    >
                      <option value="bank">Bank Transfer</option>
                      <option value="ewallet">E-Wallet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Nama Bank / E-Wallet</label>
                    <input
                      type="text"
                      value={newBankNama}
                      onChange={(e) => setNewBankNama(e.target.value)}
                      placeholder="Contoh: BCA, Mandiri, DANA, GoPay"
                      className="w-full border-[3px] border-gray-900 rounded-xl px-3 py-2.5 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Nomor Rekening / HP</label>
                    <input
                      type="text"
                      value={newBankNomor}
                      onChange={(e) => setNewBankNomor(e.target.value)}
                      placeholder="Contoh: 1234567890"
                      className="w-full border-[3px] border-gray-900 rounded-xl px-3 py-2.5 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Nama Pemilik</label>
                    <input
                      type="text"
                      value={newBankPemilik}
                      onChange={(e) => setNewBankPemilik(e.target.value)}
                      placeholder="Nama sesuai rekening"
                      className="w-full border-[3px] border-gray-900 rounded-xl px-3 py-2.5 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Kode Bank (Opsional)</label>
                    <input
                      type="text"
                      value={newBankKode}
                      onChange={(e) => setNewBankKode(e.target.value)}
                      placeholder="Contoh: 014 (BCA)"
                      className="w-full border-[3px] border-gray-900 rounded-xl px-3 py-2.5 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none placeholder:text-gray-400"
                    />
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddBankModal(false)}
                      className="flex-1 bg-gray-100 text-gray-800 font-black text-xs py-3 rounded-xl border-2 border-gray-900 uppercase tracking-wider hover:bg-gray-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={addingBank}
                      className="flex-1 bg-purple-600 text-white font-black text-xs py-3 rounded-xl border-2 border-gray-900 uppercase tracking-wider shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] transition-all disabled:opacity-50"
                    >
                      {addingBank ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Menyimpan...
                        </span>
                      ) : 'Simpan Rekening'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
        <Footer />
      </div>
    )
  }

  // ── RENDER NOT AUTHENTICATED ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-8 md:p-12 shadow-[6px_6px_0px_#111827] text-center">
            <div className="w-16 h-16 bg-[#ffc900] border-[3px] border-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_#111827] -rotate-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Login Diperlukan</h1>
            <p className="text-sm font-bold text-gray-500 mb-6">Kamu harus login terlebih dahulu untuk mendaftar sebagai reseller.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white font-black text-sm px-6 py-3 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider"
              >
                Kembali ke Beranda
              </button>
            </div>

            {/* Tombol Akses Cepat Uji Coba */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 max-w-md mx-auto">
              <p className="text-xs font-bold text-gray-500 mb-3">Ingin meninjau desain Dashboard Reseller tanpa login?</p>
              <button
                onClick={activateDemoMode}
                className="w-full bg-[#ff90e8] text-gray-900 font-black text-xs py-3 px-4 rounded-xl border-2 border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase tracking-wider"
              >
                ⚡ Uji Coba Mode Demo Dashboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── RENDER PENDING ──
  if (status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-8 md:p-12 shadow-[6px_6px_0px_#111827] text-center relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#ffc900]/20 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-100 rounded-full" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-[#ffc900] border-[3px] border-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#111827] animate-bounce" style={{ animationDuration: '2s' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight mb-3">Menunggu Konfirmasi</h1>
              <p className="text-sm font-bold text-gray-500 max-w-md mx-auto mb-6">
                Pendaftaran reseller kamu sedang ditinjau oleh admin. Kami akan memberitahumu setelah proses verifikasi selesai.
              </p>

              <div className="bg-[#ffc900]/10 border-[3px] border-[#ffc900] rounded-xl p-4 inline-block mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ffc900] border-2 border-gray-900 animate-pulse" />
                  <span className="text-sm font-black text-gray-900 uppercase tracking-wider">Status: Pending Verification</span>
                </div>
              </div>

              {resellerData && (
                <div className="text-left bg-gray-50 border-[3px] border-gray-900 rounded-xl p-5 shadow-[3px_3px_0px_#111827] max-w-md mx-auto mb-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Data Pendaftaran</p>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-black text-gray-900">Nama:</span> <span className="font-bold text-gray-600">{resellerData.nama_lengkap}</span></p>
                    <p className="text-sm"><span className="font-black text-gray-900">No. HP:</span> <span className="font-bold text-gray-600">{resellerData.no_hp}</span></p>
                    {resellerData.alamat && <p className="text-sm"><span className="font-black text-gray-900">Alamat:</span> <span className="font-bold text-gray-600">{resellerData.alamat}</span></p>}
                  </div>
                </div>
              )}

              {/* Akses Cepat Simulasi */}
              <div className="pt-4 border-t-2 border-dashed border-gray-200 max-w-md mx-auto">
                <button
                  onClick={activateDemoMode}
                  className="text-xs font-black text-purple-700 underline hover:text-purple-900"
                >
                  ⚡ Lewati verifikasi & langsung lihat Dashboard (Mode Demo)
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── RENDER REJECTED ──
  if (status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-8 md:p-12 shadow-[6px_6px_0px_#111827] text-center">
            <div className="w-20 h-20 bg-red-500 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#111827]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight mb-3">Pendaftaran Ditolak</h1>
            <p className="text-sm font-bold text-gray-500 max-w-md mx-auto mb-6">
              Maaf, pendaftaran reseller kamu telah ditolak. Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
            <div className="bg-red-50 border-[3px] border-red-500 rounded-xl p-4 inline-block mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-gray-900" />
                <span className="text-sm font-black text-red-600 uppercase tracking-wider">Status: Ditolak</span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-gray-200 max-w-md mx-auto">
              <button
                onClick={activateDemoMode}
                className="text-xs font-black text-purple-700 underline hover:text-purple-900"
              >
                ⚡ Akses Dashboard Reseller via Mode Demo
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── RENDER FORM REGISTRASI AWAL (status === 'none') ──
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ff90e8] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded-lg mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              RESELLER PROGRAM
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Jadi Reseller</h1>
            <p className="text-sm font-bold text-gray-500 border-l-[4px] border-[#ff90e8] pl-3 py-1">
              Daftar sebagai reseller untuk menjual akun game dan mendapatkan penghasilan tambahan.
            </p>
          </div>

          <button
            type="button"
            onClick={activateDemoMode}
            className="bg-[#ffc900] text-gray-900 font-black text-xs px-4 py-3 rounded-xl border-2 border-gray-900 shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] transition-all uppercase tracking-wider self-start sm:self-auto shrink-0 animate-pulse"
          >
            ⚡ Coba Mode Demo
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#111827] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff90e8] rounded-bl-[2rem] -mr-1 -mt-1 border-b-[3px] border-l-[3px] border-gray-900 z-0" />

          <form onSubmit={handleSubmitRegistration} className="relative z-10 space-y-6">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Masukkan nama lengkap..."
                className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                required
              />
            </div>

            {/* No HP */}
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">
                Nomor HP / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400"
                required
              />
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">
                Alamat <span className="text-gray-400 text-[9px]">(Opsional)</span>
              </label>
              <textarea
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Masukkan alamat lengkap..."
                rows={3}
                className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#ff90e8] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Kamera KTP */}
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">
                Foto KTP <span className="text-gray-400 text-[9px]">(Opsional / Verifikasi Instan)</span>
              </label>

              {isCameraOpen ? (
                <div className="border-[3px] border-gray-900 rounded-xl overflow-hidden relative bg-black shadow-[4px_4px_0px_#111827]">
                  <video 
                    ref={videoRef} 
                    playsInline 
                    className="w-full h-[300px] object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-red-500 text-white font-black text-xs px-4 py-2 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={takePhoto}
                      className="bg-[#ffc900] text-gray-900 font-black text-xs px-4 py-2 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase"
                    >
                      📸 Ambil Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={startCamera}
                  className="border-[3px] border-gray-900 border-dashed rounded-xl p-6 text-center bg-gray-50 hover:bg-[#ff90e8]/10 transition-colors cursor-pointer group"
                >
                  {ktpPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={ktpPreview} alt="KTP Preview" className="max-h-40 rounded-lg border-2 border-gray-900 shadow-[2px_2px_0px_#111827]" />
                      <p className="text-xs font-bold text-gray-500">Klik untuk foto ulang</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-200 border-[3px] border-gray-900 rounded-xl flex items-center justify-center group-hover:bg-[#ff90e8]/20 transition-colors">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                      <p className="text-sm font-black text-gray-500 uppercase tracking-wider">Buka Kamera</p>
                      <p className="text-xs font-bold text-gray-400">Gunakan pencahayaan yang cukup</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#ff90e8] text-gray-900 font-black text-sm py-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  Mendaftar...
                </span>
              ) : (
                'Daftar Jadi Reseller'
              )}
            </button>

            {/* Info */}
            <div className="bg-blue-50 border-[3px] border-blue-600 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <div>
                  <p className="text-xs font-black text-blue-900 uppercase tracking-wider mb-1">Informasi Verifikasi</p>
                  <p className="text-xs font-bold text-blue-700">
                    Proses peninjauan admin memakan waktu 1-2 hari kerja. Gunakan tombol <b>Mode Demo</b> di atas jika ingin langsung melihat seluruh fitur dashboard.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
