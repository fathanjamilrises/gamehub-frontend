// POST /api/vip-order - Create order with VIP Reseller

import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VIPRESELLER_API_ID = process.env.VIPRESELLER_API_ID!
const VIPRESELLER_API_KEY = process.env.VIPRESELLER_API_KEY!
const VIPRESELLER_SIGN = process.env.VIPRESELLER_SIGN!
const VIPRESELLER_BASE_URL = process.env.VIPRESELLER_BASE_URL || 'https://vip-reseller.co.id/api'

interface VIPOrderResponse {
  result: boolean
  data?: {
    trxid: string
    code: string
    data: string
    zone?: string
    service: string
    status: string
    price: number
    balance?: number
    sn?: string
    note?: string
  }
  message?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { serviceCode, userId, serverId, orderCode } = body

    if (!serviceCode || !userId) {
      return Response.json(
        { success: false, error: 'Service code dan User ID wajib diisi' },
        { status: 400 }
      )
    }

    // Build form data
    const formData = new URLSearchParams({
      id: VIPRESELLER_API_ID,
      key: VIPRESELLER_API_KEY,
      sign: VIPRESELLER_SIGN,
      type: 'order',
      service: serviceCode,
      data_no: userId,
      ...(serverId && { data_zone: serverId }),
    })

    const url = `${VIPRESELLER_BASE_URL}/game-feature`
    console.log('[vip-order] Ordering:', serviceCode, 'for', userId)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })

    const result: VIPOrderResponse = await res.json()
    console.log('[vip-order] Response:', JSON.stringify(result))

    if (result.result && result.data) {
      // Update order with VIP Reseller info
      if (orderCode) {
        await prisma.orders.updateMany({
          where: { order_code: orderCode },
          data: {
            vip_reseller_ref: result.data.trxid,
            vip_reseller_status: result.data.status,
            status: mapStatus(result.data.status),
          },
        })
      }

      return Response.json({
        success: true,
        data: {
          trxid: result.data.trxid,
          status: result.data.status,
          service: result.data.service,
          price: result.data.price,
          note: result.data.note,
        },
      })
    }

    return Response.json(
      { success: false, error: result.message || 'Order gagal' },
      { status: 502 }
    )
  } catch (error) {
    console.error('[vip-order] Error:', error)
    return Response.json(
      { success: false, error: 'Gagal membuat order' },
      { status: 500 }
    )
  }
}

function mapStatus(vipStatus: string): string {
  const statusMap: Record<string, string> = {
    'waiting': 'pending',
    'processing': 'processing',
    'success': 'completed',
    'failed': 'failed',
    'cancel': 'cancelled',
  }
  return statusMap[vipStatus] || 'pending'
}
