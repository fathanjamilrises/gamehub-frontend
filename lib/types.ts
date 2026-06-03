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

export interface WorkerService {
  id: number;
  nama_layanan: string;
  deskripsi: string;
  harga_per_hari: number;
  rank_dari: string;
  rank_ke: string;
  is_active: boolean;
  game?: {
    id: number;
    nama_games: string;
    slug_games: string;
    gambar_games: string;
  };
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
  rank_saat_ini: string;
  rank_target: string;
  invoice_url?: string; // Sometimes returned with the order or wrapper
  created_at?: string;
  updated_at?: string;
  // User input fields (may not be returned in list but useful for types)
  slug_games?: string;
  id_service?: number;
  payer_email?: string;
  login_type?: string;
  game_email?: string;
  game_password?: string;
  game_username?: string;
  catatan_user?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  count?: number
  error?: string
  timestamp: string
}
