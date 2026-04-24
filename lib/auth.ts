// lib/auth.ts - NextAuth configuration with Google Provider

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'

// Generate random password for Google users
function generateRandomPassword() {
  return bcrypt.hashSync(Math.random().toString(36).slice(-8) + Date.now(), 10)
}

// Generate tokens
function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign(
    { userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          let existingUser = await prisma.users.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            // Create new user from Google
            existingUser = await prisma.users.create({
              data: {
                email: user.email!,
                name: user.name || user.email!.split('@')[0],
                password: generateRandomPassword(), // Random password for Google users
                role: 'user',
              },
            })
          }

          // Create refresh token
          const { refreshToken } = generateTokens(
            existingUser.id.toString(),
            existingUser.email
          )

          // Store refresh token in database
          await prisma.refresh_tokens.create({
            data: {
              user_id: existingUser.id,
              token: refreshToken,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          })

          return true
        } catch (error) {
          console.error('Google sign in error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user) {
        // Get user from database
        const dbUser = await prisma.users.findUnique({
          where: { email: user.email! },
        })

        if (dbUser) {
          token.userId = dbUser.id.toString()
          token.email = dbUser.email
          token.name = dbUser.name
          token.role = dbUser.role

          // Generate tokens
          const { accessToken, refreshToken } = generateTokens(
            dbUser.id.toString(),
            dbUser.email
          )

          token.accessToken = accessToken
          token.refreshToken = refreshToken
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}
