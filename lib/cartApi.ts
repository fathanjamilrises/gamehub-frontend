import { authFetch, getToken } from './authApi';

const getCartUrl = (path = '') => {
  const base = typeof window === 'undefined' ? `${process.env.NEXT_PUBLIC_API_URL}/api/cart` : '/api-proxy/cart';
  return `${base}${path}`;
};

export interface CartItem {
  id: number; // This is the Cart ID
  item_type: 'akun' | 'topup';
  
  // For Akun
  id_listing?: number;
  
  // For Topup
  id_produk?: number;
  topup_target_id?: string;
  topup_target_server?: string;
  quantity?: number;

  harga_saat_ditambah: number;
  harga_sekarang: number;
  harga_berubah: boolean;
  selisih_harga: number;
  masih_aktif: boolean;
  sudah_expired: boolean;
  bisa_dibeli: boolean;
  catatan: string;
}

export interface CartSummary {
  total_item: number;
  item_aktif: number;
  item_tidak_aktif: number;
  total_harga: number;
  ada_perubahan_harga: boolean;
}

export interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}

export interface AddToCartAkunPayload {
  item_type?: 'akun';
  id_listing: number;
  catatan?: string;
}

export interface AddToCartTopupPayload {
  item_type: 'topup';
  id_produk: number;
  topup_target_id: string;
  topup_target_server?: string;
  quantity?: number;
  catatan?: string;
}

export type AddToCartPayload = AddToCartAkunPayload | AddToCartTopupPayload;

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    if (!getToken()) throw new Error('Unauthorized');
    const response = await authFetch(getCartUrl(), { method: 'GET' });
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) throw new Error('Gagal memuat keranjang');
    const data = await response.json();
    return data.data || data;
  },

  getCartCount: async (): Promise<{ count: number }> => {
    if (!getToken()) throw new Error('Unauthorized');
    const response = await authFetch(getCartUrl('/count'), { method: 'GET' });
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) throw new Error('Gagal memuat jumlah keranjang');
    const data = await response.json();
    return data.data || data;
  },

  checkCartItemAkun: async (idListing: number): Promise<{ in_cart: boolean }> => {
    if (!getToken()) return { in_cart: false };
    const response = await authFetch(getCartUrl(`/check/akun/${idListing}`), { method: 'GET' });
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) throw new Error('Gagal mengecek keranjang');
    const data = await response.json();
    return data.data || data;
  },

  checkCartItemTopup: async (idProduk: number, targetId: string): Promise<{ in_cart: boolean }> => {
    if (!getToken()) return { in_cart: false };
    const response = await authFetch(getCartUrl(`/check/topup/${idProduk}?topup_target_id=${encodeURIComponent(targetId)}`), { method: 'GET' });
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) throw new Error('Gagal mengecek keranjang');
    const data = await response.json();
    return data.data || data;
  },

  addToCart: async (payload: AddToCartPayload) => {
    const response = await authFetch(getCartUrl(), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Gagal menambahkan ke keranjang');
    }
    return data.data || data;
  },

  updateCartItem: async (cartId: number, body: { catatan?: string; quantity?: number }) => {
    const response = await authFetch(getCartUrl(`/${cartId}`), {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) throw new Error('Gagal mengupdate keranjang');
    const data = await response.json();
    return data.data || data;
  },

  removeFromCart: async (cartId: number) => {
    const response = await authFetch(getCartUrl(`/${cartId}`), { method: 'DELETE' });
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) throw new Error('Gagal menghapus dari keranjang');
    const data = await response.json();
    return data.data || data;
  },

  clearCart: async () => {
    const response = await authFetch(getCartUrl(), { method: 'DELETE' });
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) throw new Error('Gagal mengosongkan keranjang');
    const data = await response.json();
    return data.data || data;
  },

  cleanCart: async () => {
    const response = await authFetch(getCartUrl('/clean'), { method: 'DELETE' });
    if (response.status === 401) throw new Error('Unauthorized');
    if (!response.ok) throw new Error('Gagal membersihkan keranjang');
    const data = await response.json();
    return data.data || data;
  },
};
