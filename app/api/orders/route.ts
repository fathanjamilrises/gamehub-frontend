// app/api/orders/route.ts - CRUD riwayat pesanan (DB-backed)

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'

// Dummy orders data — kept only as fallback type reference, not used
const dummyOrders = [
  {
    id: 'ORD-001',
    orderCode: 'TRX-7A8B9C1D2E',
    date: '2024-04-20T14:30:00Z',
    status: 'completed',
    game: {
      name: 'Mobile Legends: Bang Bang',
      publisher: 'Moonton',
      image: 'https://cdn.mobilesyrup.com/wp-content/uploads/2021/02/mobile-legends-bang-bang.jpg',
    },
    item: {
      name: '172 Diamonds',
      amount: 172,
      price: 44000,
      bonus: '17 Bonus',
    },
    userId: 'user-001',
    playerId: '123456789',
    serverId: '2001',
    payment: {
      method: 'QRIS',
      total: 44000,
      fee: 0,
    },
    timeline: [
      { status: 'order_created', time: '2024-04-20T14:30:00Z', label: 'Pesanan Dibuat' },
      { status: 'payment_received', time: '2024-04-20T14:32:00Z', label: 'Pembayaran Diterima' },
      { status: 'processing', time: '2024-04-20T14:33:00Z', label: 'Sedang Diproses' },
      { status: 'completed', time: '2024-04-20T14:35:00Z', label: 'Selesai' },
    ],
  },
  {
    id: 'ORD-002',
    orderCode: 'TRX-3F4G5H6J7K',
    date: '2024-04-22T09:15:00Z',
    status: 'completed',
    game: {
      name: 'Free Fire',
      publisher: 'Garena',
      image: 'https://dl.dir.freefiremobile.com/common/web_event/hash/f2d15b4e5e8c1c9f8b4e8d5c6a7f8e9d.jpg',
    },
    item: {
      name: '520 Diamonds',
      amount: 520,
      price: 75000,
      bonus: '52 Bonus',
    },
    userId: 'user-001',
    playerId: '987654321',
    serverId: null,
    payment: {
      method: 'Bank Transfer',
      total: 75000,
      fee: 0,
    },
    timeline: [
      { status: 'order_created', time: '2024-04-22T09:15:00Z', label: 'Pesanan Dibuat' },
      { status: 'payment_received', time: '2024-04-22T09:20:00Z', label: 'Pembayaran Diterima' },
      { status: 'processing', time: '2024-04-22T09:22:00Z', label: 'Sedang Diproses' },
      { status: 'completed', time: '2024-04-22T09:25:00Z', label: 'Selesai' },
    ],
  },
  {
    id: 'ORD-003',
    orderCode: 'TRX-9L0M1N2O3P',
    date: '2024-04-23T16:45:00Z',
    status: 'pending',
    game: {
      name: 'PUBG Mobile',
      publisher: 'Tencent',
      image: 'https://wstatic-prod.pubg.com/web/live/main_4f8c5e1/img/b92d4f0.jpg',
    },
    item: {
      name: '660 UC',
      amount: 660,
      price: 145000,
      bonus: '60 Bonus',
    },
    userId: 'user-001',
    playerId: '456789123',
    serverId: null,
    payment: {
      method: 'Dana',
      total: 145000,
      fee: 0,
    },
    timeline: [
      { status: 'order_created', time: '2024-04-23T16:45:00Z', label: 'Pesanan Dibuat' },
      { status: 'awaiting_payment', time: '2024-04-23T16:45:00Z', label: 'Menunggu Pembayaran' },
    ],
  },
  {
    id: 'ORD-004',
    orderCode: 'TRX-5Q6R7S8T9U',
    date: '2024-04-24T08:00:00Z',
    status: 'processing',
    game: {
      name: 'Genshin Impact',
      publisher: 'HoYoverse',
      image: 'https://upload.wikimedia.org/wikipedia/en/5/57/Genshin_Impact_logo.svg',
    },
    item: {
      name: '1090 Genesis Crystals',
      amount: 1090,
      price: 249000,
      bonus: '110 Bonus',
    },
    userId: 'user-001',
    playerId: '789123456',
    serverId: null,
    payment: {
      method: 'QRIS',
      total: 249000,
      fee: 0,
    },
    timeline: [
      { status: 'order_created', time: '2024-04-24T08:00:00Z', label: 'Pesanan Dibuat' },
      { status: 'payment_received', time: '2024-04-24T08:05:00Z', label: 'Pembayaran Diterima' },
      { status: 'processing', time: '2024-04-24T08:07:00Z', label: 'Sedang Diproses' },
    ],
  },
  {
    id: 'ORD-005',
    orderCode: 'TRX-2V3W4X5Y6Z',
    date: '2024-04-18T11:20:00Z',
    status: 'completed',
    game: {
      name: 'Mobile Legends: Bang Bang',
      publisher: 'Moonton',
      image: 'https://cdn.mobilesyrup.com/wp-content/uploads/2021/02/mobile-legends-bang-bang.jpg',
    },
    item: {
      name: 'Starlight Member',
      amount: 1,
      price: 150000,
      bonus: 'Starlight Card',
    },
    userId: 'user-001',
    playerId: '123456789',
    serverId: '2001',
    payment: {
      method: 'OVO',
      total: 150000,
      fee: 0,
    },
    timeline: [
      { status: 'order_created', time: '2024-04-18T11:20:00Z', label: 'Pesanan Dibuat' },
      { status: 'payment_received', time: '2024-04-18T11:22:00Z', label: 'Pembayaran Diterima' },
      { status: 'processing', time: '2024-04-18T11:23:00Z', label: 'Sedang Diproses' },
      { status: 'completed', time: '2024-04-18T11:30:00Z', label: 'Selesai' },
    ],
  },
  {
    id: 'ORD-006',
    orderCode: 'TRX-8A1B2C3D4E',
    date: '2024-04-15T19:30:00Z',
    status: 'cancelled',
    game: {
      name: 'Valorant',
      publisher: 'Riot Games',
      image: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blte2e2c7f6549dbbe4/65494852a929ec002d92df6f/valorant_ep_7_act_3_header.jpg',
    },
    item: {
      name: '1000 VP',
      amount: 1000,
      price: 110000,
      bonus: null,
    },
    userId: 'user-001',
    playerId: 'RIOT#1234',
    serverId: null,
    payment: {
      method: 'Bank Transfer',
      total: 110000,
      fee: 0,
    },
    timeline: [
      { status: 'order_created', time: '2024-04-15T19:30:00Z', label: 'Pesanan Dibuat' },
      { status: 'cancelled', time: '2024-04-15T19:45:00Z', label: 'Dibatalkan' },
    ],
  },
]

// Helper untuk verify token
function verifyAccessToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      email: string
      type: string
    }
    if (decoded.type !== 'access') return null
    return { userId: decoded.userId, email: decoded.email }
  } catch {
    return null
  }
}

// Helper: resolve userId dari session atau cookie
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) return session.user.id

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  if (!accessToken) return null

  const decoded = verifyAccessToken(accessToken)
  return decoded?.userId ?? null
}

// GET /api/orders - Ambil semua pesanan milik user dari DB
export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req)
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = { user_id: parseInt(userId) }
    if (statusFilter && statusFilter !== 'all') where.status = statusFilter
    if (search) {
      where.OR = [
        { order_code: { contains: search } },
        { game_name: { contains: search } },
      ]
    }

    const orders = await prisma.orders.findMany({
      where,
      orderBy: { created_at: 'desc' },
    })

    const mapped = orders.map((o) => ({
      id: o.id.toString(),
      orderCode: o.order_code,
      date: o.created_at.toISOString(),
      status: o.status,
      game: {
        name: o.game_name,
        publisher: '',
        image: o.game_image ?? '',
      },
      item: {
        name: o.item_label,
        amount: 0,
        price: o.item_price,
        bonus: null,
      },
      playerId: o.player_id,
      serverId: o.server_id,
      nickname: o.nickname,
      payment: {
        method: o.payment_method ?? 'Xendit',
        total: o.item_price,
        fee: 0,
      },
      xenditInvoiceUrl: o.xendit_invoice_url,
      processedAt: o.processed_at?.toISOString() ?? null,
    }))

    return Response.json({
      success: true,
      data: mapped,
      count: mapped.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Orders GET error:', error)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

// POST /api/orders - Buat pesanan baru, lalu proses dummy 10 detik → completed
export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req)
    if (!userId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      playerId, serverId, nickname,
      gameSlug, gameName, gameImage,
      itemLabel, itemPrice,
      xenditInvoiceId, xenditInvoiceUrl,
    } = body

    if (!playerId || !gameSlug || !gameName || !itemLabel || !itemPrice) {
      return Response.json({ success: false, error: 'Data pesanan tidak lengkap' }, { status: 400 })
    }

    const orderCode = `TRX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const order = await prisma.orders.create({
      data: {
        order_code: orderCode,
        user_id: parseInt(userId),
        player_id: playerId,
        server_id: serverId ?? null,
        nickname: nickname ?? playerId,
        game_slug: gameSlug,
        game_name: gameName,
        game_image: gameImage ?? null,
        item_label: itemLabel,
        item_price: itemPrice,
        payment_method: 'Xendit',
        xendit_invoice_id: xenditInvoiceId ?? null,
        xendit_invoice_url: xenditInvoiceUrl ?? null,
        status: 'processing',
      },
    })

    return Response.json({
      success: true,
      data: {
        id: order.id.toString(),
        orderCode: order.order_code,
        status: order.status,
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Orders POST error:', error)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
