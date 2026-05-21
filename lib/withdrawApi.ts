import { authFetch } from '@/lib/authApi'

// ═══════════════════════════════════════════
// Withdraw API — Rekening Bank & Penarikan
// ═══════════════════════════════════════════

// ─── Types ───────────────────────────────

export interface BankAccount {
  id: number
  nama_bank: string
  tipe: string // 'bank' | 'ewallet'
  nomor_rekening: string
  nama_pemilik: string
  kode_bank?: string
  is_primary: boolean
  is_verified?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateBankAccountRequest {
  nama_bank: string
  tipe: string
  nomor_rekening: string
  nama_pemilik: string
  kode_bank?: string
  is_primary?: boolean
}

export interface WithdrawRequest {
  id_bank_account: number
  jumlah: number
  catatan_reseller?: string
}

export interface WithdrawRecord {
  id: number
  jumlah: number
  status: string // 'pending' | 'processing' | 'approved' | 'completed' | 'rejected' | 'cancelled'
  catatan_reseller?: string
  catatan_admin?: string
  alasan_penolakan?: string
  bukti_transfer_url?: string
  bank_account?: BankAccount
  createdAt: string
  updatedAt: string
}

export interface WithdrawListResponse {
  withdrawals: WithdrawRecord[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ─── Rekening Bank API (/api/withdraw/banks) ───────────────────

export const bankAccountApi = {
  // GET /api/withdraw/banks — Daftar rekening reseller
  getAll: async (): Promise<BankAccount[]> => {
    const res = await authFetch('/api-proxy/withdraw/banks')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengambil daftar rekening')
    }
    const data = await res.json()
    const raw = data.data || data.banks || data
    return Array.isArray(raw) ? raw : []
  },

  // POST /api/withdraw/banks — Tambah rekening baru
  create: async (req: CreateBankAccountRequest): Promise<BankAccount> => {
    const res = await authFetch('/api-proxy/withdraw/banks', {
      method: 'POST',
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal menambahkan rekening')
    }
    const data = await res.json()
    return data.data || data.bank || data
  },

  // PUT /api/withdraw/banks/:bankId/primary — Set rekening utama
  setPrimary: async (bankId: number): Promise<any> => {
    const res = await authFetch(`/api-proxy/withdraw/banks/${bankId}/primary`, {
      method: 'PUT',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengatur rekening utama')
    }
    const data = await res.json()
    return data.data || data
  },

  // DELETE /api/withdraw/banks/:bankId — Hapus rekening
  delete: async (bankId: number): Promise<any> => {
    const res = await authFetch(`/api-proxy/withdraw/banks/${bankId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal menghapus rekening')
    }
    const data = await res.json()
    return data.data || data
  },
}

// ─── Penarikan API (/api/withdraw) ───────────────────

export const withdrawApi = {
  // GET /api/withdraw — Riwayat penarikan
  getHistory: async (params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<WithdrawListResponse> => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())

    const qs = query.toString()
    const res = await authFetch(`/api-proxy/withdraw${qs ? `?${qs}` : ''}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengambil riwayat penarikan')
    }
    const data = await res.json()
    const raw = data.data || data
    return {
      withdrawals: raw.withdrawals || raw.data || [],
      total: raw.total || 0,
      page: raw.page || 1,
      limit: raw.limit || 10,
      total_pages: raw.total_pages || raw.totalPages || 1,
    }
  },

  // POST /api/withdraw/request — Ajukan penarikan
  request: async (req: WithdrawRequest): Promise<WithdrawRecord> => {
    const res = await authFetch('/api-proxy/withdraw/request', {
      method: 'POST',
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengajukan penarikan')
    }
    const data = await res.json()
    return data.data || data.withdrawal || data
  },

  // DELETE /api/withdraw/:id/cancel — Batalkan penarikan (hanya pending)
  cancel: async (withdrawId: number): Promise<any> => {
    const res = await authFetch(`/api-proxy/withdraw/${withdrawId}/cancel`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal membatalkan penarikan')
    }
    const data = await res.json()
    return data.data || data
  },
}

// ─── Admin Withdraw API (/api/admin/withdraw) ───────────────────

export const adminWithdrawApi = {
  // GET /api/admin/withdraw — List semua penarikan
  getAll: async (params?: {
    status?: string
    search?: string
    overdue?: boolean
    page?: number
  }): Promise<any> => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.search) query.set('search', params.search)
    if (params?.overdue) query.set('overdue', 'true')
    if (params?.page) query.set('page', params.page.toString())

    const qs = query.toString()
    const res = await authFetch(`/api-proxy/admin/withdraw${qs ? `?${qs}` : ''}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengambil data penarikan')
    }
    const data = await res.json()
    return data.data || data
  },

  // GET /api/admin/withdraw/:id — Detail penarikan
  getDetail: async (id: number): Promise<any> => {
    const res = await authFetch(`/api-proxy/admin/withdraw/${id}`)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengambil detail penarikan')
    }
    const data = await res.json()
    return data.data || data.withdrawal || data
  },

  // PUT /api/admin/withdraw/:id/process — Tandai sedang diproses
  process: async (id: number, catatan_admin?: string): Promise<any> => {
    const res = await authFetch(`/api-proxy/admin/withdraw/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify({ catatan_admin }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal memproses penarikan')
    }
    return (await res.json()).data || {}
  },

  // PUT /api/admin/withdraw/:id/approve — Setujui
  approve: async (id: number, body?: { bukti_transfer_url?: string; catatan_admin?: string }): Promise<any> => {
    const res = await authFetch(`/api-proxy/admin/withdraw/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(body || {}),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal menyetujui penarikan')
    }
    return (await res.json()).data || {}
  },

  // PUT /api/admin/withdraw/:id/complete — Selesai (sudah ditransfer)
  complete: async (id: number, body: { bukti_transfer_url: string; catatan_admin?: string }): Promise<any> => {
    const res = await authFetch(`/api-proxy/admin/withdraw/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal menyelesaikan penarikan')
    }
    return (await res.json()).data || {}
  },

  // PUT /api/admin/withdraw/:id/reject — Tolak
  reject: async (id: number, body: { alasan_penolakan: string; catatan_admin?: string }): Promise<any> => {
    const res = await authFetch(`/api-proxy/admin/withdraw/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal menolak penarikan')
    }
    return (await res.json()).data || {}
  },

  // GET /api/admin/withdraw/banks/unverified — Rekening belum diverifikasi
  getUnverifiedBanks: async (): Promise<any[]> => {
    const res = await authFetch('/api-proxy/admin/withdraw/banks/unverified')
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal mengambil rekening belum terverifikasi')
    }
    const data = await res.json()
    const raw = data.data || data.banks || data
    return Array.isArray(raw) ? raw : []
  },

  // PUT /api/admin/withdraw/banks/:bankId/verify — Verifikasi rekening
  verifyBank: async (bankId: number): Promise<any> => {
    const res = await authFetch(`/api-proxy/admin/withdraw/banks/${bankId}/verify`, {
      method: 'PUT',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Gagal memverifikasi rekening')
    }
    return (await res.json()).data || {}
  },
}
