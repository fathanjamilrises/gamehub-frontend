// POST /api/webhook/digiflazz - Receive Digiflazz callback for inquiry/topup status

import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'
import { setInquiryResult } from '@/lib/inquiry-store'

const WEBHOOK_SECRET = process.env.DIGIFLAZZ_WEBHOOK_SECRET!

function verifySignature(payload: string, signature: string): boolean {
  // Digiflazz uses SHA1 HMAC: sha1=<hash>
  const expected = createHmac('sha1', WEBHOOK_SECRET).update(payload).digest('hex')
  return signature === expected
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[webhook-digiflazz] Received:', JSON.stringify(body))

    // Verify webhook signature if provided
    const signature = req.headers.get('X-Hub-Signature') || req.headers.get('x-hub-signature')
    if (signature) {
      // Signature format: sha1=<hash>
      const signatureValue = signature.replace('sha1=', '')
      const rawBody = JSON.stringify(body)
      const isValid = verifySignature(rawBody, signatureValue)
      if (!isValid) {
        console.error('[webhook-digiflazz] Invalid signature. Expected:', signatureValue, 'Body:', rawBody)
        return Response.json({ success: false, error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { ref_id, status, sn, customer_name, rc, message } = body?.data || body

    if (!ref_id) {
      return Response.json({ success: false, error: 'Missing ref_id' }, { status: 400 })
    }

    // Store the result
    const nickname = sn || customer_name || null
    setInquiryResult(ref_id, {
      nickname,
      status: status || 'Unknown',
    })

    console.log(`[webhook-digiflazz] Stored result for ${ref_id}:`, { nickname, status })

    return Response.json({ success: true, message: 'Webhook received' })
  } catch (error) {
    console.error('[webhook-digiflazz] Error:', error)
    return Response.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }
}
