import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { viewerProps, type Product } from '@/lib/products'
import { getOpenListing, getPieceState, getProvenance } from '@/lib/pieces'
import { fmtDate, inr } from '@/lib/format'
import ProductViewer from '@/components/particle/ProductViewer'
import ProductCard from '@/components/ProductCard'
import Reveal from '@/components/Reveal'
import LiveViewers from '@/components/LiveViewers'
import { getProductBySlug, getPublished, lastSales } from '@/lib/catalog'
import { SITE_NAME, SITE_URL } from '@/lib/site'

async function Similar({ product }: { product: Product }) {
  const { products } = await getPublished({ excludeId: product.id, limit: 12 })
  // Same artist first, then the newest of the rest.
  const picks = [...products.filter((p) => p.artist_name && p.artist_name === product.artist_name), ...products.filter((p) => !p.artist_name || p.artist_name !== product.artist_name)].slice(0, 4)
  if (!picks.length) return null
  const sales = await lastSales(picks.map((p) => p.id))
  return (
    <section className="container-x pb-20 pt-4">
      <Reveal>
        <div className="mb-6 flex items-end justify-between gap-4 border-t border-[var(--line)] pt-10">
          <div><p className="eyebrow mb-2">Keep exploring</p><h2 className="text-2xl font-semibold tracking-tight">Similar pieces</h2></div>
          <Link href="/collection" className="btn btn-sm">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {picks.map((p, i) => <ProductCard key={p.id} product={p} index={i} lastSale={sales.get(p.id) ?? null} />)}
        </div>
      </Reveal>
    </section>
  )
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await getProductBySlug(slug) // cached + shared with generateMetadata
  if (!p) notFound()

  const [state, prov, listing, user] = await Promise.all([getPieceState(p.id), getProvenance(p.id), getOpenListing(p.id), getUser()])
  const isOwner = !!user && state.ownerId === user.id
  const available = p.stock > 0 && !state.editionId
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.description?.trim() || `${p.title}, a one-of-one digital particle artwork on ${SITE_NAME}.`,
    sku: p.serial ?? p.slug,
    image: `${SITE_URL}/og/${p.slug}`,
    url: `${SITE_URL}/products/${p.slug}`,
    brand: { '@type': 'Brand', name: SITE_NAME },
    ...(p.artist_name ? { creator: { '@type': 'Person', name: p.artist_name } } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${p.slug}`,
      priceCurrency: 'INR',
      price: Number(p.price_inr).toFixed(2),
      availability: available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      itemCondition: 'https://schema.org/NewCondition',
    },
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, String.fromCharCode(92) + 'u003c') }} />
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:py-10">
      <div className="reveal mx-auto flex w-full max-w-xl flex-col gap-3 lg:sticky lg:top-20 lg:mx-0 lg:max-w-none lg:self-start">
        <LiveViewers seed={p.slug} />
        <div className="relative aspect-square w-full border border-[var(--line)] lg:aspect-[6/7]">
          <ProductViewer {...viewerProps(p, undefined, { interactive: true, owner: isOwner })} className="absolute inset-0" />
          <span className="eyebrow pointer-events-none absolute bottom-3 left-3">Drag to rotate · Pinch to zoom</span>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:py-4">
        <div className="reveal d1">
          <div className="flex flex-wrap items-center gap-3">
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
    </div>
    <Suspense fallback={null}><Similar product={p} /></Suspense>
    </main>
  )
}

function ProductSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading piece">
      <div className="container-x grid gap-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:py-10">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 lg:mx-0 lg:max-w-none">
          <div className="skel h-12" />
          <div className="relative aspect-square w-full overflow-hidden border border-[#0f2a1e] lg:aspect-[6/7]">
            <div className="particle-skeleton" />
            <span className="mono absolute bottom-3 left-3 text-[10px] uppercase tracking-[.2em] text-[#4f8f72]">Decrypting piece…</span>
          </div>
        </div>
        <div className="flex flex-col gap-7 lg:py-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2"><div className="skel h-6 w-16" /><div className="skel h-6 w-36" /></div>
            <div className="skel h-12 w-4/5" />
            <div className="skel h-4 w-2/5" />
          </div>
          <div className="flex flex-col gap-2"><div className="skel h-3 w-full" /><div className="skel h-3 w-[92%]" /><div className="skel h-3 w-[70%]" /></div>
          <div className="skel h-44 w-full" />
          <div className="grid grid-cols-2 gap-px">{[0, 1, 2, 3].map((i) => <div key={i} className="skel h-16" />)}</div>
        </div>
      </div>
    </main>
  )
}

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) return { title: 'Piece not found', robots: { index: false, follow: false } }
  const title = `${p.title} by ${p.artist_name || 'Unknown artist'}`
  const description = p.description?.trim().replace(/\s+/g, ' ').slice(0, 155)
    || `${p.title}, a one-of-one digital particle artwork${p.serial ? ` (${p.serial})` : ''} on ${SITE_NAME}. Collect it, gift it or resell it.`
  const image = { url: `/og/${p.slug}`, width: 1200, height: 630, alt: title }
  return {
    title,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { type: 'website', title, description, url: `/products/${p.slug}`, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}

export default function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Detail params={params} />
    </Suspense>
  )
}
