import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { viewerProps, type Product } from '@/lib/products'
import { getProvenance } from '@/lib/pieces'
import { inr } from '@/lib/format'
import ProductViewer from '@/components/particle/ProductViewer'
import ResaleCheckoutForm from '@/components/ResaleCheckoutForm'

async function ResaleCheckout({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) notFound()
  const user = await requireUser(`/checkout/resale/${listingId}`)
  const { data } = await createAdminClient()
    .from('listings').select('id, price, kind, status, seller_id, for_email, products(*)').eq('id', listingId).single()
  if (!data) notFound()
  const listing = data as unknown as { id: string; price: number; kind: string; status: string; seller_id: string; for_email: string | null; products: Product }
  const p = listing.products
  const prov = await getProvenance(p.id)
  const mode = process.env.CASHFREE_ENV?.trim().toLowerCase() === 'production' ? 'production' : 'sandbox'

  let blocked = ''
  if (listing.status !== 'active') blocked = 'This listing is no longer available.'
  else if (listing.seller_id === user.id) blocked = 'This is your own listing.'
  else if (listing.for_email && listing.for_email !== user.email?.toLowerCase()) blocked = `This private sale is reserved for another buyer. You are signed in as ${user.email}.`

  return (
    <main className="container-x grid gap-10 py-10 md:grid-cols-[1fr_1.1fr] md:py-16">
      <aside className="reveal order-2 md:order-1">
        <Link href={p.serial ? `/certificate/${p.serial}` : '/'} className="eyebrow link-underline">← Certificate</Link>
        <div className="panel mt-5 overflow-hidden">
          <div className="relative aspect-square"><ProductViewer {...viewerProps(p, 30000)} className="absolute inset-0" /></div>
          <div className="flex items-end justify-between border-t border-[var(--line)] p-4">
            <div><h2 className="font-medium">{p.title}</h2><p className="mono text-xs text-[#8f8f8f]">{p.serial} · 1 of 1</p></div>
            <span className={`badge ${prov.valid ? 'badge-live' : ''}`}>{prov.valid ? 'CHAIN VERIFIED' : 'CHAIN BROKEN'}</span>
          </div>
        </div>
      </aside>

      <section className="reveal d1 order-1 md:order-2">
        <p className="eyebrow mb-3">Resale checkout</p>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Buy {p.title}</h1>
        <dl className="panel mb-6 px-5 py-2 text-sm">
          <div className="flex justify-between border-b border-[#141414] py-3"><dt className="text-[#a1a1a1]">Price</dt><dd className="mono">{inr(listing.price)}</dd></div>
          <div className="flex justify-between border-b border-[#141414] py-3"><dt className="text-[#a1a1a1]">Buyer fees</dt><dd className="mono">None</dd></div>
          <div className="flex justify-between py-3 font-medium"><dt>Total</dt><dd className="mono">{inr(listing.price)}</dd></div>
        </dl>
        <p className="mb-6 text-sm text-[#8f8f8f]">The piece moves to <span className="text-white">{user.email}</span> as soon as payment succeeds, and the sale is added to its provenance. The seller&rsquo;s platform fee and the artist royalty are taken from the sale price.</p>
        {blocked ? (
          <p className="panel p-5 text-[#a1a1a1]">{blocked}</p>
        ) : (
          <ResaleCheckoutForm listingId={listing.id} mode={mode} label={`Pay ${inr(listing.price)}`} />
        )}
      </section>
    </main>
  )
}

export default function ResaleCheckoutPage({ params }: PageProps<'/checkout/resale/[listingId]'>) {
  return <Suspense fallback={<div className="container-x py-16"><div className="panel particle-skeleton relative h-96" /></div>}><ResaleCheckout params={params} /></Suspense>
}
