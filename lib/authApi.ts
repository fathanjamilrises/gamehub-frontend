/**
 * Auth API Client
 * Backend: NEXT_PUBLIC_API_URL/api/auth
 */

// Browser memakai rewrite Next.js (`/api/auth/*`) agar request auth
// tetap same-origin dan terhindar dari CORS. Server-side (SSR) tetap
// pakai URL backend langsung.
const API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || ''
    : ''

const AUTH_URL =
  typeof window === 'undefined' ? `${API_BASE}/api/auth` : '/api/auth'

const TOKEN_KEY = 'gamehub_auth_token'
const USER_KEY = 'gamehub_auth_user'

export interface AuthUser {
  id: string
  username?: string
  email: string
  name?: string
  phone?: string
  avatar?: string
  role?: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  user?: AuthUser
  token?: string
  refreshToken?: string
}

function isExpectedRefreshFailure(message: string): boolean {
  const normalizedMessage = message.trim().toLowerCase()
  return (
    normalizedMessage.includes('invalid refresh token') ||
    normalizedMessage.includes('refresh token tidak tersedia') ||
    normalizedMessage.includes('jwt expired') ||
    normalizedMessage.includes('token expired') ||
    normalizedMessage.includes('unauthorized')
  )
}

// ── Token / User storage ──────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}



export function clearToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  
  // Set flag bahwa user sudah logout (karena HttpOnly cookies tidak bisa dihapus via JS)
  localStorage.setItem('gamehub_logged_out', 'true')
  
  // Tetap coba hapus cookie (hanya berlaku untuk non-HttpOnly cookies)
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
}

export function isLoggedOutFlag(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('gamehub_logged_out') === 'true'
}

export function clearLoggedOutFlag() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('gamehub_logged_out')
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setStoredUser(user: AuthUser) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// ── API helpers ───────────────────────────────────────────────────
function formatErrors(data: any): string | null {
  if (!data) return null
  // { errors: [{ field, message }, ...] }
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    // Group unique by field, take first message per field
    const seen = new Set<string>()
    const msgs: string[] = []
    for (const e of data.errors) {
      const field = e.field || ''
      if (seen.has(field)) continue
      seen.add(field)
      msgs.push(e.message || JSON.stringify(e))
    }
    return msgs.join(' • ')
  }
  return null
}

async function postJSON<T>(path: string, body: Record<string, any>): Promise<T> {
  const url = `${AUTH_URL}${path}`
  // Try JSON first
  // eslint-disable-next-line no-console
  console.log('[authApi] POST (JSON)', url, body)
  let res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  let data = await res.json().catch(() => ({}))
  // eslint-disable-next-line no-console
  console.log('[authApi] response (JSON)', res.status, data)

  // Fallback: if backend reports "is required" but payload is populated,
  // it likely doesn't parse JSON. Retry with x-www-form-urlencoded.
  const looksLikeBodyMissing =
    data?.success === false &&
    Array.isArray(data.errors) &&
    data.errors.some((e: any) => /is required/i.test(e?.message || ''))

  if (looksLikeBodyMissing) {
    const form = new URLSearchParams()
    for (const [k, v] of Object.entries(body)) {
      if (v != null) form.append(k, String(v))
    }
    // eslint-disable-next-line no-console
    console.log('[authApi] retry (form)', url, form.toString())
    res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: form.toString(),
    })
    data = await res.json().catch(() => ({}))
    // eslint-disable-next-line no-console
    console.log('[authApi] response (form)', res.status, data)
  }

  if (!res.ok || data?.success === false) {
    const msg =
      formatErrors(data) ||
      (data && (data.message || data.error)) ||
      `Request gagal (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

async function authApiPost<T>(path: string, body: Record<string, any>, token?: string): Promise<T> {
  const url = `${AUTH_URL}${path}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // eslint-disable-next-line no-console
  console.log('[authApi] POST-AUTH (JSON)', url, body)
  let res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(body),
  })
  let data = await res.json().catch(() => ({}))
  // eslint-disable-next-line no-console
  console.log('[authApi] response-auth (JSON)', res.status, data)

  const looksLikeBodyMissing =
    data?.success === false &&
    Array.isArray(data.errors) &&
    data.errors.some((e: any) => /is required/i.test(e?.message || ''))

  if (looksLikeBodyMissing) {
    const form = new URLSearchParams()
    for (const [k, v] of Object.entries(body)) {
      if (v != null) form.append(k, String(v))
    }
    const formHeaders: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    }
    if (token) {
      formHeaders.Authorization = `Bearer ${token}`
    }
    // eslint-disable-next-line no-console
    console.log('[authApi] retry-auth (form)', url, form.toString())
    res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: formHeaders,
      body: form.toString(),
    })
    data = await res.json().catch(() => ({}))
    // eslint-disable-next-line no-console
    console.log('[authApi] response-auth (form)', res.status, data)
  }

  if (!res.ok || data?.success === false) {
    const msg =
      formatErrors(data) ||
      (data && (data.message || data.error)) ||
      `Request gagal (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

// Normalize various API response shapes into AuthResponse
function normalizeAuth(data: any): AuthResponse {
  // Common shapes:
  //  { success, data: { user, token } }
  //  { user, token }
  //  { data: { ... } }
  const payload = data?.data ?? data
  const token = payload?.token ?? payload?.accessToken ?? data?.token
  const refreshToken =
    payload?.refreshToken ?? payload?.refresh_token ?? data?.refreshToken ?? data?.refresh_token
  const user =
    payload?.user ??
    (payload?.id || payload?.email || payload?.id_user
      ? {
          id: String(payload.id || payload.id_user || payload.userId),
          username: payload.username,
          email: payload.email,
          name: payload.name,
          phone: payload.phone,
          avatar: payload.avatar,
          role: payload.role,
        }
      : undefined)
  return { success: true, user, token, refreshToken }
}

function normalizeUser(data: any): AuthUser | null {
  const payload = data?.data?.user ?? data?.data ?? data?.user ?? data
  if (!payload?.id && !payload?.email && !payload?.id_user) return null
  return {
    id: String(payload.id || payload.id_user || payload.userId),
    username: payload.username,
    email: payload.email,
    name: payload.name ?? payload.username,
    phone: payload.phone,
    avatar: payload.avatar,
    role: payload.role,
  }
}

// ── Auth actions ──────────────────────────────────────────────────
export async function apiLogin(
  emailOrUsername: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const id = emailOrUsername.trim()
    const data = await postJSON<any>('/login', {
      email: id,
      username: id,
      password,
    })
    const normalized = normalizeAuth(data)
    console.log('[authApi] Login normalized result:', {
      hasToken: !!normalized.token,
      hasRefreshToken: !!normalized.refreshToken,
      hasUser: !!normalized.user,
      rawDataKeys: data ? Object.keys(data) : [],
      rawPayloadKeys: data?.data ? Object.keys(data.data) : [],
    })
    if (normalized.token) setToken(normalized.token)
    if (normalized.user) setStoredUser(normalized.user)
    return normalized
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Login gagal' }
  }
}

export async function apiRegister(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const data = await postJSON<any>('/register', {
      username: username.trim(),
      email: email.trim(),
      password,
    })
    const normalized = normalizeAuth(data)
    if (normalized.token) setToken(normalized.token)
    if (normalized.user) setStoredUser(normalized.user)
    return normalized
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Registrasi gagal' }
  }
}



export async function apiGetProfile(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const response = await authFetch(`${AUTH_URL}/profile`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || data?.success === false) {
      const msg =
        formatErrors(data) ||
        (data && (data.message || data.error)) ||
        `Request gagal (${response.status})`
      return { success: false, error: msg }
    }

    const user = normalizeUser(data)
    if (!user) {
      return { success: false, error: 'Data profil tidak valid' }
    }

    setStoredUser(user)
    return { success: true, user }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengambil profil' }
  }
}

export async function apiLogout(): Promise<void> {
  const token = getToken()
  if (token) {
    try {
      await authApiPost('/logout', {}, token)
    } catch {
      /* ignore */
    }
  }
  clearToken()
}

// Decode JWT payload tanpa library (hanya ambil exp)
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

// Cek apakah token sudah expired (dengan buffer 30 detik)
function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  const exp = decodeJwtExp(token)
  if (exp === null) return true
  // Buffer 30 detik sebelum expiry
  return Date.now() / 1000 >= exp - 30
}

// Helper: baca token baru dari response header dan simpan + log
// Hanya update jika token saat ini sudah expired
function extractAndSaveNewTokens(response: Response, route: string) {
  const newAccessToken =
    response.headers.get('x-new-access-token') ||
    response.headers.get('x-new-acces-token')
  const newRefreshToken = response.headers.get('x-new-refresh-token')

  if (typeof window !== 'undefined') {
    if (newAccessToken) {
      const currentToken = getToken()
      if (isTokenExpired(currentToken)) {
        console.log(`[authApi] 🔄 Access token ROTATED — route: ${route}`)
        console.log(`[authApi]    reason: current token expired`)
        setToken(newAccessToken)
      } else {
        console.log(`[authApi] ⏭️ New access token from ${route} — SKIPPED (current still valid)`)
      }
    }
  }

  return { newAccessToken }
}

// Authorized fetch helper for other API calls
// Mengikuti pola adminFetch: kirim refresh token via header,
// backend otomatis refresh dan kirim token baru via response header
export async function authFetch(input: string, init: RequestInit = {}) {
  const createHeaders = () => {
    const headers = new Headers(init.headers)
    const token = getToken()

    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    return headers
  }

  const response = await fetch(input, { ...init, credentials: 'include', headers: createHeaders() })

  console.log(`[authFetch] ← ${response.status} ${input}`)

  // Baca dan simpan token baru dari response header (backend auto-refresh)
  extractAndSaveNewTokens(response, `${init.method || 'GET'} ${input}`)

  // Jika masih 401, biarkan backend handle via cookie atau paksa login ulang
  if (response.status === 401) {
    console.log('[authFetch] ⚠️ Got 401, session might be expired.')
    // clearToken() // Optional: uncomment if you want to force logout on 401
  }

  return response
}
