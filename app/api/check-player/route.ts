// POST /api/check-player - Cek nickname player via VIP Reseller (ML) atau dummy (game lain)

import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VIPRESELLER_API_ID = process.env.VIPRESELLER_API_ID!
const VIPRESELLER_API_KEY = process.env.VIPRESELLER_API_KEY!
const VIPRESELLER_SIGN = process.env.VIPRESELLER_SIGN!
const VIPRESELLER_BASE_URL = process.env.VIPRESELLER_BASE_URL || 'https://vip-reseller.co.id/api/'

// Game codes for VIP Reseller (from docs)
const GAME_CODES: Record<string, string> = {
  'mobile-legends': 'mobile-legends', // Mobile Legends
  'free-fire': 'free-fire',           // Free Fire
  'pubg-mobile': 'pubgm',             // PUBG Mobile
}

interface VIPResellerResponse {
  result: boolean
  data?: string | {
    nickname?: string
    country?: string
    code?: string
    zone?: string
    name?: string
  }
  message?: string
}

interface CheckResult {
  nickname: string | null
  region?: {
    code?: string
    name?: string
    zone?: string
    country?: string
  }
  error?: string
  debug: unknown
  fromCache?: boolean
}

async function checkMLNicknameVIP(
  userId: string,
  serverId: string
): Promise<CheckResult> {
  // 1. Check cache first
  const cached = await prisma.game_player_cache.findUnique({
    where: {
      game_slug_user_id_server_id: {
        game_slug: 'mobile-legends',
        user_id: userId,
        server_id: serverId,
      },
    },
  })

  if (cached?.region_code) {
    console.log('[check-player] Cache hit:', cached.nickname, 'Region:', cached.region_code)
    return { 
      nickname: cached.nickname, 
      region: {
        code: cached.region_code || undefined,
        name: cached.region_name || undefined,
        zone: cached.region_zone || undefined,
        country: cached.country || undefined,
      },
      debug: { cached: true }, 
      fromCache: true 
    }
  }

  // 2. Hit VIP Reseller API
  const gameCode = GAME_CODES['mobile-legends']

  const formData = new URLSearchParams({
    id: VIPRESELLER_API_ID,
    key: VIPRESELLER_API_KEY,
    sign: VIPRESELLER_SIGN,
    type: 'get-nickname',
    code: gameCode,
    target: userId,
    additional_target: serverId,
  })

  const url = `${VIPRESELLER_BASE_URL}/game-feature`
  console.log('[check-player] VIP Reseller URL:', url)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })

    const result: VIPResellerResponse = await res.json()
    console.log('[check-player] VIP Reseller response:', JSON.stringify(result))

    if (result.result && result.data) {
      // Parse response - could be string (nickname) or object (with region)
      const isObject = typeof result.data === 'object'
      const nickname = isObject ? (result.data.nickname || String(result.data)) : result.data
      const region = isObject ? {
        country: result.data.country,
        code: result.data.code,
        zone: result.data.zone,
        name: result.data.name,
      } : undefined

      // 3. Save to cache with region info
      await prisma.game_player_cache.create({
        data: {
          game_slug: 'mobile-legends',
          user_id: userId,
          server_id: serverId,
          nickname: nickname,
          region_code: region?.code || null,
          region_name: region?.name || null,
          region_zone: region?.zone || null,
          country: region?.country || null,
        },
      })
      console.log('[check-player] Saved to cache:', nickname, 'Region:', region)

      return { nickname, region, debug: result, fromCache: false }
    }

    return {
      nickname: null,
      error: result.message || 'Gagal mendapatkan nickname',
      debug: result,
    }
  } catch (err) {
    console.error('[check-player] VIP Reseller error:', err)
    return { nickname: null, error: String(err), debug: { error: String(err) } }
  }
}

// GET /api/check-player - Simple health check
export async function GET(req: NextRequest) {
  return Response.json({ success: true, message: 'API ready' })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, serverId, gameSlug } = body

    if (!userId) {
      return Response.json(
        { success: false, error: 'User ID wajib diisi' },
        { status: 400 }
      )
    }

    if (gameSlug === 'mobile-legends' && !serverId) {
      return Response.json(
        { success: false, error: 'Server ID wajib diisi untuk Mobile Legends' },
        { status: 400 }
      )
    }

    // Cek nickname real via VIP Reseller untuk ML
    if (gameSlug === 'mobile-legends') {
      const result = await checkMLNicknameVIP(userId, serverId)

      if (result.error) {
        return Response.json(
          {
            success: false,
            error: result.error,
            debug: result.debug,
          },
          { status: 502 }
        )
      }

      if (!result.nickname) {
        return Response.json(
          {
            success: false,
            error: 'User ID atau Server ID tidak ditemukan',
            debug: result.debug,
          },
          { status: 404 }
        )
      }

      return Response.json({
        success: true,
        data: { 
          userId, 
          serverId: serverId || null, 
          nickname: result.nickname,
          region: result.region,
        },
      })
    }

    // Game lain — fallback ke generated name
    await new Promise((r) => setTimeout(r, 500))
    const nickname = `Player${userId.slice(-4).padStart(4, '0')}`
    return Response.json({
      success: true,
      data: { userId, serverId: serverId || null, nickname },
    })
  } catch (error) {
    console.error('Check player error:', error)
    return Response.json(
      { success: false, error: 'Gagal mengecek data pemain' },
      { status: 500 }
    )
  }
}
