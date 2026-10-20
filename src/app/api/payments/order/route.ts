import { NextRequest, NextResponse } from 'next/server';
import { isRealRazorpayKey } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Creates a Razorpay order server-side so the amount can't be tampered with in the browser.
 * Returns 501 when Razorpay keys aren't configured — the client then falls back to demo checkout.
 */
export async function POST(req: NextRequest) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !isRealRazorpayKey(keyId, keySecret)) {
    return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 501 });
  }

  let body: { amount?: number; receipt?: string; notes?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < 1 || amount > 50_000) {
    return NextResponse.json({ error: 'Amount must be between ₹1 and ₹50,000' }, { status: 400 });
  }

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency: 'INR',
      receipt: (body.receipt || `qb_${Date.now()}`).slice(0, 40),
      notes: body.notes ?? {},
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data?.error?.description || 'Could not create order' }, { status: 502 });
  }
  return NextResponse.json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId });
}
