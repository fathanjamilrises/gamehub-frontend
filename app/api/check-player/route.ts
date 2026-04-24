// POST /api/check-player - Cek nickname player via Digiflazz (ML) atau dummy (game lain)

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'

const DIGIFLAZZ_USERNAME = process.env.DIGIFLAZZ_USERNAME ?? 'username'
// Digiflazz selalu pakai DEV KEY untuk signature (konfirmasi dari test-sign)
const DIGIFLAZZ_SIGN_KEY = process.env.DIGIFLAZZ_DEV_KEY!

// SKU untuk cek nickname ML di Digiflazz
// "mlcek" = Mobile Legends Cek Username (Rp 5) — tersedia di production key
const ML_INQUIRY_SKU = 'CEKML'

async function digiflazzPost(payload: Record<string, unknown>) {
  const res = await fetch('https://api.digiflazz.com/v1/transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

async function checkMLNickname(userId: string, serverId: string): Promise<{ nickname: string | null; debug: unknown }> {
  const customerNo = `${userId}-${serverId}`
  const refId = `CHK-ML-${userId}-${serverId}`  // ref_id tetap sama untuk polling ulang
  const sign = createHash('md5')
    .update(DIGIFLAZZ_USERNAME + DIGIFLAZZ_SIGN_KEY + refId)
    .digest('hex')

  const payload = {
    username: DIGIFLAZZ_USERNAME,
    buyer_sku_code: ML_INQUIRY_SKU,
    customer_no: customerNo,
    ref_id: refId,
    sign,
    // Tanpa testing:true agar hit Moonton real untuk dapat nickname asli
  }

  console.log('[check-player] Digiflazz payload:', JSON.stringify(payload))

  try {
    // Kirim request pertama
    let result = await digiflazzPost(payload)
    console.log('[check-player] Digiflazz response #1:', JSON.stringify(result))

    let d = result?.data
    // Nickname dari ml-cek ada di field sn setelah Sukses
    let nickname = d?.sn || d?.customer_name || null

    // Jika Pending (rc kosong atau '03'), poll ulang (max 5x, interval 2s)
    let attempt = 0
    const isPending = (data: Record<string, string>) =>
      data?.status === 'Pending' || data?.rc === '' || data?.rc === '03'

    while (!nickname && isPending(d) && attempt < 5) {
      await new Promise((r) => setTimeout(r, 2000))
      result = await digiflazzPost(payload)
      d = result?.data
      nickname = d?.sn || d?.customer_name || null
      attempt++
      console.log(`[check-player] Digiflazz poll #${attempt + 1}:`, JSON.stringify(result))
    }

    return { nickname, debug: result }
  } catch (err) {
    console.error('[check-player] Digiflazz fetch error:', err)
    return { nickname: null, debug: { error: String(err) } }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, serverId, gameSlug } = body

    if (!userId) {
      return Response.json(
        { success: false, error: 'User ID wajib diisi' },
        { status: 400 }
      )
    }

    if (gameSlug === 'mobile-legends' && !serverId) {
      return Response.json(
        { success: false, error: 'Server ID wajib diisi untuk Mobile Legends' },
        { status: 400 }
      )
    }

    // Cek nickname real via Digiflazz untuk ML
    if (gameSlug === 'mobile-legends') {
      const { nickname, debug } = await checkMLNickname(userId, serverId)

      if (!nickname) {
        return Response.json(
          {
            success: false,
            error: 'User ID atau Server ID tidak ditemukan',
            debug,
          },
          { status: 404 }
        )
      }

      return Response.json({
        success: true,
        data: { userId, serverId: serverId || null, nickname },
      })
    }

    // Game lain — fallback ke generated name
    await new Promise((r) => setTimeout(r, 500))
    const nickname = `Player${userId.slice(-4).padStart(4, '0')}`
    return Response.json({
      success: true,
      data: { userId, serverId: serverId || null, nickname },
    })
  } catch (error) {
    console.error('Check player error:', error)
    return Response.json(
      { success: false, error: 'Gagal mengecek data pemain' },
      { status: 500 }
    )
  }
}
