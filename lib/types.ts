// lib/types.ts - Shared types for client and server
// File ini hanya contain types, tidak import package Node.js

export interface NominalItem {
  id: string
  label: string
  amount: number
  price: number
  originalPrice?: number
  bonus?: string
  image?: string
  code?: string
}

export interface GameListItem {
  id: string
  slug: string
  name: string
  publisher: string
  category: string
  badge: string
  image_url: string
}

export interface GameDetail extends GameListItem {
  nominals: NominalItem[]
}

// Helper untuk format rupiah (pure function, safe for client)
export function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID')
}

// Auth types
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface JokiSubProduct {
  id: number;
  id_produk_joki?: number;
  nama_sub: string;
  satuan: string;
  harga_per_unit: string | number;
  min_unit?: number;
  max_unit?: number | null;
  is_active?: boolean;
}

export interface WorkerService {
  id: number;
  nama_layanan?: string;
  nama_produk?: string; // backend format
  deskripsi: string;
  harga_per_hari?: number;
  harga?: number; // backend format
  rank_dari?: string;
  rank_ke?: string;
  kategori_joki?: string;
  minimal_order?: number;
  gambar_produk?: string;
  is_active: boolean;
  game?: {
    id: number;
    nama_games: string;
    slug_games: string;
    gambar_games: string;
  };
  subs?: JokiSubProduct[]; // backend sub-products
}

export interface WorkerProfile {
  id: number;
  nama_lengkap: string;
  no_hp?: string; // used in registration/profile
  bio: string;
  foto_url: string;
  rating: string | number;
  total_order: number;
  status: string; // 'approved', 'pending', etc.
  user?: {
    id: number;
    username: string;
  };
  services?: WorkerService[];
}

export interface JokiOrder {
  id: number;
  invoice_number: string;
  status: string; // 'waiting_payment', 'paid', 'in_progress', 'done', 'confirmed', 'cancelled'
  harga: number;
  nama_games: string;
  rank_saat_ini?: string;
  rank_target?: string;
  invoice_url?: string;
  created_at?: string;
  updated_at?: string;
  // User input fields (returned in detail/list)
  slug_games?: string;
  id_service?: number;
  id_sub_produk?: number;
  jumlah_unit?: number;
  satuan?: string;
  payer_email?: string;
  login_type?: string; // 'email' | 'google' | 'facebook' | 'moonton' | 'other'
  game_email?: string;
  game_password?: string;
  game_username?: string;
  catatan_user?: string;
  room_chat_id?: number;
}

// Joki order creation response from backend
export interface JokiOrderCreateResponse {
  order: JokiOrder;
  invoice_url: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  count?: number
  error?: string
  timestamp: string
}
