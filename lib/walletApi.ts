import { authFetch } from '@/lib/authApi'

// ═══════════════════════════════════════════
// Wallet API — Reseller E-Wallet
// ═══════════════════════════════════════════

export interface WalletInfo {
  saldo: number
  saldo_tertahan: number
  saldo_proses_withdraw: number
  saldo_total: number
  total_penarikan: number
  total_pendapatan: number
  total_belum_dicairkan: number
}

export interface WalletTransaction {
  id: number
  tipe: string // 'masuk' | 'keluar' | 'penarikan' | 'penjualan' | 'refund'
  jumlah: number
  saldo_sebelum: number
  saldo_sesudah: number
  keterangan: string
  status: string // 'berhasil' | 'pending' | 'gagal'
  bank?: string
  no_rekening?: string
  nama_pemilik?: string
  createdAt: string
  updatedAt: string
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface WalletStats {
  saldo: number
  total_pendapatan: number
  total_penarikan: number
  pendapatan_bulan_ini: number
  grafik_pendapatan: {
    label: string
    jumlah: number
  }[]
}

export interface WithdrawRequest {
  bank: string
  no_rekening: string
  nama_pemilik?: string
  jumlah: number
}

export const walletApi = {
  // GET /api/wallet/info — Info saldo lengkap
  getInfo: async (): Promise<WalletInfo> => {
    const res = await authFetch('/api-proxy/wallet/info')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengambil info wallet')
    }
    const data = await res.json()
    const raw = data.data || data.wallet || data
    // Map backend fields: saldo_tersedia, saldo_ditahan, saldo_proses_withdraw, saldo_total,
    //   total_pendapatan, total_withdraw, total_belum_dicairkan
    return {
      saldo: raw.saldo_tersedia ?? raw.saldo ?? 0,
      saldo_tertahan: raw.saldo_ditahan ?? raw.saldo_tertahan ?? 0,
      saldo_proses_withdraw: raw.saldo_proses_withdraw ?? 0,
      saldo_total: raw.saldo_total ?? 0,
      total_penarikan: raw.total_withdraw ?? raw.total_penarikan ?? 0,
      total_pendapatan: raw.total_pendapatan ?? 0,
      total_belum_dicairkan: raw.total_belum_dicairkan ?? 0,
    }
  },

  // GET /api/wallet/transactions — Riwayat transaksi
  getTransactions: async (params?: {
    tipe?: string
    start_date?: string
    end_date?: string
    page?: number
  }): Promise<WalletTransactionsResponse> => {
    const query = new URLSearchParams()
    if (params?.tipe) query.set('tipe', params.tipe)
    if (params?.start_date) query.set('start_date', params.start_date)
    if (params?.end_date) query.set('end_date', params.end_date)
    if (params?.page) query.set('page', params.page.toString())
    
    const qs = query.toString()
    const res = await authFetch(`/api-proxy/wallet/transactions${qs ? `?${qs}` : ''}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengambil riwayat transaksi')
    }
    const data = await res.json()
    const raw = data.data || data
    return {
      transactions: raw.transactions || raw.data || [],
      total: raw.total || 0,
      page: raw.page || 1,
      per_page: raw.per_page || 10,
      total_pages: raw.total_pages || 1,
    }
  },

  // GET /api/wallet/stats — Saldo + grafik pendapatan
  getStats: async (): Promise<WalletStats> => {
    const res = await authFetch('/api-proxy/wallet/stats')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengambil statistik wallet')
    }
    const data = await res.json()
    const raw = data.data || data.stats || data
    return {
      saldo: raw.saldo ?? raw.saldo_tersedia ?? 0,
      total_pendapatan: raw.total_pendapatan ?? 0,
      total_penarikan: raw.total_penarikan ?? raw.total_withdraw ?? 0,
      pendapatan_bulan_ini: raw.pendapatan_bulan_ini ?? 0,
      grafik_pendapatan: raw.grafik_pendapatan || raw.grafik || [],
    }
  },

  // POST /api/wallet/withdraw — Ajukan penarikan
  withdraw: async (req: WithdrawRequest): Promise<any> => {
    const res = await authFetch('/api-proxy/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengajukan penarikan')
    }
    const data = await res.json()
    return data.data || data
  },
}
