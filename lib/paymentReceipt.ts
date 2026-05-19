'use client'

export type ReceiptStatus =
  | 'completed'
  | 'pending'
  | 'processing'
  | 'cancelled'
  | 'pending_payment'
  | 'failed'

export interface PaymentReceiptSnapshot {
  orderId: string
  orderCode: string
  date: string
  status: ReceiptStatus
  game: {
    name: string
    publisher: string
    image: string
  }
  item: {
    name: string
    price: number
    bonus?: string
  }
  playerId: string
  serverId?: string | null
  nickname?: string
  payment: {
    method: string
    total: number
    fee: number
  }
  xenditInvoiceUrl?: string | null
}

const PAYMENT_RECEIPT_STORAGE_KEY = 'gamehub_payment_receipts'
const PAYMENT_RECEIPT_LAST_KEY = 'gamehub_payment_receipt_last'
const PENDING_PAYMENT_REDIRECT_KEY = 'gamehub_pending_payment_redirect'
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || ''

export function normalizeReceiptImageSrc(value: unknown): string {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  if (trimmed.startsWith('/')) {
    return `${BACKEND_ORIGIN}${trimmed}`
  }

  return `${BACKEND_ORIGIN}/${trimmed.replace(/^\.?\//, '')}`
}

export function mapOrderStatus(value: unknown): ReceiptStatus {
  if (value === 'success') return 'completed'
  if (value === 'waiting_payment') return 'pending_payment'
  if (value === 'failed') return 'failed'
  if (
    value === 'completed' ||
    value === 'pending' ||
    value === 'processing' ||
    value === 'cancelled' ||
    value === 'pending_payment'
  ) {
    return value
  }

  return 'pending'
}

export function mapReceiptSnapshotFromOrder(item: any): PaymentReceiptSnapshot {
  return {
    orderId: String(item.id ?? item.orderId ?? item.order_id ?? item.invoice_number ?? ''),
    orderCode: item.invoice_number || item.orderCode || String(item.id || ''),
    date: item.createdAt || item.date || new Date().toISOString(),
    status: mapOrderStatus(item.status),
    game: {
      name: item.nama_games || item.game?.name || 'Game',
      publisher: item.game?.publisher || '',
      image: normalizeReceiptImageSrc(item.image_url || item.game?.image || ''),
    },
    item: {
      name: item.nama_produk || item.item?.name || 'Item',
      price: Number.parseInt(String(item.harga_produk ?? item.payment?.total ?? item.item?.price ?? 0), 10) || 0,
      bonus: item.item?.bonus || undefined,
    },
    playerId: item.id_player || item.playerId || '-',
    serverId: item.id_server || item.serverId || null,
    nickname: item.nickname || item.game?.nickname || '',
    payment: {
      method: item.payment?.method || 'Xendit',
      total: Number.parseInt(String(item.harga_produk ?? item.payment?.total ?? 0), 10) || 0,
      fee: Number.parseInt(String(item.payment?.fee ?? 0), 10) || 0,
    },
    xenditInvoiceUrl: item.xendit_invoice_url || item.xenditInvoiceUrl || null,
  }
}

function readReceiptMap(): Record<string, PaymentReceiptSnapshot> {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(PAYMENT_RECEIPT_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, PaymentReceiptSnapshot>
  } catch {
    return {}
  }
}

function writeReceiptMap(receipts: Record<string, PaymentReceiptSnapshot>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PAYMENT_RECEIPT_STORAGE_KEY, JSON.stringify(receipts))
}

export function saveReceiptSnapshot(snapshot: PaymentReceiptSnapshot) {
  const receipts = readReceiptMap()
  receipts[snapshot.orderCode] = snapshot
  writeReceiptMap(receipts)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PAYMENT_RECEIPT_LAST_KEY, snapshot.orderCode)
  }
}

export function getReceiptSnapshot(orderCode: string): PaymentReceiptSnapshot | null {
  if (!orderCode) return null
  const receipts = readReceiptMap()
  return receipts[orderCode] || null
}

export function getLatestReceiptSnapshot(): PaymentReceiptSnapshot | null {
  if (typeof window === 'undefined') return null

  const lastOrderCode = window.localStorage.getItem(PAYMENT_RECEIPT_LAST_KEY)
  if (!lastOrderCode) return null

  return getReceiptSnapshot(lastOrderCode)
}

export function savePendingPaymentRedirect(orderCode: string, orderId: string) {
  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(
    PENDING_PAYMENT_REDIRECT_KEY,
    JSON.stringify({
      orderCode,
      orderId,
      createdAt: Date.now(),
    }),
  )
}

export function getPendingPaymentRedirect():
  | { orderCode: string; orderId: string; createdAt: number }
  | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(PENDING_PAYMENT_REDIRECT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { orderCode?: string; orderId?: string; createdAt?: number }
    if (!parsed.orderCode || !parsed.orderId || !parsed.createdAt) return null

    return {
      orderCode: parsed.orderCode,
      orderId: parsed.orderId,
      createdAt: parsed.createdAt,
    }
  } catch {
    return null
  }
}

export function clearPendingPaymentRedirect() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(PENDING_PAYMENT_REDIRECT_KEY)
}
