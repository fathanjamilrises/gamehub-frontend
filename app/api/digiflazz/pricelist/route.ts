// GET /api/digiflazz/pricelist?brand=Mobile+Legends
// Ambil daftar harga dari Digiflazz untuk cek SKU asli

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'

const DIGIFLAZZ_USERNAME = process.env.DIGIFLAZZ_USERNAME ?? 'username'
// Digiflazz selalu pakai DEV KEY untuk signature
const DIGIFLAZZ_DEV_KEY = process.env.DIGIFLAZZ_DEV_KEY!

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand') ?? ''
  const category = searchParams.get('category') ?? ''

  const sign = createHash('md5')
    .update(DIGIFLAZZ_USERNAME + DIGIFLAZZ_DEV_KEY + 'pricelist')
    .digest('hex')

  const payload: Record<string, string> = {
    cmd: 'prepaid',
    username: DIGIFLAZZ_USERNAME,
    sign,
  }
  if (brand) payload.brand = brand
  if (category) payload.category = category

  const res = await fetch('https://api.digiflazz.com/v1/price-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  return Response.json(data)
}
