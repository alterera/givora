import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { viewerProps, type Product } from '@/lib/products'
import ProductViewer from '@/components/particle/ProductViewer'

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await createAdminClient().from('products').select('*').eq('slug', slug).eq('status', 'published').single()
  if (!data) notFound()
  const p = data as Product
  const total = p.stock + p.sold
  const pct = total ? Math.round((p.sold / total) * 100) : 0
  return (
    <main className="container-x grid gap-8 py-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:py-12">
      <div className="reveal lg:sticky lg:top-20 lg:self-start">
        <div className="relative aspect-square w-full border border-[var(--line)] lg:aspect-[5/6]">
          <ProductViewer {...viewerProps(p)} interactive className="absolute inset-0" />
          <span className="eyebrow pointer-events-none absolute bottom-3 left-3">Drag to rotate · Scroll to zoom</span>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:py-4">
        <div className="reveal d1">
          <Link href="/#collection" className="eyebrow link-underline">← Collection</Link>
          <h1 className="mt-5 text-4xl font-semibold tracking-tighter md:text-5xl">{p.title}</h1>
          <p className="mt-2 text-[#a1a1a1]">by <span className="text-white">{p.artist_name || 'Unknown artist'}</span></p>
        </div>

        {p.description && <p className="reveal d2 whitespace-pre-line leading-relaxed text-[#b4b4b4]">{p.description}</p>}

        <div className="reveal d3 panel p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow mb-1">Price</p>
              <p className="text-3xl font-semibold tracking-tight">₹{Number(p.price_inr).toLocaleString('en-IN')}</p>
            </div>
            <span className={`badge ${p.stock > 0 ? 'badge-live' : ''}`}>{p.stock > 0 ? 'AVAILABLE' : 'SOLD OUT'}</span>
          </div>
          <div className="mt-5">
            <div className="mono mb-2 flex justify-between text-xs text-[#8f8f8f]">
              <span>Edition</span><span>{p.sold} / {total} claimed</span>
            </div>
            <div className="h-1 w-full bg-[#1a1a1a]"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${pct}%` }} /></div>
          </div>
          {p.stock > 0 ? (
            <Link href={`/checkout/${p.slug}`} className="btn btn-primary btn-lg mt-6 w-full">Buy now</Link>
          ) : (
            <button disabled className="btn btn-lg mt-6 w-full">Sold out</button>
          )}
          <p className="mt-3 text-center text-xs text-[#6b6b6b]">Digital product · Instant ownership · Can be gifted at checkout</p>
        </div>

        <dl className="reveal d4 grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] text-sm">
          {[['Format', 'Particle cloud'], ['Delivery', 'Digital, instant'], ['Edition size', String(total)], ['Artist', p.artist_name || 'Unknown']].map(([k, v]) => (
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
