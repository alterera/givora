import Link from 'next/link'
import { Suspense } from 'react'
import { viewerProps } from '@/lib/products'
import { getPublished, lastSales } from '@/lib/catalog'
import ProductViewer from '@/components/particle/ProductViewer'
import ProductCard from '@/components/ProductCard'
import HashBand from '@/components/HashBand'
import Reveal from '@/components/Reveal'
import ScrambleText from '@/components/ScrambleText'
import NewsletterCta from '@/components/NewsletterCta'

const HOME_COUNT = 8

async function Hero() {
  const { products } = await getPublished({ limit: 1 })
  const featured = products[0]
  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--line)]">
      <div className="absolute inset-0 -z-10 grid-bg opacity-60" />
      {featured && (
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full select-none opacity-90 md:w-[62%]">
          <ProductViewer {...viewerProps(featured, 60000)} className="h-full w-full" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent md:via-transparent" />
        </div>
      )}
      <div className="container-x pointer-events-none flex min-h-[78vh] flex-col justify-center gap-7 py-24">
        <span className="eyebrow reveal pointer-events-auto w-fit">Digital art · Limited editions</span>
        <h1 className="reveal d1 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tighter sm:text-6xl md:text-7xl">
          Art made of <span className="text-glow-green">light.</span>
          <br />Owned by <span className="text-glow-green">you.</span>
        </h1>
        <p className="reveal d2 max-w-lg text-lg text-[#a1a1a1]">
          Givora World is a home for particle-cloud artworks. Every piece is a one-of-one original with its own certificate and provenance: buy it, keep it, resell it or give it as a gift.
        </p>
        <div className="reveal d3 pointer-events-auto flex flex-wrap gap-3">
          <Link href="/collection" className="btn btn-primary btn-lg">Explore the collection</Link>
          <Link href="/how-it-works" className="btn btn-lg">How it works</Link>
        </div>
      </div>
    </section>
  )
}

async function Collection() {
  const { products, total } = await getPublished({ limit: HOME_COUNT })
  const sales = await lastSales(products.map((p) => p.id))
  if (!products.length) {
    return <div className="panel p-10 text-center text-[#8f8f8f]">The first pieces are on their way. Check back soon.</div>
  }
  return (
    <>
      <HashBand products={products} />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} lastSale={sales.get(p.id) ?? null} />)}
      </div>
      <div className="mt-10 flex justify-center">
        <Link href="/collection" className="btn btn-lg">View all{total > products.length ? ` ${total} pieces` : ''} →</Link>
      </div>
    </>
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

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[78vh] border-b border-[var(--line)]" />}><Hero /></Suspense>

      <section id="collection" className="container-x scroll-mt-20 py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Collection · signed &amp; encrypted</p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl"><ScrambleText text="Latest Drops" /></h2>
          </div>
          <Link href="/collection" className="btn btn-sm">View all →</Link>
        </div>
        <Suspense fallback={<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="panel particle-skeleton relative aspect-square" />)}</div>}>
          <Collection />
        </Suspense>
      </section>

      <section className="border-y border-[var(--line)] bg-[#030303]">
        <Reveal className="container-x py-20">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-3">How it works</p>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">From checkout to collection in a minute.</h2></div><Link href="/how-it-works" className="btn btn-sm">Learn more →</Link></div>
          <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="bg-black p-8 transition-colors hover:bg-[#080808]">
                <span className="mono text-sm text-[#6b6b6b]">{n}</span>
                <h3 className="mt-6 text-xl font-medium tracking-tight">{t}</h3>
                <p className="mt-2 text-sm text-[#8f8f8f]">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="unique" className="container-x py-20"><Reveal>
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
      </Reveal></section>

      <section id="updates" className="container-x scroll-mt-20 pb-24">
        <Reveal><NewsletterCta /></Reveal>
      </section>
    </main>
  )
}
