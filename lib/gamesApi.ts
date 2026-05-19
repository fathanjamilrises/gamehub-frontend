import { getToken } from '@/lib/authApi'
import { getAllGames as getDummyGames, getGameBySlug as getDummyGameBySlug } from '@/lib/dummy/games'
import { GameDetail, GameListItem, NominalItem } from '@/lib/types'

const API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || ''
    : ''

const GAMES_URL = typeof window === 'undefined' ? `${API_BASE}/api/games` : '/api-proxy/games'

function normalizeTextField(value: any, fallback = '-'): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (value && typeof value === 'object') {
    return (
      value.nama_publisher ??
      value.name ??
      value.title ??
      value.label ??
      value.nama ??
      fallback
    )
  }
  return fallback
}

function resolveToFullUrl(src: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('//')) return src
  const base = process.env.NEXT_PUBLIC_API_URL || ''
  return base + (src.startsWith('/') ? src : '/' + src)
}

function normalizeImageField(value: any): string {
  let raw = ''
  if (typeof value === 'string') {
    raw = value
  } else if (value && typeof value === 'object') {
    raw = value.url ?? value.src ?? value.logo_publisher ?? value.logo ?? value.image ?? ''
  }
  return resolveToFullUrl(raw)
}

function normalizeSlugField(game: any, index: number): string {
  return String(game?.slug ?? game?.slug_games ?? game?.code ?? game?.kode_game ?? game?.id ?? `game-${index}`)
}

function normalizeNominal(item: any, index: number): NominalItem {
  const amount = Number(item?.amount ?? item?.value ?? item?.nominal ?? item?.quantity ?? 0)
  const price = Number(item?.price ?? item?.basePrice ?? item?.sellingPrice ?? 0)

  return {
    id: String(item?.id ?? item?._id ?? `nominal-${index}`),
    label: item?.label ?? item?.name ?? `${amount || price}`,
    amount,
    price,
    bonus: item?.bonus ?? item?.bonusLabel ?? undefined,
  }
}

function normalizeGameListItem(game: any, index: number): GameListItem {
  return {
    id: String(game?.id ?? game?._id ?? `game-${index}`),
    slug: normalizeSlugField(game, index),
    name: normalizeTextField(game?.name ?? game?.title ?? game?.nama_games, 'Unknown Game'),
    publisher: normalizeTextField(game?.publisher ?? game?.developer, '-'),
    category: normalizeTextField(game?.category ?? game?.type ?? game?.kategori, '-'),
    badge: normalizeTextField(game?.badge ?? game?.statusLabel, 'Instant'),
    image_url: normalizeImageField(
      game?.image_url ?? game?.imageUrl ?? game?.thumbnail ?? game?.image ?? game?.gambar_games,
    ),
  }
}

function normalizeGameDetail(game: any, index: number): GameDetail {
  const base = normalizeGameListItem(game, index)
  const nominalsSource = game?.nominals ?? game?.services ?? game?.items ?? []

  return {
    ...base,
    nominals: Array.isArray(nominalsSource)
      ? nominalsSource.map((item: any, nominalIndex: number) => normalizeNominal(item, nominalIndex))
      : [],
  }
}

async function fetchGamesEndpoint(path = '') {
  const headers = new Headers({ Accept: 'application/json' })
  const token = typeof window !== 'undefined' ? getToken() : null

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${GAMES_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Games API error: ${response.status}`)
  }

  return response.json()
}

export async function getGames(): Promise<GameListItem[]> {
  try {
    const data = await fetchGamesEndpoint()
    const payload = data?.data ?? data
    const games = Array.isArray(payload) ? payload : payload?.games

    if (!Array.isArray(games)) {
      throw new Error('Invalid games payload')
    }

    return games.map((game, index) => normalizeGameListItem(game, index))
  } catch {
    return getDummyGames()
  }
}

export async function getGameDetailBySlug(slug: string): Promise<GameDetail | null> {
  try {
    const data = await fetchGamesEndpoint(`/${slug}`)
    const payload = data?.data ?? data
    const game = payload?.game ?? payload

    if (!game) {
      return getDummyGameBySlug(slug)
    }

    return normalizeGameDetail(game, 0)
  } catch {
    return getDummyGameBySlug(slug)
  }
}

export async function getVouchers() {
  try {
    const VOUCHERS_URL = typeof window === 'undefined' ? `${API_BASE}/api/vouchers` : '/api-proxy/vouchers'
    const headers = new Headers({ Accept: 'application/json' })
    const response = await fetch(VOUCHERS_URL, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Vouchers API error: ${response.status}`)
    const data = await response.json()
    const payload = data?.data ?? data
    const vouchers = Array.isArray(payload) ? payload : payload?.vouchers
    if (!Array.isArray(vouchers)) return []
    return vouchers.map((v: any, i: number) => ({
      id: String(v.id ?? `voucher-${i}`),
      name: v.nama_voucher ?? 'Unknown Voucher',
      slug: v.slug_voucher ?? `voucher-${i}`,
      image: resolveToFullUrl(v.gambar_voucher ?? ''),
      deskripsi: v.deskripsi ?? ''
    }))
  } catch {
    return []
  }
}

export async function getVoucherBySlug(slug: string) {
  try {
    const VOUCHERS_URL = typeof window === 'undefined' ? `${API_BASE}/api/vouchers` : '/api-proxy/vouchers'
    const headers = new Headers({ Accept: 'application/json' })
    const response = await fetch(`${VOUCHERS_URL}/${slug}?include=produks`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Vouchers API error: ${response.status}`)
    const data = await response.json()
    const payload = data?.data ?? data
    const v = payload?.voucher ?? payload
    
    if (!v) return null
    
    let produks = Array.isArray(v.produks || v.services || v.nominals || v.items) 
      ? (v.produks || v.services || v.nominals || v.items)
      : []

    // Fallback: try fetching from games endpoint if empty
    if (produks.length === 0) {
      try {
        const GAMES_URL = typeof window === 'undefined' ? `${API_BASE}/api/games` : '/api-proxy/games'
        const gRes = await fetch(`${GAMES_URL}/${slug}`, { headers })
        if (gRes.ok) {
          const gData = await gRes.json()
          const g = gData?.data?.game || gData?.data || gData
          produks = g.produks || g.services || g.nominals || g.items || []
        }
      } catch {}
    }
    
    return {
      id: String(v.id ?? 'voucher-0'),
      name: v.nama_voucher ?? 'Unknown Voucher',
      slug: v.slug_voucher ?? slug,
      image: resolveToFullUrl(v.gambar_voucher ?? ''),
      deskripsi: v.deskripsi ?? '',
      produks: produks.map((p: any) => ({
        id: String(p.id || p.code || p.id_produk),
        name: p.nama_produk || p.name || p.label || 'Unknown',
        price: Number(p.harga || p.price || p.harga_produk || 0),
        kode: p.kode_produk || p.code || p.id_produk || ''
      }))
    }
  } catch {
    return null
  }
}
