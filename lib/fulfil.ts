import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { getCashfreeOrder } from '@/lib/cashfree'

/** Sync one order with Cashfree. Idempotent; used by the webhook and the return page. */
export async function syncOrder(cfOrderId: string) {
  const db = createAdminClient()
  const cf = await getCashfreeOrder(cfOrderId)
  if (cf.status === 'PAID') {
    await db.rpc('fulfill_order', { p_cf_order: cfOrderId, p_payment_id: cf.paymentId ?? '' })
  } else if (cf.status === 'EXPIRED' || cf.status === 'TERMINATED') {
    await db.rpc('release_order', { p_cf_order: cfOrderId, p_status: 'expired' })
  }
  return cf.status
}
