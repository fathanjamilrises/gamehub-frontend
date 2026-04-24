// app/api/auth/route.ts - Auth API Routes
// POST /api/auth/login, /api/auth/register, /api/auth/refresh, /api/auth/logout
// Using action parameter in body to differentiate

import { login, register, refresh, logout, getProfile } from '@/lib/controllers/authController'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'login':
        return await login(body,req)
      case 'register':
        return await register(body)
      case 'refresh':
        return await refresh(req)
      case 'logout':
        return await logout(req)
      default:
        return Response.json(
          { success: false, error: 'Action tidak valid' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Auth route error:', error)
    return Response.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// GET /api/auth - Get current user profile
// Checks NextAuth session (Google) first, then falls back to accessToken cookie
export async function GET(req: Request) {
  // Check NextAuth session first (Google OAuth users)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    return Response.json({
      success: true,
      data: {
        user: {
          id: session.user.id ?? '',
          email: session.user.email ?? '',
          name: session.user.name ?? '',
          role: session.user.role ?? 'user',
        },
      },
      timestamp: new Date().toISOString(),
    })
  }

  // Fallback: email/password login via accessToken cookie
  return await getProfile(req)
}
