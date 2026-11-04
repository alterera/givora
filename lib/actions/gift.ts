'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { sendGiftEmail } from '@/lib/email'

/** Emails the redeem link; only for an unclaimed edition whose token the caller knows. */
export async function emailGiftAction(token: string, to: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { ok: false, message: 'Invalid email.' }
  const { data } = await createAdminClient()
    .from('editions').select('owner_id, products(title)').eq('claim_token', token).single()
  if (!data || data.owner_id) return { ok: false, message: 'Gift unavailable.' }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const product = data.products as unknown as { title: string }
  const { sent } = await sendGiftEmail(to, `${site}/redeem/${token}`, product.title)
  return { ok: sent, message: sent ? 'Sent!' : 'Email is not configured; copy the link instead.' }
}
