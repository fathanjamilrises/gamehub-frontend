// lib/controllers/authController.ts - Auth controller layer

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyAccessToken,
} from '../services/authService'

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'
const ACCESS_TOKEN_COOKIE_NAME = 'accessToken'

// Cookie config for httpOnly
const getRefreshCookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: '/',
})

const getAccessCookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60, // 15 minutes in seconds
  path: '/',
})

// POST /api/auth/register
export async function register(body: any): Promise<Response> {
  try {
    const { email, password, name, confirmPassword } = body

    // Validation
    if (!email || !password || !name) {
      return Response.json(
        { success: false, error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return Response.json(
        { success: false, error: 'Konfirmasi password tidak cocok' },
        { status: 400 }
      )
    }

    const result = await registerUser(email, password, name)

    if ('error' in result) {
      return Response.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return Response.json(
      { success: true, data: result.user, timestamp: new Date().toISOString() },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register controller error:', error)
    return Response.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/auth/login
export async function login(body: any, req: Request): Promise<Response> {
  try {
    const { email, password } = body

    if (!email || !password) {
      return Response.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    const result = await loginUser(email, password)

    if ('error' in result) {
      return Response.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    // Set httpOnly cookies
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.append(
      'Set-Cookie',
      `${REFRESH_TOKEN_COOKIE_NAME}=${result.tokens.refreshToken}; ${Object.entries(getRefreshCookieConfig()).map(([k, v]) => `${k}=${v}`).join('; ')}`
    )
    headers.append(
      'Set-Cookie',
      `${ACCESS_TOKEN_COOKIE_NAME}=${result.tokens.accessToken}; ${Object.entries(getAccessCookieConfig()).map(([k, v]) => `${k}=${v}`).join('; ')}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Login controller error:', error)
    return Response.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request): Promise<Response> {
  try {
    // Get refresh token from cookie
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [key, value] = c.trim().split('=')
        return [key, value]
      })
    )
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE_NAME]

    if (!refreshToken) {
      return Response.json(
        { success: false, error: 'Refresh token tidak ditemukan' },
        { status: 401 }
      )
    }

    const result = await refreshAccessToken(refreshToken)

    if ('error' in result) {
      return Response.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    // Set new access token cookie
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.append(
      'Set-Cookie',
      `${ACCESS_TOKEN_COOKIE_NAME}=${result.accessToken}; ${Object.entries(getAccessCookieConfig()).map(([k, v]) => `${k}=${v}`).join('; ')}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: { accessToken: result.accessToken },
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Refresh controller error:', error)
    return Response.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/auth/logout
export async function logout(req: Request): Promise<Response> {
  try {
    // Get refresh token from cookie
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [key, value] = c.trim().split('=')
        return [key, value]
      })
    )
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE_NAME]

    if (refreshToken) {
      await logoutUser(refreshToken)
    }

    // Clear cookies
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.append(
      'Set-Cookie',
      `${REFRESH_TOKEN_COOKIE_NAME}=; ${Object.entries({ ...getRefreshCookieConfig(), maxAge: 0 }).map(([k, v]) => `${k}=${v}`).join('; ')}`
    )
    headers.append(
      'Set-Cookie',
      `${ACCESS_TOKEN_COOKIE_NAME}=; ${Object.entries({ ...getAccessCookieConfig(), maxAge: 0 }).map(([k, v]) => `${k}=${v}`).join('; ')}`
    )

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logout berhasil',
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Logout controller error:', error)
    return Response.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// GET /api/auth/me - Get current user profile
export async function getProfile(req: Request): Promise<Response> {
  try {
    // Get access token from cookie
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [key, value] = c.trim().split('=')
        return [key, value]
      })
    )
    const accessToken = cookies[ACCESS_TOKEN_COOKIE_NAME]

    if (!accessToken) {
      return Response.json(
        { success: false, error: 'Access token tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verify access token
    const decoded = verifyAccessToken(accessToken)

    if (!decoded) {
      return Response.json(
        { success: false, error: 'Access token tidak valid' },
        { status: 401 }
      )
    }

    return Response.json(
      {
        success: true,
        data: {
          user: {
            id: decoded.userId,
            email: decoded.email,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get profile controller error:', error)
    return Response.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
