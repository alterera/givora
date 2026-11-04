'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { sendGiftEmail } from '@/lib/email'

/** Emails the redeem link; only for an unclaimed gift whose token the caller knows. */
export async function emailGiftAction(token: string, to: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { ok: false, message: 'Invalid email.' }
  const { data } = await createAdminClient()
    .from('editions')
    .select('owner_id, products(title), orders(gift_sender_name, gift_message)')
    .eq('claim_token', token).single()
  if (!data || data.owner_id) return { ok: false, message: 'Gift unavailable.' }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const product = data.products as unknown as { title: string }
  const order = data.orders as unknown as { gift_sender_name: string | null; gift_message: string | null } | null
  const { sent } = await sendGiftEmail(to, `${site}/redeem/${token}`, product.title, {
    sender: order?.gift_sender_name, message: order?.gift_message,
  })
  return { ok: sent, message: sent ? 'Sent!' : 'Email is not configured; copy the link instead.' }
}
