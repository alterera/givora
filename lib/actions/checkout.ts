'use server'

import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase-admin'
import { createCashfreeOrder } from '@/lib/cashfree'

export type CheckoutState = { error?: string; paymentSessionId?: string } | undefined

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function startCheckout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const slug = String(form.get('slug') ?? '')
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const isGift = form.get('gift') === 'on'
  const recipient = String(form.get('recipient') ?? '').trim().toLowerCase()
  if (!EMAIL.test(email)) return { error: 'Enter a valid email.' }
  if (isGift && recipient && !EMAIL.test(recipient)) return { error: 'Recipient email is invalid.' }

  const db = createAdminClient()
  await db.rpc('expire_stale_orders')
  const { data: product } = await db.from('products').select('id, price_inr').eq('slug', slug).eq('status', 'published').single()
  if (!product) return { error: 'Product not found.' }

  const { data: reserved } = await db.rpc('reserve_stock', { p_product: product.id })
  if (!reserved) return { error: 'Sorry, this edition is sold out.' }

  const cfOrderId = `GIV_${crypto.randomBytes(8).toString('hex')}`
  const { error: insertError } = await db.from('orders').insert({
    product_id: product.id, buyer_email: email, amount: product.price_inr,
    cashfree_order_id: cfOrderId, is_gift: isGift, gift_recipient_email: isGift && recipient ? recipient : null,
  })
  if (insertError) return { error: 'Could not create the order.' }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  try {
    const cf = await createCashfreeOrder({
      orderId: cfOrderId, amount: Number(product.price_inr), email,
      returnUrl: `${site}/checkout/return?order_id={order_id}`,
      notifyUrl: site.startsWith('https://') ? `${site}/api/webhooks/cashfree` : undefined,
    })
    return { paymentSessionId: cf.payment_session_id }
  } catch (e) {
    await db.rpc('release_order', { p_cf_order: cfOrderId, p_status: 'failed' })
    return { error: e instanceof Error ? e.message : 'Payment could not be started.' }
  }
}
