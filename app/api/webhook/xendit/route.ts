// POST /api/webhook/xendit - Receive Xendit payment callbacks

import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN!

interface XenditInvoicePayload {
  id: string
  external_id: string
  status: 'PAID' | 'EXPIRED' | 'PENDING' | 'SETTLED'
  payment_method?: string
  payment_channel?: string
  bank_code?: string
}

interface XenditDirectDebitPayload {
  event: string
  id: string
  reference_id: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  channel_code?: string
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook token from header
    const callbackToken = req.headers.get('x-callback-token')
    if (XENDIT_WEBHOOK_TOKEN && callbackToken !== XENDIT_WEBHOOK_TOKEN) {
      console.error('[xendit-webhook] Invalid token')
      return Response.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    console.log('[xendit-webhook] Received:', JSON.stringify(body))

    // Handle different event types
    const event = body.event || 'invoice.paid'
    let orderId: string | null = null
    let isPaid = false

    // Payment session events have nested data field
    const payload = body.data || body

    if (event === 'invoice.paid' || event.includes('invoice')) {
      // Invoice webhook
      orderId = payload.external_id || payload.id
      isPaid = payload.status === 'PAID' || payload.status === 'SETTLED'
    } else if (event === 'payment_session.completed' || event === 'payment_session.expired') {
      // Payment session webhook
      orderId = payload.reference_id || payload.id
      isPaid = payload.status === 'COMPLETED'
    } else if (event.includes('payment') || event.includes('direct_debit')) {
      // Direct debit / payment method webhook
      orderId = payload.reference_id || payload.id
      isPaid = payload.status === 'COMPLETED'
    }

    if (!orderId) {
      console.error('[xendit-webhook] Cannot extract order ID from payload')
      return Response.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    // Find order by Xendit invoice ID or reference_id
    const order = await prisma.orders.findFirst({
      where: {
        OR: [
          { xendit_invoice_id: orderId },
          { order_code: orderId },
        ],
      },
    })

    if (!order) {
      console.error('[xendit-webhook] Order not found:', orderId)
      return Response.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // If paid, update status and trigger VIP order
    if (isPaid) {
      await prisma.orders.updateMany({
        where: { id: order.id },
        data: {
          status: 'processing',
          payment_method: body.payment_method || body.channel_code || body.payment_channel,
        },
      })

      // Trigger VIP Reseller order using service_code from DB
      if (order.service_code) {
        try {
          const vipRes = await fetch('/api/vip-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceCode: order.service_code,
              userId: order.player_id,
              serverId: order.server_id,
              orderCode: order.order_code,
            }),
          })
          const vipData = await vipRes.json()
          console.log('[xendit-webhook] VIP order triggered:', order.order_code, vipData.success)
        } catch (err) {
          console.error('[xendit-webhook] Failed to trigger VIP order:', err)
        }
      }
    } else if (body.status === 'EXPIRED' || body.status === 'FAILED') {
      await prisma.orders.updateMany({
        where: { id: order.id },
        data: { status: 'expired' },
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[xendit-webhook] Error:', error)
    return Response.json({ success: false, error: 'Webhook processing failed' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ success: true, message: 'Xendit webhook endpoint ready' })
}
