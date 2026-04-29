// GET /api/payment/check?orderCode=XXX - Check Xendit payment status

import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Xendit from 'xendit-node'

const prisma = new PrismaClient()

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
})

const { Invoice } = xenditClient

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderCode = searchParams.get('orderCode')

    if (!orderCode) {
      return Response.json({ success: false, error: 'Order code required' }, { status: 400 })
    }

    // Get order from DB with raw query to access all fields including new ones
    const orders = await prisma.$queryRaw`
      SELECT * FROM orders WHERE order_code = ${orderCode} LIMIT 1
    `
    const order = (orders as any[])[0]

    if (!order) {
      return Response.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // If already paid/completed, return early
    if (order.status === 'completed' || order.status === 'processing') {
      return Response.json({
        success: true,
        data: { status: order.status, paid: true },
      })
    }

    // If no Xendit invoice ID, can't check
    if (!order.xendit_invoice_id) {
      return Response.json({
        success: false,
        error: 'No invoice associated with order',
      })
    }

    // Check Xendit status
    try {
      const invoices = await Invoice.getInvoices({ externalId: order.order_code })
      const invoice = invoices.find(i => i.id === order.xendit_invoice_id) || invoices[0]
      
      // Update DB if status changed
      const isPaid = invoice.status === 'PAID' || invoice.status === 'SETTLED'
      if (isPaid && order.status !== 'paid' && order.status !== 'processing') {
        await prisma.orders.update({
          where: { id: order.id },
          data: { status: 'paid', payment_method: invoice.paymentMethod },
        })

        // Trigger VIP order immediately and await it
        if (order.service_code) {
          try {
            console.log('[payment-check] Triggering VIP order for:', orderCode)
            const vipRes = await fetch('http://localhost:3000/api/vip-order', {
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
            console.log('[payment-check] VIP order result:', vipData)
          } catch (err) {
            console.error('[payment-check] VIP order failed:', err)
          }
        } else {
          console.log('[payment-check] No service_code for order:', orderCode)
        }
      }

      return Response.json({
        success: true,
        data: {
          status: invoice.status,
          paid: isPaid,
          amount: invoice.amount,
          expiryDate: invoice.expiryDate,
        },
      })
    } catch (err) {
      return Response.json({
        success: false,
        error: 'Failed to check Xendit status',
        dbStatus: order.status,
      })
    }
  } catch (error) {
    console.error('[payment-check] Error:', error)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
