// GET /api/digiflazz/test-sign — Cek saldo dengan kedua key untuk tahu mana sign yang benar
import { createHash } from 'crypto'

const USERNAME = process.env.DIGIFLAZZ_USERNAME ?? ''
const DEV_KEY = process.env.DIGIFLAZZ_DEV_KEY ?? ''
const PROD_KEY = process.env.DIGIFLAZZ_API_KEY ?? ''

async function cekSaldo(signKey: string, label: string) {
  const sign = createHash('md5').update(USERNAME + signKey + 'depo').digest('hex')
  const res = await fetch('https://api.digiflazz.com/v1/cek-saldo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: 'deposit', username: USERNAME, sign }),
  })
  const data = await res.json()
  return { label, sign, result: data }
}

export async function GET() {
  const [withDev, withProd] = await Promise.all([
    cekSaldo(DEV_KEY, 'dev_key'),
    cekSaldo(PROD_KEY, 'prod_key'),
  ])
  return Response.json({ withDev, withProd })
}
