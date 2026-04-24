// lib/types.ts - Shared types for client and server
// File ini hanya contain types, tidak import package Node.js

export interface NominalItem {
  id: string
  label: string
  amount: number
  price: number
  bonus?: string
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

// API response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  count?: number
  error?: string
  timestamp: string
}
