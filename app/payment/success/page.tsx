import PaymentReceiptClient from './PaymentReceiptClient'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function readString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const query = await searchParams

  // Xendit redirect via backend sends external_id (INV-...) instead of orderCode
  const orderCode = readString(query.orderCode) || readString(query.external_id) || readString(query.id)
  // Xendit only redirects to success URL on successful payment, so treat external_id presence as success
  const rawStatus = readString(query.status)
  const hasExternalId = Boolean(readString(query.external_id))
  const paymentStatus = (rawStatus === 'PAID' || rawStatus === 'SETTLED' || rawStatus === 'success' || hasExternalId)
    ? 'success'
    : rawStatus

  return (
    <PaymentReceiptClient
      orderCode={orderCode}
      paymentStatus={paymentStatus}
    />
  )
}
