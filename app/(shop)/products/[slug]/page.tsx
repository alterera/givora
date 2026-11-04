import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { getUser } from '@/lib/auth'
import { viewerProps, type Product } from '@/lib/products'
import { getOpenListing, getPieceState, getProvenance } from '@/lib/pieces'
import { fmtDate, inr } from '@/lib/format'
import ProductViewer from '@/components/particle/ProductViewer'

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await createAdminClient().from('products').select('*').eq('slug', slug).eq('status', 'published').single()
  if (!data) notFound()
  const p = data as Product

  const [state, prov, listing, user] = await Promise.all([getPieceState(p.id), getProvenance(p.id), getOpenListing(p.id), getUser()])
  const isOwner = !!user && state.ownerId === user.id
  const available = p.stock > 0 && !state.editionId

  return (
    <main className="container-x grid gap-8 py-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:py-12">
      <div className="reveal lg:sticky lg:top-20 lg:self-start">
        <div className="relative aspect-square w-full border border-[var(--line)] lg:aspect-[5/6]">
          <ProductViewer {...viewerProps(p, undefined, { interactive: true, owner: isOwner })} className="absolute inset-0" />
          <span className="eyebrow pointer-events-none absolute bottom-3 left-3">Drag to rotate · Scroll to zoom</span>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:py-4">
        <div className="reveal d1">
          <Link href="/#collection" className="eyebrow link-underline">← Collection</Link>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="badge badge-live">1 OF 1</span>
            {p.serial && <Link href={`/certificate/${p.serial}`} className="badge link-underline">{p.serial} · CERTIFICATE →</Link>}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tighter md:text-5xl">{p.title}</h1>
          <p className="mt-2 text-[#a1a1a1]">by <span className="text-white">{p.artist_name || 'Unknown artist'}</span></p>
        </div>

        {p.description && <p className="reveal d2 whitespace-pre-line leading-relaxed text-[#b4b4b4]">{p.description}</p>}

        {state.ownerName && (
          <p className="reveal d2 text-sm text-[#a1a1a1]">
            Owned by <span className="text-white">{state.ownerName}</span>
            {isOwner && <span className="badge ml-2">YOU</span>}
          </p>
        )}

        <div className="reveal d3 panel p-5">
          {available ? (
            <>
              <div className="flex items-end justify-between">
                <div><p className="eyebrow mb-1">Price</p><p className="text-3xl font-semibold tracking-tight">{inr(p.price_inr)}</p></div>
                <span className="badge badge-live">AVAILABLE</span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link href={`/checkout/${p.slug}`} className="btn btn-primary btn-lg">Buy for myself</Link>
                <Link href={`/checkout/${p.slug}?gift=1`} className="btn btn-lg">Send as a gift</Link>
              </div>
              <p className="mt-3 text-center text-xs text-[#6b6b6b]">One copy exists. Digital, instant ownership, with a public certificate.</p>
            </>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <p className="eyebrow mb-1">{prov.lastSalePrice != null ? 'Last sale' : 'Status'}</p>
                  <p className="text-3xl font-semibold tracking-tight">{prov.lastSalePrice != null ? inr(prov.lastSalePrice) : 'Held'}</p>
                </div>
                <span className="badge">{state.editionId ? 'OWNED' : 'NOT AVAILABLE'}</span>
              </div>
              {listing && listing.kind === 'public' && listing.status === 'active' && !isOwner ? (
                <Link href={`/checkout/resale/${listing.id}`} className="btn btn-primary btn-lg mt-6 w-full">Buy from owner · {inr(listing.price)}</Link>
              ) : (
                <Link href={p.serial ? `/certificate/${p.serial}` : '/'} className="btn btn-lg mt-6 w-full">View certificate</Link>
              )}
            </>
          )}
        </div>

        <dl className="reveal d4 grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] text-sm">
          {[
            ['Minted', p.minted_at ? fmtDate(p.minted_at) : '-'],
            ['Serial', p.serial ?? '-'],
            ['Artist royalty', `${(p.royalty_bps / 100).toFixed(p.royalty_bps % 100 ? 1 : 0)}% on resale`],
            ['Provenance', `${prov.steps.length} recorded ${prov.steps.length === 1 ? 'step' : 'steps'}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-black p-4"><dt className="eyebrow mb-1">{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </div>
    </main>
  )
}

export default function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  return (
    <Suspense fallback={<main className="container-x py-12"><div className="panel particle-skeleton relative aspect-square max-w-2xl" /></main>}>
      <Detail params={params} />
    </Suspense>
  )
}
