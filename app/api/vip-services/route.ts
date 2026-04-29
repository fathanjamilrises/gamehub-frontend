// GET /api/vip-services?game=mobile-legends - Fetch services from DB cache or VIP API

import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VIPRESELLER_API_ID = process.env.VIPRESELLER_API_ID!
const VIPRESELLER_API_KEY = process.env.VIPRESELLER_API_KEY!
const VIPRESELLER_SIGN = process.env.VIPRESELLER_SIGN!
const VIPRESELLER_BASE_URL = process.env.VIPRESELLER_BASE_URL || 'https://vip-reseller.co.id/api'

// Game SKU prefixes for filtering
const GAME_PREFIXES: Record<string, string[]> = {
  'mobile-legends': ['ML', 'MLBB', 'MOBA'],
  'free-fire': ['FF', 'FFMAX', 'FREEFIRE'],
  'pubg-mobile': ['PUBG', 'PUBGM'],
  'valorant': ['VAL', 'VPOINT'],
}

// ML Region specific prefixes
const ML_REGION_PREFIXES: Record<string, string[]> = {
  'MLSG': ['MLSG'],
  'MLBR': ['MLBR'],
  'MLGLOBAL': ['MLGLOBAL'],
  'MLMY': ['MLMY'],
  'MLPH': ['MLPH'],
  'MLRU': ['MLRU'],
  'MLMENA': ['MLMENA'],
  'MLTR': ['MLTR'],
  'MLUS': ['MLUS'],
  'MLA': ['MLA'],
}

interface VIPService {
  code: string
  name: string
  game: string
  price: {
    basic: number
    premium: number
    special: number
  }
  status: string
}

interface VIPServicesResponse {
  result: boolean
  data?: VIPService[]
  message?: string
}

async function fetchFromVIP(gameSlug: string, region?: string | null): Promise<VIPService[]> {
  // If region specified (for ML), use region prefix, otherwise use game prefixes
  const prefixes = region 
    ? (ML_REGION_PREFIXES[region] || [region])
    : (GAME_PREFIXES[gameSlug] || ['ML'])

  const formData = new URLSearchParams({
    id: VIPRESELLER_API_ID,
    key: VIPRESELLER_API_KEY,
    sign: VIPRESELLER_SIGN,
    type: 'services',
    filter_status: 'available',
  })

  const url = `${VIPRESELLER_BASE_URL}/game-feature`
  console.log('[vip-services] Fetching from VIP:', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })

  const result: VIPServicesResponse = await res.json()

  if (!result.result || !result.data) {
    throw new Error(result.message || 'VIP API error')
  }

  // Filter by game/region prefix
  return result.data.filter(svc => 
    prefixes.some(p => svc.code.toUpperCase().startsWith(p.toUpperCase()))
  )
}

async function getServices(gameSlug: string, region?: string | null) {
  // 1. Check DB cache first with region filter
  const whereClause: any = { game_slug: gameSlug }
  if (region) {
    whereClause.service_code = { startsWith: region }
  }
  
  const cached = await prisma.vip_services.findMany({
    where: whereClause,
    orderBy: { price: 'asc' },
  })

  if (cached.length > 0) {
    console.log('[vip-services] Cache hit:', cached.length, 'services')
    return cached.map(svc => ({
      code: svc.service_code,
      name: svc.name,
      price: svc.price,
      normal_price: svc.normal_price,
      basic: svc.basic,
      premium: svc.premium,
      special: svc.special,
    }))
  }

  // 2. Fetch from VIP API
  console.log('[vip-services] Cache miss, fetching from VIP...', region ? `region: ${region}` : '')
  const services = await fetchFromVIP(gameSlug, region)

  // 3. Save to DB with fake normal price (1.2x for strikethrough effect)
  for (const svc of services) {
    const normalPrice = Math.round(svc.price.basic * 1.2) // Fake normal price
    
    await prisma.vip_services.upsert({
      where: {
        game_slug_service_code: {
          game_slug: gameSlug,
          service_code: svc.code,
        },
      },
      update: {
        name: svc.name,
        price: svc.price.basic,
        normal_price: normalPrice,
        basic: svc.price.basic,
        premium: svc.price.premium,
        special: svc.price.special,
      },
      create: {
        game_slug: gameSlug,
        service_code: svc.code,
        name: svc.name,
        price: svc.price.basic,
        normal_price: normalPrice,
        basic: svc.price.basic,
        premium: svc.price.premium,
        special: svc.price.special,
      },
    })
  }

  return services.map(svc => ({
    code: svc.code,
    name: svc.name,
    price: svc.price.basic,
    normal_price: Math.round(svc.price.basic * 1.2),
    basic: svc.price.basic,
    premium: svc.price.premium,
    special: svc.price.special,
  }))
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gameSlug = decodeURIComponent(searchParams.get('game') || 'mobile-legends')
    const region = searchParams.get('region') // e.g., MLSG, MLBR, MLGLOBAL, MLMY

    const services = await getServices(gameSlug, region)

    return Response.json({ success: true, data: services })
  } catch (error) {
    console.error('[vip-services] Error:', error)
    return Response.json(
      { success: false, error: 'Gagal memuat layanan' },
      { status: 500 }
    )
  }
}
