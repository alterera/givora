import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import type { Product } from '@/lib/products'

export async function getPublished(opts: { limit?: number; from?: number; excludeId?: string } = {}) {
  let q = createAdminClient().from('products').select('*', { count: 'exact' }).eq('status', 'published')
  if (opts.excludeId) q = q.neq('id', opts.excludeId)
  q = q.order('created_at', { ascending: false })
  if (opts.limit != null) { const from = opts.from ?? 0; q = q.range(from, from + opts.limit - 1) }
  const { data, count } = await q
  return { products: (data ?? []) as Product[], total: count ?? 0 }
}

/** Most recent sale price per product (later events overwrite earlier ones). */
export async function lastSales(ids: string[]) {
  const map = new Map<string, number>()
  if (!ids.length) return map
  const { data } = await createAdminClient().from('piece_events').select('product_id, price')
    .in('product_id', ids).not('price', 'is', null).order('id', { ascending: true })
  for (const e of data ?? []) map.set(e.product_id, Number(e.price))
  return map
}
