import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import type { Product } from '@/lib/products'

// Catalogue reads are shared by every visitor, so they are cached (see the `use cache` docs) and
// invalidated on demand with the 'products' tag when a product is saved or an order settles.
const LIFE = { stale: 30, revalidate: 60, expire: 3600 }

async function queryPublished(limit: number | null, from: number, excludeId: string | null) {
  'use cache'
  cacheLife(LIFE)
  cacheTag('products')
  let q = createAdminClient().from('products').select('*', { count: 'exact' }).eq('status', 'published')
  if (excludeId) q = q.neq('id', excludeId)
  q = q.order('created_at', { ascending: false })
  if (limit != null) q = q.range(from, from + limit - 1)
  const { data, error, count } = await q
  if (error) {
    console.error('[catalog] products query failed:', error.message)
    cacheLife('seconds') // never keep a failed read around
  }
  return { products: (data ?? []) as Product[], total: count ?? 0 }
}

export function getPublished(opts: { limit?: number; from?: number; excludeId?: string } = {}) {
  return queryPublished(opts.limit ?? null, opts.from ?? 0, opts.excludeId ?? null)
}

/** Most recent sale price per product (later events overwrite earlier ones). */
export async function lastSales(ids: string[]) {
  const rows = await querySales([...ids].sort())
  return new Map<string, number>(rows)
}

async function querySales(ids: string[]): Promise<[string, number][]> {
  'use cache'
  cacheLife(LIFE)
  cacheTag('products')
  if (!ids.length) return []
  const { data, error } = await createAdminClient().from('piece_events').select('product_id, price')
    .in('product_id', ids).not('price', 'is', null).order('id', { ascending: true })
  if (error) cacheLife('seconds')
  const map = new Map<string, number>()
  for (const e of data ?? []) map.set(e.product_id, Number(e.price))
  return [...map]
}

export async function getProductBySlug(slug: string) {
  'use cache'
  cacheLife(LIFE)
  cacheTag('products', `product:${slug}`)
  const { data, error } = await createAdminClient().from('products').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error) cacheLife('seconds')
  return (data as Product | null) ?? null
}

export async function getProductBySerial(serial: string) {
  'use cache'
  cacheLife(LIFE)
  cacheTag('products')
  const { data, error } = await createAdminClient().from('products').select('*').eq('serial', serial.toUpperCase()).eq('status', 'published').maybeSingle()
  if (error) cacheLife('seconds')
  return (data as Product | null) ?? null
}
