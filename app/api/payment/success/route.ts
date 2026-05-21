import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const external_id = searchParams.get('external_id');
  const xendit_id = searchParams.get('id'); // Xendit invoice ID
  const status = searchParams.get('status');

  // ═══════════════════════════════════════════
  // Pesanan Akun (external_id = AKN-{orderId})
  // ═══════════════════════════════════════════
  if (external_id && external_id.startsWith('AKN-')) {
    const match = external_id.match(/^AKN-(\d+)/);
    const orderId = match ? match[1] : '';

    // Panggil backend untuk sync status pembayaran dari Xendit
    try {
      await fetch(`${BACKEND_URL}/api/akun-orders/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ external_id, xendit_id, order_id: orderId }),
      });
    } catch (e) {
      console.error('[PaymentSuccess] Verify payment error:', e);
    }

    return NextResponse.redirect(new URL(`/payment/success/akun?id=${orderId}`, request.url));
  }

  // ═══════════════════════════════════════════
  // Pesanan Top-Up / Voucher (external_id = INV-...)
  // ═══════════════════════════════════════════
  const redirectUrl = new URL('/payment/success', request.url);
  if (external_id) {
    redirectUrl.searchParams.set('orderCode', external_id);
    redirectUrl.searchParams.set('external_id', external_id);
  }
  if (xendit_id) {
    redirectUrl.searchParams.set('id', xendit_id);
  }
  if (status) {
    redirectUrl.searchParams.set('status', status === 'PAID' || status === 'SETTLED' ? 'success' : status);
  }

  return NextResponse.redirect(redirectUrl);
}
