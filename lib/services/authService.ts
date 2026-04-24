// lib/services/authService.ts - Auth business logic & data access layer
// File ini SERVER-ONLY

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key'
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

// Types
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

// Register user
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ user: User } | { error: string }> {
  try {
    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: 'Email sudah terdaftar' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user',
      },
    })

    return {
      user: {
        id: newUser.id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    }
  } catch (error) {
    console.error('Register error:', error)
    return { error: 'Terjadi kesalahan saat registrasi' }
  }
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse | { error: string }> {
  try {
    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      return { error: 'Email atau password salah' }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return { error: 'Email atau password salah' }
    }

    // Generate tokens
    const tokens = await generateTokens(user.id, user.email)

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'Terjadi kesalahan saat login' }
  }
}

// Generate access and refresh tokens
async function generateTokens(userId: number, email: string): Promise<AuthTokens> {
  const accessToken = jwt.sign(
    { userId: userId.toString(), email, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )

  const refreshToken = jwt.sign(
    { userId: userId.toString(), email, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  )

  // Store refresh token in database
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)

  await prisma.refresh_tokens.create({
    data: {
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

// Refresh access token
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string } | { error: string }> {
  try {
    // Verify refresh token signature
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      userId: string
      email: string
      type: string
    }

    if (decoded.type !== 'refresh') {
      return { error: 'Invalid token type' }
    }

    // Check if token exists in database
    const storedToken = await prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken) {
      return { error: 'Refresh token tidak valid' }
    }

    // Check if token is expired
    if (new Date() > storedToken.expires_at) {
      await prisma.refresh_tokens.delete({
        where: { id: storedToken.id },
      })
      return { error: 'Refresh token sudah expired' }
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    return { accessToken }
  } catch (error) {
    console.error('Refresh token error:', error)
    return { error: 'Refresh token tidak valid' }
  }
}

// Logout - delete refresh token
export async function logoutUser(refreshToken: string): Promise<{ success: boolean }> {
  try {
    await prisma.refresh_tokens.deleteMany({
      where: { token: refreshToken },
    })
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false }
  }
}

// Verify access token
export function verifyAccessToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      email: string
      type: string
    }

    if (decoded.type !== 'access') {
      return null
    }

    return { userId: decoded.userId, email: decoded.email }
  } catch (error) {
    return null
  }
}
