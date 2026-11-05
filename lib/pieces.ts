import 'server-only'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase-admin'

export type RawEvent = {
  id: number; kind: 'minted' | 'purchased' | 'gifted' | 'resold'
  from_ref: string | null; to_ref: string | null; price: number | null
  payload: string; prev_hash: string; hash: string
}

export type ProvenanceStep = {
  kind: RawEvent['kind']
  from: string | null
  to: string | null
  price: number | null
  at: string // ISO timestamp (from the signed payload)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type Person = { name: string; href?: string }

/** Public display name of a profile: @handle, or "Private collector" when hidden. */
export function publicName(p: { handle: string | null; hide_handle: boolean } | undefined | null) {
  if (!p || !p.handle) return 'A collector'
  return p.hide_handle ? 'Private collector' : `@${p.handle}`
}

async function resolveRefs(refs: (string | null)[]) {
  const ids = [...new Set(refs.filter((r): r is string => !!r && UUID.test(r)))]
  const map = new Map<string, string>()
  if (ids.length) {
    const { data } = await createAdminClient().from('profiles').select('id, handle, hide_handle').in('id', ids)
    for (const p of data ?? []) map.set(p.id, publicName(p))
  }
  return (ref: string | null): string | null => {
    if (!ref) return null
    if (UUID.test(ref)) return map.get(ref) ?? 'A collector'
    if (ref.startsWith('artist:')) return ref.slice(7)
    if (ref.startsWith('guest:')) return `@${ref.slice(6)}`
    return ref
  }
}

/** Recomputes the hash chain. Any edited, removed or reordered row breaks it. */
export function verifyChain(events: RawEvent[]) {
  let prev = ''
  for (const e of events) {
    if (e.prev_hash !== prev) return false
    const expected = crypto.createHash('sha256').update(`${prev}|${e.payload}`).digest('hex')
    if (e.hash !== expected) return false
    const [kind, from, to, price] = e.payload.split('|')
    const rowPrice = e.price == null ? '' : Number(e.price).toFixed(2)
    if (kind !== e.kind || from !== (e.from_ref ?? '') || to !== (e.to_ref ?? '') || price !== rowPrice) return false
    prev = e.hash
  }
  return true
}

export async function getProvenance(productId: string) {
  const { data } = await createAdminClient()
    .from('piece_events').select('id, kind, from_ref, to_ref, price, payload, prev_hash, hash')
    .eq('product_id', productId).order('id', { ascending: true })
  const events = (data ?? []) as RawEvent[]
  const resolve = await resolveRefs(events.flatMap((e) => [e.from_ref, e.to_ref]))
  const steps: ProvenanceStep[] = events.map((e) => ({
    kind: e.kind,
    from: resolve(e.from_ref),
    to: resolve(e.to_ref),
    price: e.price == null ? null : Number(e.price),
    at: e.payload.split('|')[4],
  }))
  const lastSale = [...steps].reverse().find((s) => s.price != null && s.kind !== 'minted')
  return { steps, valid: verifyChain(events), lastSalePrice: lastSale?.price ?? null }
}

export type PieceState = {
  ownerName: string | null
  ownerId: string | null
  awaitingClaim: boolean
  editionId: string | null
  frozen: boolean
}

/** Who owns the piece right now (editions is the single ownership record per piece). */
export async function getPieceState(productId: string): Promise<PieceState> {
  const db = createAdminClient()
  const { data: e } = await db.from('editions').select('id, owner_id, frozen').eq('product_id', productId).maybeSingle()
  if (!e) return { ownerName: null, ownerId: null, awaitingClaim: false, editionId: null, frozen: false }
  if (!e.owner_id && e.frozen) {
    // Archive pieces (imported history) have no account owner: show the last holder from the provenance chain.
    const { data: last } = await db.from('piece_events').select('to_ref').eq('product_id', productId).order('id', { ascending: false }).limit(1).maybeSingle()
    const ref = last?.to_ref ?? ''
    if (ref.startsWith('guest:')) return { ownerName: `@${ref.slice(6)}`, ownerId: null, awaitingClaim: false, editionId: e.id, frozen: true }
  }
  if (!e.owner_id) return { ownerName: null, ownerId: null, awaitingClaim: true, editionId: e.id, frozen: e.frozen }
  const { data: p } = await db.from('profiles').select('handle, hide_handle').eq('id', e.owner_id).maybeSingle()
  return { ownerName: publicName(p), ownerId: e.owner_id, awaitingClaim: false, editionId: e.id, frozen: e.frozen }
}

export type OpenListing = {
  id: string; price: number; kind: 'public' | 'private'; private_token: string | null
  status: 'active' | 'reserved'; seller_id: string; for_email: string | null; fee_bps: number; royalty_bps: number
}

export async function getOpenListing(productId: string) {
  const { data } = await createAdminClient()
    .from('listings').select('id, price, kind, private_token, status, seller_id, for_email, fee_bps, royalty_bps')
    .eq('product_id', productId).in('status', ['active', 'reserved']).maybeSingle()
  return (data as OpenListing | null) ?? null
}
