import { authFetch } from './authApi';

const getBaseUrl = (path = '') => {
  const base = typeof window === 'undefined' ? `${process.env.NEXT_PUBLIC_API_URL}/api/akun-orders` : '/api-proxy/akun-orders';
  return `${base}${path}`;
};

const getListingBaseUrl = (path = '') => {
  const base = typeof window === 'undefined' ? `${process.env.NEXT_PUBLIC_API_URL}/api/jual-beli-akun` : '/api-proxy/jual-beli-akun';
  return `${base}${path}`;
};

const getAdminBaseUrl = (path = '') => {
  const base = typeof window === 'undefined' ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/akun-orders` : '/api-proxy/admin/akun-orders';
  return `${base}${path}`;
};

export type OrderStatus =
  | 'waiting_payment'
  | 'paid'
  | 'delivered'
  | 'confirmed'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export interface AkunOrder {
  id: number;
  invoice_number?: string;
  id_pembeli: number;
  id_penjual: number;
  id_listing: number;
  status: OrderStatus;
  harga: number;
  fee_admin?: number;
  total_bayar?: number;
  total_harga?: number;
  catatan_pembeli?: string;
  catatan_penjual?: string;
  catatan_dispute?: string;
  catatan_admin?: string;
  data_akun?: {
    email?: string;
    password?: string;
    pin?: string;
    recovery_email?: string;
    catatan?: string;
    [key: string]: any;
  };
  payment_url?: string;
  xendit_invoice_url?: string;
  invoice_url?: string;
  expired_at?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  listing?: {
    id: number;
    nama_post: string;
    harga?: number;
    slug?: string;
    accountGame?: {
      nama_game: string;
      gambar_game: string;
    };
    reseller?: {
      store_name?: string;
      nama_lengkap?: string;
      username?: string;
    };
  };
  pembeli?: {
    id: number;
    name?: string;
    username?: string;
    email?: string;
  };
  penjual?: {
    id: number;
    name?: string;
    username?: string;
    store_name?: string;
  };
}

export interface CheckoutResponse {
  order: AkunOrder;
  payment: {
    invoice_url: string;
    amount: number;
    expired_at: string;
  };
}

export const orderAkunApi = {
  // ═══════════════════════════════════════════
  // Pembeli Endpoints
  // ═══════════════════════════════════════════

  // Step 2: Checkout — buat order + link bayar
  checkout: async (idListing: number, catatanPembeli?: string): Promise<CheckoutResponse> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await authFetch(getBaseUrl('/checkout'), {
      method: 'POST',
      body: JSON.stringify({
        id_listing: idListing,
        catatan_pembeli: catatanPembeli,
        success_redirect_url: `${origin}/api/payment/success`,
        failure_redirect_url: `${origin}/my-orders`,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Gagal membuat pesanan akun');
    }
    const data = await response.json();
    return data.data || data;
  },

  // Pembeli: list semua order saya
  getMyOrders: async (): Promise<AkunOrder[]> => {
    const response = await authFetch(getBaseUrl(`?t=${Date.now()}`), { method: 'GET' });
    if (!response.ok) throw new Error('Gagal mengambil riwayat pesanan');
    const data = await response.json();
    return data.data?.orders || data.data || data.orders || [];
  },

  // Pembeli: detail order (data_akun tampil jika delivered/confirmed/completed)
  getOrderDetail: async (orderId: number): Promise<AkunOrder> => {
    const response = await authFetch(getBaseUrl(`/${orderId}`), { method: 'GET' });
    if (!response.ok) throw new Error('Gagal mengambil detail pesanan');
    const data = await response.json();
    return data.data || data;
  },

  // Step 5a: Pembeli konfirmasi akun OK
  confirmReceive: async (orderId: number, catatan?: string): Promise<any> => {
    const response = await authFetch(getBaseUrl(`/${orderId}/confirm`), {
      method: 'POST',
      body: JSON.stringify({ catatan }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Gagal konfirmasi pesanan');
    }
    return await response.json();
  },

  // Step 5b: Pembeli dispute — ada masalah dengan akun
  disputeOrder: async (orderId: number, catatanDispute: string): Promise<any> => {
    const response = await authFetch(getBaseUrl(`/${orderId}/dispute`), {
      method: 'POST',
      body: JSON.stringify({ catatan_dispute: catatanDispute }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Gagal mengajukan komplain');
    }
    return await response.json();
  },

  // ═══════════════════════════════════════════
  // Penjual / Seller Endpoints
  // ═══════════════════════════════════════════

  // Penjual: list semua pesanan masuk
  getSellerOrders: async (): Promise<AkunOrder[]> => {
    const response = await authFetch(getBaseUrl('/seller/my-orders'), { method: 'GET' });
    if (!response.ok) throw new Error('Gagal mengambil pesanan masuk');
    const data = await response.json();
    return data.data?.orders || data.data || data.orders || [];
  },

  // Penjual: detail pesanan
  getSellerOrderDetail: async (orderId: number): Promise<AkunOrder> => {
    const response = await authFetch(getBaseUrl(`/seller/${orderId}`), { method: 'GET' });
    if (!response.ok) throw new Error('Gagal mengambil detail pesanan masuk');
    const data = await response.json();
    return data.data || data;
  },

  // Step 4: Penjual kirim data akun ke pembeli
  deliverAccount: async (orderId: number, dataAkun: any, catatanPenjual?: string): Promise<any> => {
    const response = await authFetch(getBaseUrl(`/seller/${orderId}/deliver`), {
      method: 'POST',
      body: JSON.stringify({ data_akun: dataAkun, catatan_penjual: catatanPenjual }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Gagal mengirim data akun');
    }
    return await response.json();
  },

  // ═══════════════════════════════════════════
  // Reseller Listing Management
  // ═══════════════════════════════════════════

  // Reseller: list semua postingan akun saya
  getMyListings: async (): Promise<any[]> => {
    const response = await authFetch(getListingBaseUrl('/my-listings'), { method: 'GET' });
    if (!response.ok) throw new Error('Gagal mengambil daftar postingan');
    const data = await response.json();
    return data.data?.listings || data.data || data.listings || [];
  },

  // Reseller: detail postingan
  getListingDetail: async (id: number): Promise<any> => {
    const response = await authFetch(getListingBaseUrl(`/my-listings/${id}`), { method: 'GET' });
    if (!response.ok) throw new Error('Gagal mengambil detail postingan');
    const data = await response.json();
    return data.data || data;
  },

  // Reseller: update postingan
  updateListing: async (id: number, body: any): Promise<any> => {
    const response = await authFetch(getListingBaseUrl(`/my-listings/${id}`), {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Gagal mengupdate postingan');
    }
    return await response.json();
  },

  // Reseller: hapus postingan
  deleteListing: async (id: number): Promise<any> => {
    const response = await authFetch(getListingBaseUrl(`/my-listings/${id}`), {
      method: 'DELETE',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Gagal menghapus postingan');
    }
    return await response.json();
  },

  // ═══════════════════════════════════════════
  // Admin Endpoints
  // ═══════════════════════════════════════════

  // Admin: list semua akun orders (optional filter by status)
  adminGetOrders: async (status?: string): Promise<AkunOrder[]> => {
    const query = status ? `?status=${status}` : '';
    const response = await authFetch(getAdminBaseUrl(query), { method: 'GET' });
    if (!response.ok) throw new Error('Gagal mengambil daftar pesanan');
    const data = await response.json();
    return data.data?.orders || data.data || data.orders || [];
  },

  // Admin: detail order
  adminGetOrderDetail: async (orderId: number): Promise<AkunOrder> => {
    const response = await authFetch(getAdminBaseUrl(`/${orderId}`), { method: 'GET' });
    if (!response.ok) throw new Error('Gagal mengambil detail pesanan');
    const data = await response.json();
    return data.data || data;
  },

  // Step 6: Admin resolve dispute
  adminResolveDispute: async (orderId: number, keputusan: 'refund' | 'release', catatanAdmin: string): Promise<any> => {
    const response = await authFetch(getAdminBaseUrl(`/${orderId}/resolve`), {
      method: 'PUT',
      body: JSON.stringify({ keputusan, catatan_admin: catatanAdmin }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Gagal menyelesaikan dispute');
    }
    return await response.json();
  },
};
