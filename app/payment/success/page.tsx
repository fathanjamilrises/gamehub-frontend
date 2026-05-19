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

  return (
    <PaymentReceiptClient
      orderCode={readString(query.orderCode)}
      paymentStatus={readString(query.status)}
    />
  )
}
