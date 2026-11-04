import { verifyWebhookSignature } from '@/lib/cashfree'
import { syncOrder } from '@/lib/fulfil'

export async function POST(request: Request) {
  const raw = await request.text()
  const sig = request.headers.get('x-webhook-signature')
  const ts = request.headers.get('x-webhook-timestamp')
  if (!sig || !ts || !verifyWebhookSignature(raw, ts, sig)) {
    return new Response('invalid signature', { status: 401 })
  }
  const orderId = JSON.parse(raw)?.data?.order?.order_id
  if (typeof orderId === 'string') {
    // Re-fetch from Cashfree instead of trusting the payload; also releases stock on expiry.
    await syncOrder(orderId)
  }
  return new Response('ok')
}
