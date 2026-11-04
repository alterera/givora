import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { viewerProps, type Product } from '@/lib/products'
import ProductViewer from '@/components/particle/ProductViewer'
import ProductCard from '@/components/ProductCard'

async function getProducts() {
  const { data } = await createAdminClient()
    .from('products').select('*').eq('status', 'published').order('created_at', { ascending: false })
  return (data ?? []) as Product[]
}

async function Hero() {
  const products = await getProducts()
  const featured = products[0]
  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--line)]">
      <div className="absolute inset-0 -z-10 grid-bg opacity-60" />
      {featured && (
        <div className="absolute inset-y-0 right-0 -z-10 w-full opacity-90 md:w-[62%]">
          <ProductViewer {...viewerProps(featured, 60000)} interactive className="h-full w-full" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent md:via-transparent" />
        </div>
      )}
      <div className="container-x pointer-events-none flex min-h-[78vh] flex-col justify-center gap-7 py-24">
        <span className="eyebrow reveal pointer-events-auto w-fit">Digital art · Limited editions</span>
        <h1 className="reveal d1 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tighter sm:text-6xl md:text-7xl">
          Art made of <span className="bg-gradient-to-b from-white to-[#777] bg-clip-text text-transparent">light.</span>
          <br />Owned by you.
        </h1>
        <p className="reveal d2 max-w-lg text-lg text-[#a1a1a1]">
          Givora World is a home for particle-cloud artworks. Every piece is a one-of-one original with its own certificate and provenance: buy it, keep it, resell it or give it as a gift.
        </p>
        <div className="reveal d3 pointer-events-auto flex flex-wrap gap-3">
          <Link href="#collection" className="btn btn-primary btn-lg">Explore the collection</Link>
          <Link href="#how" className="btn btn-lg">How it works</Link>
        </div>
        {featured && (
          <p className="reveal d4 mono text-xs text-[#6b6b6b]">Featured: {featured.title} · drag to rotate, scroll to zoom</p>
        )}
      </div>
    </section>
  )
}

async function lastSales(ids: string[]) {
  const map = new Map<string, number>()
  if (!ids.length) return map
  const { data } = await createAdminClient().from('piece_events').select('product_id, price')
    .in('product_id', ids).not('price', 'is', null).order('id', { ascending: true })
  for (const e of data ?? []) map.set(e.product_id, Number(e.price)) // later events overwrite earlier ones
  return map
}

async function Collection() {
  const products = await getProducts()
  const sales = await lastSales(products.map((p) => p.id))
  if (!products.length) {
    return <div className="panel p-10 text-center text-[#8f8f8f]">The first pieces are on their way. Check back soon.</div>
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} lastSale={sales.get(p.id) ?? null} />)}
    </div>
  )
}

const STEPS = [
  ['01', 'Choose a piece', 'Every artwork is a one-of-one original, rendered live as a cloud of particles.'],
  ['02', 'Pay securely', 'One item, one checkout. Pay with UPI, card or netbanking through Cashfree.'],
  ['03', 'Keep or gift', 'Claim it to your collection, or generate a link and send it to someone special.'],
]

const UNIQUE = [
  ['A serial and a seed', 'Each piece gets its own number and generative seed, so its particles and colours are visibly its own.'],
  ['A public certificate', 'A permanent page with the artist, mint date, fingerprint and current owner.'],
  ['A recorded history', 'Minted, purchased, gifted, resold: every step is dated and chained so it cannot be rewritten.'],
  ['Owner-only extras', 'Owners get a collector effect, high-resolution stills and loops, and their name on the artwork page.'],
]

const WHY_GIFT = [
  ['It cannot be duplicated', 'There is one copy. The person you give it to owns something nobody else in the world does.'],
  ['Your name travels with it', 'You are recorded in its provenance as the person who gave it, for as long as the piece exists.'],
  ['It carries a personal note', 'Write a message that is revealed when they unwrap the gift.'],
  ['It can grow in value', 'Pieces can be resold, and the last sale price is public, so a gift can have a story and a market.'],
  ['Instant, no shipping', 'Send a private link or an email. They claim it in a minute, from anywhere.'],
  ['Made to be shown', 'It lives as a rotating cloud of light they can show off, not an object in a drawer.'],
]

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[78vh] border-b border-[var(--line)]" />}><Hero /></Suspense>

      <section id="collection" className="container-x scroll-mt-20 py-20">
        <div className="mb-10">
          <p className="eyebrow mb-3">Collection</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Latest pieces</h2>
        </div>
        <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="panel particle-skeleton relative aspect-[4/5]" />)}</div>}>
          <Collection />
        </Suspense>
      </section>

      <section id="how" className="scroll-mt-20 border-y border-[var(--line)] bg-[#030303]">
        <div className="container-x py-20">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="mb-12 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">From checkout to collection in a minute.</h2>
          <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="bg-black p-8 transition-colors hover:bg-[#080808]">
                <span className="mono text-sm text-[#6b6b6b]">{n}</span>
                <h3 className="mt-6 text-xl font-medium tracking-tight">{t}</h3>
                <p className="mt-2 text-sm text-[#8f8f8f]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="unique" className="container-x py-20">
        <p className="eyebrow mb-3">One of one</p>
        <h2 className="mb-12 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">Every piece is a single, verifiable original.</h2>
        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {UNIQUE.map(([t, d]) => (
            <div key={t} className="bg-black p-6 transition-colors hover:bg-[#080808]">
              <h3 className="font-medium tracking-tight">{t}</h3>
              <p className="mt-2 text-sm text-[#8f8f8f]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="gifting" className="container-x scroll-mt-20 pb-24">
        <div className="relative isolate overflow-hidden border border-[var(--line)] p-8 md:p-14">
          <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
          <p className="eyebrow mb-3">Why people gift these</p>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">A gift no one else can give, and no one else can own.</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {WHY_GIFT.map(([t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="mt-2 size-1.5 shrink-0 bg-white" />
                <div><p className="font-medium">{t}</p><p className="mt-1 text-sm text-[#8f8f8f]">{d}</p></div>
              </li>
            ))}
          </ul>
          <Link href="#collection" className="btn btn-primary btn-lg mt-10">Choose a piece to gift</Link>
        </div>
      </section>
    </main>
  )
}
