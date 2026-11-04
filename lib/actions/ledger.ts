'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

/** Manual payout bookkeeping until seller payouts are automated. Only releasable (past cooling-off) entries can be paid. */
export async function markLedgerPaid(form: FormData) {
  await requireAdmin()
  const id = String(form.get('id') ?? '')
  const db = createAdminClient()
  const { data } = await db.from('ledger_entries').select('release_at, status').eq('id', id).single()
  // Guard on the server: never pay inside the cooling-off window.
  if (!data || data.status !== 'held' || new Date(data.release_at).getTime() > Date.now()) return
  await db.from('ledger_entries').update({ status: 'paid' }).eq('id', id)
  revalidatePath('/admin/ledger')
}

/** Void an entry, e.g. the payment was refunded or disputed during the hold. */
export async function voidLedger(form: FormData) {
  await requireAdmin()
  await createAdminClient().from('ledger_entries').update({ status: 'void' }).eq('id', String(form.get('id') ?? '')).eq('status', 'held')
  revalidatePath('/admin/ledger')
}

/** Freeze or unfreeze a piece: frozen pieces cannot be listed, bought or claimed. */
export async function setFrozen(form: FormData) {
  await requireAdmin()
  const db = createAdminClient()
  const id = String(form.get('edition_id') ?? '')
  const frozen = form.get('frozen') === '1'
  await db.from('editions').update({ frozen }).eq('id', id)
  if (frozen) {
    // Withdraw any open listing so nobody can buy while it is under review.
    const { data: e } = await db.from('editions').select('product_id').eq('id', id).single()
    if (e) await db.from('listings').update({ status: 'cancelled' }).eq('product_id', e.product_id).eq('status', 'active')
  }
  revalidatePath('/admin/ledger')
}
