function isAdminTokenExpired(token: string | null): boolean {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    if (typeof payload.exp !== 'number') return true
    return Date.now() / 1000 >= payload.exp - 30
  } catch {
    return true
  }
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const isBrowser = typeof window !== 'undefined'
  
  const tk = isBrowser ? localStorage.getItem('gamehub_admin_token') : null

  const headers = new Headers(options.headers || {})
  
  if (tk) {
    headers.set('Authorization', `Bearer ${tk}`)
  }

  const res = await fetch(url, { ...options, credentials: 'include', headers })

  const newAccessToken = res.headers.get('x-new-acces-token') || res.headers.get('x-new-access-token')

  if (isBrowser && newAccessToken) {
    if (isAdminTokenExpired(tk)) {
      console.log(`[adminFetch] 🔄 Access token ROTATED — route: ${url}`)
      localStorage.setItem('gamehub_admin_token', newAccessToken)
    } else {
      console.log(`[adminFetch] ⏭️ New access token from ${url} — SKIPPED (current still valid)`)
    }
  }

  return res
}
