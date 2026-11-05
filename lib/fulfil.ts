import 'server-only'
import { after } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { getCashfreeOrder } from '@/lib/cashfree'
import { sendGiftReceivedEmail, sendPurchaseEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

type OrderForEmail = {
  id: string; kind: 'primary' | 'resale'; amount: number; buyer_email: string; cashfree_order_id: string
  is_gift: boolean; gift_recipient_email: string | null; gift_sender_name: string | null
  gift_message: string | null; gift_occasion: string | null
  products: { title: string; serial: string | null } | { title: string; serial: string | null }[] | null
  editions: { claim_token: string } | { claim_token: string }[] | null
}
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v)

/**
 * Sends the purchase receipt (and, for gifts, the "you received a gift" mail) exactly once per paid order.
 * The order is claimed by stamping emailed_at; if sending fails the stamp is removed so the next sync retries.
 */
export async function sendOrderEmails(cfOrderId: string) {
  const db = createAdminClient()
  const { data } = await db.from('orders')
    .update({ emailed_at: new Date().toISOString() })
    .eq('cashfree_order_id', cfOrderId).eq('status', 'paid').is('emailed_at', null)
    .select('id, kind, amount, buyer_email, cashfree_order_id, is_gift, gift_recipient_email, gift_sender_name, gift_message, gift_occasion, products(title, serial), editions(claim_token)')
    .maybeSingle()
  if (!data) return // not paid yet, or already emailed
  const o = data as unknown as OrderForEmail
  const product = one(o.products)
  const token = one(o.editions)?.claim_token
  const claimLink = token ? `${SITE_URL}/redeem/${token}` : null

  const results = [
    await sendPurchaseEmail(o.buyer_email, {
      title: product?.title ?? 'Your piece', serial: product?.serial ?? null, amount: o.amount, orderId: o.cashfree_order_id,
      kind: o.kind, isGift: o.is_gift, giftRecipient: o.gift_recipient_email,
      shareLink: o.is_gift && !o.gift_recipient_email ? claimLink : null,
    }),
  ]
  if (o.kind === 'primary' && o.is_gift && o.gift_recipient_email && claimLink) {
    results.push(await sendGiftReceivedEmail(o.gift_recipient_email, claimLink, product?.title ?? 'a piece of art', {
      sender: o.gift_sender_name, message: o.gift_message, occasion: o.gift_occasion,
    }))
  }
  if (results.some((r) => !r.sent)) {
    // Allow a retry on the next webhook / return-page sync (duplicates of the successful one are acceptable).
    await db.from('orders').update({ emailed_at: null }).eq('id', o.id)
  }
}

/** Sync one order with Cashfree. Idempotent; used by the webhook and the return page. */
export async function syncOrder(cfOrderId: string) {
  const db = createAdminClient()
  const { data: order } = await db.from('orders').select('kind').eq('cashfree_order_id', cfOrderId).maybeSingle()
  if (!order) return 'UNKNOWN'
  const cf = await getCashfreeOrder(cfOrderId)
  if (cf.status === 'PAID') {
    if (order.kind === 'resale') await db.rpc('fulfill_resale', { p_cf_order: cfOrderId, p_payment_id: cf.paymentId ?? '' })
    else await db.rpc('fulfill_order', { p_cf_order: cfOrderId, p_payment_id: cf.paymentId ?? '' })
    revalidateTag('products', 'max') // sold state changed: refresh cached catalogue pages
    after(() => sendOrderEmails(cfOrderId).catch((e) => console.error('[email] order emails failed:', e))) // after the response is sent
  } else if (cf.status === 'EXPIRED' || cf.status === 'TERMINATED') {
    // release_order puts back stock (primary) or reopens the listing (resale).
    await db.rpc('release_order', { p_cf_order: cfOrderId, p_status: 'expired' })
    revalidateTag('products', 'max')
  }
  return cf.status
}
