import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { getCashfreeOrder } from '@/lib/cashfree'

/** Sync one order with Cashfree. Idempotent; used by the webhook and the return page. */
export async function syncOrder(cfOrderId: string) {
  const db = createAdminClient()
  const { data: order } = await db.from('orders').select('kind').eq('cashfree_order_id', cfOrderId).maybeSingle()
  if (!order) return 'UNKNOWN'
  const cf = await getCashfreeOrder(cfOrderId)
  if (cf.status === 'PAID') {
    if (order.kind === 'resale') await db.rpc('fulfill_resale', { p_cf_order: cfOrderId, p_payment_id: cf.paymentId ?? '' })
    else await db.rpc('fulfill_order', { p_cf_order: cfOrderId, p_payment_id: cf.paymentId ?? '' })
  } else if (cf.status === 'EXPIRED' || cf.status === 'TERMINATED') {
    // release_order puts back stock (primary) or reopens the listing (resale).
    await db.rpc('release_order', { p_cf_order: cfOrderId, p_status: 'expired' })
  }
  return cf.status
}
