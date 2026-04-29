// POST /api/payment/create — Buat Invoice Xendit dan kembalikan link pembayaran

import { NextRequest } from 'next/server'
import Xendit from 'xendit-node'

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
})

const { Invoice } = xenditClient

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, serverId, nickname, gameSlug, gameName, itemLabel, itemPrice, externalId: providedExternalId } = body

    // Validasi input
    if (!userId || !gameSlug || !gameName || !itemLabel || !itemPrice) {
      return Response.json(
        { success: false, error: 'Data pesanan tidak lengkap' },
        { status: 400 }
      )
    }

    const externalId = providedExternalId || `GAMEHUB-${gameSlug.toUpperCase()}-${Date.now()}`
    const description = `Top Up ${gameName} — ${itemLabel} (ID: ${userId}${serverId ? ` / Server: ${serverId}` : ''})`

    const invoice = await Invoice.createInvoice({
      data: {
        externalId,
        amount: itemPrice,
        description,
        currency: 'IDR',
        customer: {
          givenNames: nickname || `Player ${userId}`,
        },
        customerNotificationPreference: {
          invoiceCreated: ['email'],
          invoiceReminder: ['email'],
          invoicePaid: ['email'],
        },
        successRedirectUrl: `${process.env.NEXTAUTH_URL}/orders`,
        failureRedirectUrl: `${process.env.NEXTAUTH_URL}/topup/${gameSlug}`,
        items: [
          {
            name: `${gameName} — ${itemLabel}`,
            quantity: 1,
            price: itemPrice,
          },
        ],
        fees: [],
      },
    })

    return Response.json({
      success: true,
      data: {
        invoiceId: invoice.id,
        externalId: invoice.externalId,
        invoiceUrl: invoice.invoiceUrl,
        status: invoice.status,
        amount: invoice.amount,
        expiryDate: invoice.expiryDate,
      },
    })
  } catch (error: any) {
    console.error('Xendit create invoice error:', error)
    return Response.json(
      {
        success: false,
        error: error?.message ?? 'Gagal membuat link pembayaran',
      },
      { status: 500 }
    )
  }
}
