// Client helpers for Razorpay Checkout. Falls back to a simulated payment when keys are absent.
import { hasRazorpay } from './config';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (e: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type PaymentResult =
  | { ok: true; paymentId: string; orderId?: string; simulated: boolean }
  | { ok: false; error: string; cancelled?: boolean };

export async function collectPayment(opts: {
  amount: number;
  description: string;
  customer: { name: string; email?: string; phone: string };
  notes?: Record<string, string>;
}): Promise<PaymentResult> {
  const orderRes = hasRazorpay
    ? await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: opts.amount, notes: opts.notes }),
      }).catch(() => null)
    : null;

  // No real keys (or server says 501) → simulated demo payment.
  if (!orderRes || orderRes.status === 501) {
    await new Promise((r) => setTimeout(r, 1100));
    return { ok: true, simulated: true, paymentId: `pay_demo_${Math.random().toString(36).slice(2, 10)}` };
  }
  const order = (await orderRes.json()) as { orderId?: string; keyId?: string; amount?: number; error?: string };
  if (!orderRes.ok || !order.orderId) return { ok: false, error: order.error || 'Could not start payment' };

  if (!(await loadCheckout()) || !window.Razorpay) {
    return { ok: false, error: 'Could not load Razorpay. Check your connection and try again.' };
  }

  return new Promise<PaymentResult>((resolve) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: 'INR',
      name: 'QueueBuddy',
      description: opts.description,
      prefill: { name: opts.customer.name, email: opts.customer.email, contact: opts.customer.phone.replace(/\s/g, '') },
      notes: opts.notes,
      theme: { color: '#FBBF24' },
      modal: { ondismiss: () => resolve({ ok: false, cancelled: true, error: 'Payment cancelled' }) },
      handler: async (res: RazorpayResponse) => {
        const verify = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: res.razorpay_order_id,
            paymentId: res.razorpay_payment_id,
            signature: res.razorpay_signature,
          }),
        }).catch(() => null);
        if (verify?.ok) resolve({ ok: true, simulated: false, paymentId: res.razorpay_payment_id, orderId: res.razorpay_order_id });
        else resolve({ ok: false, error: 'Payment could not be verified. You have not been charged twice — contact support.' });
      },
    });
    rzp.on('payment.failed', (e) => resolve({ ok: false, error: e.error?.description || 'Payment failed' }));
    rzp.open();
  });
}
