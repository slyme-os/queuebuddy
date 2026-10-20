import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || secret.startsWith('your_') || secret.includes('webhook_secret_here')) {
    // Never accept unsigned events: refuse until a real secret is configured.
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!safeEqual(expected, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let payload: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: Record<string, string> } } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
  }

  const event = payload.event;
  if (event === 'payment.captured') {
    const payment = payload.payload?.payment?.entity;
    // Hook point: mark the booking as paid in Supabase using the service-role key.
    return NextResponse.json({
      status: 'success',
      event,
      paymentId: payment?.id,
      orderId: payment?.order_id,
      bookingId: payment?.notes?.booking_id,
    });
  }

  return NextResponse.json({ status: 'ignored', event });
}
