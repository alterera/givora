'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export type SubscribeState = { ok?: boolean; message?: string } | undefined

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function subscribe(_: SubscribeState, form: FormData): Promise<SubscribeState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 120) return { ok: false, message: 'Enter a valid email address.' }
  const { error } = await createAdminClient().from('subscribers').upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) return { ok: false, message: 'Could not subscribe right now. Please try again.' }
  return { ok: true, message: "You're on the list. We'll write when something worth seeing happens." }
}
