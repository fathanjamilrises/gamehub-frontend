// lib/api.ts - Client-safe API exports (NO server-only imports)
// File ini aman di-import di Client Components

// Re-export types only (dari types.ts, bukan service)
export type { NominalItem, GameListItem, GameDetail, User } from './types'
export { formatRupiah } from './types'

// API base URL
export const API_BASE = '/api'

// Fetch helper for client components
export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    next: { revalidate: 60, ...options?.next },
  })
  
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }
  
  const json = await res.json()
  return json.data as T
}
