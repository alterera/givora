'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { createCashfreeOrder } from '@/lib/cashfree'

export type ResaleState = { error?: string; ok?: string; paymentSessionId?: string } | undefined

export async function listPieceAction(_: ResaleState, form: FormData): Promise<ResaleState> {
  const user = await requireUser('/profile')
  const price = Number(form.get('price'))
  const kind = form.get('kind') === 'private' ? 'private' : 'public'
  const forEmail = String(form.get('for_email') ?? '').trim()
  if (!(price > 0) || price > 10_000_000) return { error: 'Enter a price above zero.' }
  if (forEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forEmail)) return { error: 'That email does not look right.' }

  const { error } = await createAdminClient().rpc('create_listing', {
    p_user: user.id, p_product: String(form.get('product_id') ?? ''), p_price: price, p_kind: kind, p_for_email: kind === 'private' ? forEmail : null,
  })
  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { ok: 'Listed.' }
}

export async function cancelListingAction(form: FormData) {
  const user = await requireUser('/profile')
  await createAdminClient().rpc('cancel_listing', { p_user: user.id, p_listing: String(form.get('listing_id') ?? '') })
  revalidatePath('/profile')
}

export async function setHandleVisibilityAction(form: FormData) {
  const user = await requireUser('/profile')
  await createAdminClient().from('profiles').update({ hide_handle: form.get('hide') === 'on' }).eq('id', user.id)
  revalidatePath('/', 'layout')
}

/** Starts a Cashfree order for a resale. The buyer must be logged in; ownership moves straight to their account. */
export async function startResaleCheckout(_: ResaleState, form: FormData): Promise<ResaleState> {
  const user = await requireUser('/market')
  const listingId = String(form.get('listing_id') ?? '')
  const db = createAdminClient()
  await db.rpc('expire_stale_orders')

  const { data: listing } = await db.from('listings').select('id, product_id, price').eq('id', listingId).single()
  if (!listing) return { error: 'This listing is no longer available.' }
  const { data: reserved } = await db.rpc('reserve_listing', { p_listing: listing.id, p_buyer: user.id })
  if (!reserved) return { error: 'This piece is no longer available to you (sold, withdrawn, reserved for someone else, or your own).' }

  const cfOrderId = `GIV_${crypto.randomBytes(8).toString('hex')}`
  const { error: insertError } = await db.from('orders').insert({
    product_id: listing.product_id, buyer_email: user.email, amount: listing.price, cashfree_order_id: cfOrderId,
    kind: 'resale', listing_id: listing.id, buyer_user_id: user.id,
  })
  if (insertError) {
    await db.from('listings').update({ status: 'active' }).eq('id', listing.id).eq('status', 'reserved')
    return { error: 'Could not create the order.' }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  try {
    const cf = await createCashfreeOrder({
      orderId: cfOrderId, amount: Number(listing.price), email: user.email!,
      returnUrl: `${site}/checkout/return?order_id={order_id}`,
      notifyUrl: site.startsWith('https://') ? `${site}/api/webhooks/cashfree` : undefined,
    })
    return { paymentSessionId: cf.payment_session_id }
  } catch (e) {
    await db.rpc('release_order', { p_cf_order: cfOrderId, p_status: 'failed' })
    return { error: e instanceof Error ? e.message : 'Payment could not be started.' }
  }
}
