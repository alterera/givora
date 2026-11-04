import 'server-only'
import crypto from 'node:crypto'

const API_VERSION = '2023-08-01'

function base() {
  return process.env.CASHFREE_ENV?.trim().toLowerCase() === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-api-version': API_VERSION,
    'x-client-id': process.env.CASHFREE_APP_ID!.trim(),
    'x-client-secret': process.env.CASHFREE_SECRET_KEY!.trim(),
  }
}

export async function createCashfreeOrder(input: {
  orderId: string; amount: number; email: string; returnUrl: string; notifyUrl?: string
}) {
  const res = await fetch(`${base()}/orders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: crypto.createHash('sha256').update(input.email.toLowerCase()).digest('hex').slice(0, 32),
        customer_email: input.email,
        customer_phone: '9999999999', // Cashfree requires a phone; collect a real one later.
      },
      order_meta: { return_url: input.returnUrl, notify_url: input.notifyUrl },
      order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Cashfree order creation failed')
  return json as { payment_session_id: string; order_id: string }
}

/** Returns Cashfree's order status: PAID | ACTIVE | EXPIRED | ... plus the successful payment id if any. */
export async function getCashfreeOrder(orderId: string) {
  const res = await fetch(`${base()}/orders/${encodeURIComponent(orderId)}`, { headers: headers(), cache: 'no-store' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Cashfree order lookup failed')
  let paymentId: string | null = null
  if (json.order_status === 'PAID') {
    const p = await fetch(`${base()}/orders/${encodeURIComponent(orderId)}/payments`, { headers: headers(), cache: 'no-store' })
    const list = await p.json()
    const ok = Array.isArray(list) ? list.find((x) => x.payment_status === 'SUCCESS') : null
    paymentId = ok ? String(ok.cf_payment_id) : null
  }
  return { status: json.order_status as string, paymentId }
}

export function verifyWebhookSignature(rawBody: string, timestamp: string, signature: string) {
  const expected = crypto.createHmac('sha256', process.env.CASHFREE_SECRET_KEY!)
    .update(timestamp + rawBody).digest('base64')
  const a = Buffer.from(expected), b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
