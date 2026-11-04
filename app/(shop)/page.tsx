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
          Givora World is a home for particle-cloud artworks. Each piece is a numbered edition: buy it, keep it in your collection, or send it to someone as a gift.
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

async function Collection() {
  const products = await getProducts()
  if (!products.length) {
    return <div className="panel p-10 text-center text-[#8f8f8f]">The first pieces are on their way. Check back soon.</div>
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  )
}

const STEPS = [
  ['01', 'Choose a piece', 'Every artwork is a limited edition, rendered live as a cloud of particles.'],
  ['02', 'Pay securely', 'One item, one checkout. Pay with UPI, card or netbanking through Cashfree.'],
  ['03', 'Keep or gift', 'Claim it to your collection, or generate a link and send it to someone special.'],
]

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[78vh] border-b border-[var(--line)]" />}><Hero /></Suspense>

      <section id="collection" className="container-x scroll-mt-20 py-20">
        <div className="mb-10">
          <p className="eyebrow mb-3">Collection</p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Latest editions</h2>
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

      <section id="gifting" className="container-x scroll-mt-20 py-24">
        <div className="relative isolate overflow-hidden border border-[var(--line)] p-8 md:p-14">
          <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
          <p className="eyebrow mb-3">Gifting</p>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">Give someone a piece of light.</h2>
          <p className="mt-4 max-w-lg text-[#a1a1a1]">At checkout choose &ldquo;Create Gift&rdquo;. You get a private redeem link to copy, or we can email it to them. They create an account and the artwork is theirs.</p>
          <Link href="#collection" className="btn btn-primary btn-lg mt-8">Pick a gift</Link>
        </div>
      </section>
    </main>
  )
}
