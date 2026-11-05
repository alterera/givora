import { Suspense } from 'react'
import { getPublished, lastSales } from '@/lib/catalog'
import ProductCard from '@/components/ProductCard'
import Pagination from '@/components/Pagination'
import HashBand from '@/components/HashBand'
import ScrambleText from '@/components/ScrambleText'

export const metadata = {
  title: 'Collection',
  description: 'Browse every one-of-one digital particle artwork on Givora World. Each piece has its own serial, certificate and recorded history.',
  alternates: { canonical: '/collection' },
}

const PAGE_SIZE = 12

async function Grid({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams
  const requested = Math.max(1, Math.floor(Number(sp.page)) || 1)
  const first = await getPublished({ limit: PAGE_SIZE, from: (requested - 1) * PAGE_SIZE })
  const pages = Math.max(1, Math.ceil(first.total / PAGE_SIZE))
  const page = Math.min(requested, pages)
  const { products } = page === requested ? first : await getPublished({ limit: PAGE_SIZE, from: (page - 1) * PAGE_SIZE })
  const sales = await lastSales(products.map((p) => p.id))

  if (!products.length) return <div className="panel p-10 text-center text-[#8f8f8f]">The first pieces are on their way. Check back soon.</div>
  return (
    <>
      <HashBand products={products} />
      {/* key on the page so every page change replays the entrance animation */}
      <div key={page} className="page-swap mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} lastSale={sales.get(p.id) ?? null} />)}
      </div>
      <p className="mono mt-8 text-center text-xs text-[#6b6b6b]">Page {page} of {pages} · {first.total} {first.total === 1 ? 'piece' : 'pieces'}</p>
      <Pagination page={page} pages={pages} base="/collection" />
    </>
  )
}

export default function CollectionPage({ searchParams }: PageProps<'/collection'>) {
  return (
    <main className="container-x py-10 md:py-14">
      <p className="eyebrow mb-3">Collection · signed &amp; encrypted</p>
      <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-5xl"><ScrambleText text="All Drops" /></h1>
      <p className="mb-8 max-w-xl text-[#a1a1a1]">Every piece is a one-of-one original with its own fingerprint, certificate and recorded history.</p>
      <Suspense fallback={<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="panel relative aspect-square animate-pulse" />)}</div>}>
        <Grid searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
