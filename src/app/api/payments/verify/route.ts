import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { isRealRazorpayKey } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Verifies the checkout signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || !isRealRazorpayKey(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, keySecret)) {
    return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 501 });
  }

  const { orderId, paymentId, signature } = (await req.json().catch(() => ({}))) as {
    orderId?: string;
    paymentId?: string;
    signature?: string;
  };
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
  }

  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const valid =
    expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  return valid
    ? NextResponse.json({ verified: true })
    : NextResponse.json({ verified: false, error: 'Signature mismatch' }, { status: 400 });
}
