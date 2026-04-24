// POST /api/digiflazz/topup — Kirim top up ke Digiflazz menggunakan SKU dari DB

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

const DIGIFLAZZ_URL = 'https://api.digiflazz.com/v1/transaction'
const DIGIFLAZZ_USERNAME = process.env.DIGIFLAZZ_USERNAME ?? 'username'
// Digiflazz selalu pakai DEV KEY untuk signature (konfirmasi dari test-sign)
const DIGIFLAZZ_SIGN_KEY = process.env.DIGIFLAZZ_DEV_KEY!

function makeSign(refId: string): string {
  return createHash('md5')
    .update(DIGIFLAZZ_USERNAME + DIGIFLAZZ_SIGN_KEY + refId)
    .digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // nominalId: ID dari tabel nominals — dikirim dari FE saat konfirmasi
    // orderCode: untuk update status order setelah transaksi
    const { playerId, serverId, nominalId, orderCode } = body

    if (!playerId || !nominalId) {
      return Response.json(
        { success: false, error: 'Data tidak lengkap: playerId, nominalId wajib ada' },
        { status: 400 }
      )
    }

    // Ambil SKU dari DB
    const nominal = await prisma.nominals.findUnique({
      where: { id: Number(nominalId) },
    })

    if (!nominal) {
      return Response.json(
        { success: false, error: 'Nominal tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!nominal.sku_code) {
      return Response.json(
        { success: false, error: `SKU belum tersedia untuk: ${nominal.label}` },
        { status: 400 }
      )
    }

    // Format customer_no ML: playerId-serverId (sesuai format Digiflazz)
    const customerNo = serverId ? `${playerId}-${serverId}` : playerId
    const refId = `GH-${orderCode ?? Date.now()}`
    const sign = makeSign(refId)

    const payload = {
      username: DIGIFLAZZ_USERNAME,
      buyer_sku_code: nominal.sku_code,
      customer_no: customerNo,
      ref_id: refId,
      testing: true,
      sign,
    }

    const res = await fetch(DIGIFLAZZ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await res.json()
    const data = result?.data

    if (!data) {
      return Response.json(
        { success: false, error: result?.message ?? 'Respon tidak valid dari Digiflazz' },
        { status: 502 }
      )
    }

    const digiStatus = data.status as string // 'Sukses' | 'Gagal' | 'Pending'

    // Update order di DB jika orderCode dikirim
    if (orderCode) {
      await prisma.orders.updateMany({
        where: { order_code: orderCode },
        data: {
          digiflazz_ref: refId,
          digiflazz_status: digiStatus,
          ...(digiStatus === 'Sukses' ? { status: 'completed', processed_at: new Date() } : {}),
        },
      })
    }

    return Response.json({
      success: digiStatus === 'Sukses',
      status: digiStatus,
      message: data.message,
      sn: data.sn ?? null,
      refId: data.ref_id,
      rc: data.rc,
      skuUsed: nominal.sku_code,
    })
  } catch (error: any) {
    console.error('Digiflazz topup error:', error)
    return Response.json(
      { success: false, error: error?.message ?? 'Gagal menghubungi Digiflazz' },
      { status: 500 }
    )
  }
}
