import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { viewerProps, type Product } from '@/lib/products'
import { inr } from '@/lib/format'
import ProductViewer from '@/components/particle/ProductViewer'

async function PrivateSale({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data } = await createAdminClient()
    .from('listings').select('id, price, status, for_email, products(*)').eq('private_token', token).single()
  const listing = data as unknown as { id: string; price: number; status: string; for_email: string | null; products: Product } | null
  if (!listing || listing.status === 'cancelled' || listing.status === 'sold') {
    return (
      <div className="reveal mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">This private sale has ended</h1>
        <p className="text-[#a1a1a1]">The piece was sold or the owner withdrew the offer.</p>
        <Link href="/" className="btn mt-3">Back to shop</Link>
      </div>
    )
  }
  const p = listing.products
  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
      <div className="reveal relative aspect-square border border-[var(--line)]">
        <ProductViewer {...viewerProps(p, undefined, { interactive: true })} className="absolute inset-0" />
      </div>
      <div className="reveal d1 flex flex-col gap-4">
        <p className="eyebrow">Private sale{listing.for_email ? ' · for one buyer' : ''}</p>
        <h1 className="text-4xl font-semibold tracking-tighter">{p.title}</h1>
        <p className="text-[#a1a1a1]">by {p.artist_name} · <span className="mono">{p.serial}</span> · 1 of 1</p>
        <p className="mt-2 text-3xl font-semibold">{inr(listing.price)}</p>
        {listing.status === 'reserved'
          ? <p className="panel p-4 text-sm text-[#a1a1a1]">A purchase is in progress. Check back in a few minutes.</p>
          : <Link href={`/checkout/resale/${listing.id}`} className="btn btn-primary btn-lg w-fit">Continue to checkout</Link>}
        <p className="text-xs text-[#6b6b6b]">You will be asked to log in or create an account so the piece can be transferred to you.</p>
      </div>
    </div>
  )
}

export default function BuyPage({ params }: PageProps<'/buy/[token]'>) {
  return (
    <main className="container-x py-10 md:py-16">
      <Suspense fallback={<div className="panel particle-skeleton relative mx-auto h-72 max-w-md" />}><PrivateSale params={params} /></Suspense>
    </main>
  )
}
