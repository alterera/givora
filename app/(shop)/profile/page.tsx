import Link from 'next/link'
import { Suspense } from 'react'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { viewerProps, type Product } from '@/lib/products'
import { cancelListingAction, setHandleVisibilityAction } from '@/lib/actions/resale'
import { fmtDate, inr } from '@/lib/format'
import OwnedPiece from '@/components/OwnedPiece'
import ListForSale from '@/components/ListForSale'
import CopyField from '@/components/CopyField'

type Listing = { id: string; product_id: string; price: number; kind: 'public' | 'private'; private_token: string | null; status: 'active' | 'reserved'; for_email: string | null }

async function Owned() {
  const user = await requireUser('/profile')
  const db = createAdminClient()
  const { data } = await db.from('editions')
    .select('id, edition_no, claimed_at, frozen, products(*)').eq('owner_id', user.id).order('claimed_at', { ascending: false })
  const items = (data ?? []) as unknown as { id: string; frozen: boolean; products: Product }[]
  const ids = items.map((i) => i.products.id)

  const [{ data: listingRows }, { data: ledger }, { data: me }, { data: events }] = await Promise.all([
    ids.length ? db.from('listings').select('id, product_id, price, kind, private_token, status, for_email').in('product_id', ids).in('status', ['active', 'reserved']) : Promise.resolve({ data: [] }),
    db.from('ledger_entries').select('amount, status, release_at').eq('user_id', user.id).eq('party', 'seller').in('status', ['held']),
    db.from('profiles').select('handle, hide_handle').eq('id', user.id).single(),
    ids.length ? db.from('piece_events').select('product_id, price').in('product_id', ids).not('price', 'is', null).order('id') : Promise.resolve({ data: [] }),
  ])
  const listings = new Map((listingRows as Listing[] | null ?? []).map((l) => [l.product_id, l]))
  const lastSale = new Map<string, number>()
  for (const e of events ?? []) lastSale.set(e.product_id, Number(e.price))
  const pending = (ledger ?? []).reduce((s, l) => s + Number(l.amount), 0)
  const nextRelease = (ledger ?? []).map((l) => l.release_at).sort()[0]
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">{user.email}</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">My collection</h1>
          {me?.handle && <p className="mono mt-2 text-xs text-[#8f8f8f]">Public name: {me.hide_handle ? 'Private collector' : `@${me.handle}`}</p>}
        </div>
        <span className="badge">{items.length} {items.length === 1 ? 'PIECE' : 'PIECES'}</span>
      </div>

      <div className="mb-10 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
        <form action={setHandleVisibilityAction} className="flex items-center justify-between gap-4 bg-black p-5">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="hide" defaultChecked={!!me?.hide_handle} className="size-4 accent-white" />
            <span>Appear as &ldquo;Private collector&rdquo; on certificates<span className="block text-xs text-[#6b6b6b]">Your handle is taken from your email.</span></span>
          </label>
          <button className="btn">Save</button>
        </form>
        <div className="bg-black p-5">
          <p className="eyebrow mb-1">Resale proceeds pending</p>
          <p className="text-2xl font-semibold tracking-tight">{inr(pending)}</p>
          <p className="mt-1 text-xs text-[#6b6b6b]">{nextRelease ? `Next release ${fmtDate(nextRelease)} · paid out by Givora after a 7-day cooling-off` : 'Proceeds from resales are held for 7 days, then paid out.'}</p>
        </div>
      </div>

      {!items.length ? (
        <div className="panel flex flex-col items-center gap-4 p-14 text-center">
          <p className="text-[#a1a1a1]">Your collection is empty.</p>
          <Link href="/#collection" className="btn btn-primary">Explore the collection</Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map(({ id, frozen, products: p }) => {
            const listing = listings.get(p.id)
            return (
              <article key={id} className="panel overflow-hidden">
                <OwnedPiece viewer={viewerProps(p, 60000, { owner: true })} serial={p.serial ?? p.slug} />
                <div className="flex items-center justify-between border-t border-[var(--line)] p-4">
                  <div>
                    <h3 className="font-medium">{p.title}</h3>
                    <p className="text-sm text-[#8f8f8f]">{p.artist_name}{lastSale.has(p.id) ? ` · last sale ${inr(lastSale.get(p.id)!)}` : ''}</p>
                  </div>
                  {p.serial && <Link href={`/certificate/${p.serial}`} className="badge link-underline">{p.serial} →</Link>}
                </div>
                <div className="border-t border-[var(--line)]">
                  {frozen ? (
                    <p className="p-4 text-sm text-[#a1a1a1]">This piece is on hold while we review it. Selling is paused.</p>
                  ) : listing ? (
                    <div className="flex flex-col gap-3 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">Listed {listing.kind === 'private' ? 'privately' : 'publicly'} for <span className="font-semibold">{inr(listing.price)}</span>{listing.status === 'reserved' && <span className="badge ml-2">SALE IN PROGRESS</span>}</p>
                        {listing.status === 'active' && (
                          <form action={cancelListingAction}><input type="hidden" name="listing_id" value={listing.id} /><button className="btn">Cancel listing</button></form>
                        )}
                      </div>
                      {listing.kind === 'private' && listing.private_token && (
                        <CopyField label={listing.for_email ? `Private link (only for ${listing.for_email})` : 'Private link (first buyer wins)'} value={`${site}/buy/${listing.private_token}`} />
                      )}
                    </div>
                  ) : (
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm hover:bg-[#080808]">
                        <span>Sell this piece</span><span className="mono text-[#6b6b6b] transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <ListForSale productId={p.id} royaltyBps={p.royalty_bps} lastSale={lastSale.get(p.id) ?? null} />
                    </details>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function ProfilePage() {
  return (
    <main className="container-x py-10 md:py-16">
      <Suspense fallback={<div className="panel particle-skeleton relative h-72" />}><Owned /></Suspense>
    </main>
  )
}
