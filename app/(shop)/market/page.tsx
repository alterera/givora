import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { viewerProps, type Product } from '@/lib/products'
import { inr } from '@/lib/format'
import ProductViewer from '@/components/particle/ProductViewer'

async function Listings() {
  const { data } = await createAdminClient()
    .from('listings').select('id, price, products(*)').eq('kind', 'public').eq('status', 'active').order('created_at', { ascending: false })
  const rows = (data ?? []) as unknown as { id: string; price: number; products: Product }[]
  if (!rows.length) {
    return <div className="panel p-10 text-center text-[#8f8f8f]">No pieces are listed for resale right now.</div>
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(({ id, price, products: p }, i) => (
        <Link key={id} href={p.serial ? `/certificate/${p.serial}` : '/'} className="card-art reveal" style={{ animationDelay: `${i * 70}ms` }}>
          <div className="relative aspect-[4/5]">
            <ProductViewer {...viewerProps(p, 18000)} lazy className="absolute inset-0" />
            <span className="badge absolute left-3 top-3">RESALE</span>
            {p.serial && <span className="mono absolute bottom-3 left-3 text-[11px] text-[#8f8f8f]">{p.serial}</span>}
          </div>
          <div className="flex items-end justify-between gap-4 border-t border-[var(--line)] p-4">
            <div className="min-w-0"><h3 className="truncate font-medium">{p.title}</h3><p className="truncate text-sm text-[#8f8f8f]">{p.artist_name}</p></div>
            <p className="mono text-sm">{inr(price)}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function MarketPage() {
  return (
    <main className="container-x py-10 md:py-16">
      <p className="eyebrow mb-3">Marketplace</p>
      <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">Pieces for resale</h1>
      <p className="mb-10 max-w-xl text-[#a1a1a1]">Owners list pieces they are ready to pass on. Every sale is added to the piece&rsquo;s public provenance and pays the artist a royalty. <Link href="/#collection" className="link-underline text-white">Looking for new pieces?</Link></p>
      <Suspense fallback={<div className="panel particle-skeleton relative h-72" />}><Listings /></Suspense>
    </main>
  )
}
