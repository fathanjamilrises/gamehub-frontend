// POST /api/webhook/vip-reseller - Receive VIP Reseller webhook callbacks

import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VIPWebhookPayload {
  trxid: string
  data: string
  zone?: string
  service: string
  status: 'waiting' | 'processing' | 'success' | 'error'
  note?: string
  price?: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    
    console.log('[vip-webhook] Received:', body)

    const data: VIPWebhookPayload = JSON.parse(body)
    
    // Map VIP status to our status
    const statusMap: Record<string, string> = {
      'waiting': 'pending',
      'processing': 'processing',
      'success': 'completed',
      'error': 'failed',
    }
    
    const newStatus = statusMap[data.status] || data.status

    // Update order in DB
    const updated = await prisma.orders.updateMany({
      where: { vip_reseller_ref: data.trxid },
      data: {
        vip_reseller_status: data.status,
        status: newStatus,
        ...(data.status === 'success' && { processed_at: new Date() }),
      },
    })

    console.log('[vip-webhook] Updated orders:', updated.count)

    return Response.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('[vip-webhook] Error:', error)
    return Response.json({ success: false, error: 'Webhook processing failed' }, { status: 500 })
  }
}

// VIP Reseller may send test requests or require GET for verification
export async function GET() {
  return Response.json({ success: true, message: 'VIP Reseller webhook endpoint ready' })
}
