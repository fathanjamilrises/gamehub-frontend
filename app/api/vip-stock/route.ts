// GET /api/vip-stock?service=ML300-S48 - Check stock for a service

import { NextRequest } from 'next/server'

const VIPRESELLER_API_ID = process.env.VIPRESELLER_API_ID!
const VIPRESELLER_API_KEY = process.env.VIPRESELLER_API_KEY!
const VIPRESELLER_SIGN = process.env.VIPRESELLER_SIGN!
const VIPRESELLER_BASE_URL = process.env.VIPRESELLER_BASE_URL || 'https://vip-reseller.co.id/api'

interface VIPStockResponse {
  result: boolean
  data?: {
    code: string
    name: string
    price: {
      basic: number
      premium: number
      special: number
    }
    description: string
    stock: number
    server: number
    status: string
  }
  message?: string
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const serviceCode = searchParams.get('service')

    if (!serviceCode) {
      return Response.json(
        { success: false, error: 'Service code wajib diisi' },
        { status: 400 }
      )
    }

    const formData = new URLSearchParams({
      id: VIPRESELLER_API_ID,
      key: VIPRESELLER_API_KEY,
      sign: VIPRESELLER_SIGN,
      type: 'service-stock',
      service: serviceCode,
    })

    const url = `${VIPRESELLER_BASE_URL}/game-feature`
    console.log('[vip-stock] Checking:', serviceCode)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })

    const result: VIPStockResponse = await res.json()
    console.log('[vip-stock] Response:', JSON.stringify(result))

    if (result.result && result.data) {
      return Response.json({
        success: true,
        data: {
          code: result.data.code,
          name: result.data.name,
          stock: result.data.stock,
          status: result.data.status,
          available: result.data.status === 'available' && result.data.stock > 0,
        },
      })
    }

    return Response.json(
      { success: false, error: result.message || 'Gagal cek stok' },
      { status: 502 }
    )
  } catch (error) {
    console.error('[vip-stock] Error:', error)
    return Response.json(
      { success: false, error: 'Gagal cek stok' },
      { status: 500 }
    )
  }
}
