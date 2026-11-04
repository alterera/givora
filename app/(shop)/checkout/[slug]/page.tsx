import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { viewerProps, type Product } from '@/lib/products'
import ProductViewer from '@/components/particle/ProductViewer'
import CheckoutForm from '@/components/CheckoutForm'

async function Checkout({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await createAdminClient().from('products').select('*').eq('slug', slug).eq('status', 'published').single()
  if (!data) notFound()
  const p = data as Product
  const mode = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
  return (
    <main className="container-x grid gap-10 py-10 md:grid-cols-[1fr_1.1fr] md:py-16">
      <aside className="reveal order-2 md:order-1">
        <Link href={`/products/${p.slug}`} className="eyebrow link-underline">← Back to piece</Link>
        <div className="panel mt-5 overflow-hidden">
          <div className="relative aspect-square"><ProductViewer {...viewerProps(p, 30000)} className="absolute inset-0" /></div>
          <div className="flex items-end justify-between border-t border-[var(--line)] p-4">
            <div><h2 className="font-medium">{p.title}</h2><p className="text-sm text-[#8f8f8f]">{p.artist_name}</p></div>
            <p className="mono">₹{Number(p.price_inr).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </aside>

      <section className="reveal d1 order-1 md:order-2">
        <p className="eyebrow mb-3">Checkout</p>
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">Complete your purchase</h1>
        {p.stock > 0 ? <CheckoutForm slug={p.slug} mode={mode} /> : <p className="panel p-6 text-[#a1a1a1]">This edition is sold out.</p>}
      </section>
    </main>
  )
}

export default function CheckoutPage({ params }: PageProps<'/checkout/[slug]'>) {
  return <Suspense fallback={<div className="container-x py-16"><div className="panel particle-skeleton relative h-96" /></div>}><Checkout params={params} /></Suspense>
}
