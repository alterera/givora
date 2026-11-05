import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { syncOrder } from '@/lib/fulfil'
import CopyLink from '@/components/CopyLink'
import GiftReveal from '@/components/GiftReveal'
import RedeemForm from '@/components/RedeemForm'
import { getUser } from '@/lib/auth'
import { viewerProps, type Product } from '@/lib/products'
import { inr } from '@/lib/format'

function Shell({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="reveal mx-auto flex max-w-2xl flex-col gap-5">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {children}
    </div>
  )
}

async function Result({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams
  if (!order_id) return <Shell eyebrow="Order" title="Missing order" />
  const status = await syncOrder(order_id).catch(() => 'UNKNOWN')

  const db = createAdminClient()
  const { data: order } = await db
    .from('orders').select('id, status, kind, is_gift, amount, buyer_email, gift_recipient_email, products(*)').eq('cashfree_order_id', order_id).single()
  if (!order) return <Shell eyebrow="Order" title="Order not found" />

  if (order.status !== 'paid') {
    return (
      <Shell eyebrow="Payment" title={status === 'ACTIVE' ? 'Payment pending' : 'Payment not completed'}>
        <p className="text-[#a1a1a1]">If you were charged, refresh this page in a moment.</p>
        <div className="flex gap-3"><Link href="" className="btn">Refresh</Link><Link href="/" className="btn btn-ghost">Back to shop</Link></div>
      </Shell>
    )
  }
  if (order.kind === 'resale') {
    const rp = order.products as unknown as { title: string; serial: string | null }
    return (
      <Shell eyebrow="Payment successful" title={`${rp.title} is now yours`}>
        <p className="max-w-md text-[#a1a1a1]">The sale has been added to its public provenance. You can show it, download your collector extras, or sell it on.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/profile" className="btn btn-primary btn-lg">Open my collection</Link>
          {rp.serial && <Link href={`/certificate/${rp.serial}`} className="btn btn-lg">View certificate</Link>}
        </div>
      </Shell>
    )
  }
  const { data: edition } = await db.from('editions').select('claim_token, edition_no, owner_id').eq('order_id', order.id).single()
  if (!edition) return <Shell eyebrow="Payment received" title="Preparing your edition…"><p className="text-[#a1a1a1]">Refresh in a few seconds.</p></Shell>

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const link = `${site}/redeem/${edition.claim_token}`
  const product = order.products as unknown as Product

  if (order.is_gift) {
    return (
      <Shell eyebrow="Payment successful · 1 of 1" title="Your gift is ready">
        <p className="max-w-md text-[#a1a1a1]">Share this link with the recipient. Whoever opens it first can redeem the gift, once.</p>
        <div className="panel max-w-xl p-5"><CopyLink link={link} token={edition.claim_token} recipient={order.gift_recipient_email} /></div>
      </Shell>
    )
  }

  if (edition.owner_id) {
    return (
      <Shell eyebrow="Payment successful · 1 of 1" title={`${product.title} is in your collection`}>
        <div className="flex flex-wrap gap-3">
          <Link href="/profile" className="btn btn-primary btn-lg">Open my collection</Link>
          {product.serial && <Link href={`/certificate/${product.serial}`} className="btn btn-lg">View certificate</Link>}
        </div>
      </Shell>
    )
  }

  // The buyer opens their own purchase straight away: no gift framing, same unboxing moment.
  const user = await getUser()
  return (
    <GiftReveal mode="purchase" viewer={viewerProps(product)} title={product.title} artist={product.artist_name} serial={product.serial} price={inr(Number(order.amount))}>
      <RedeemForm token={edition.claim_token} loggedInEmail={user?.email ?? undefined} defaultEmail={order.buyer_email} purchase />
    </GiftReveal>
  )
}

export default function ReturnPage({ searchParams }: PageProps<'/checkout/return'>) {
  return (
    <main className="container-x py-12 md:py-20">
      <Suspense fallback={<p className="eyebrow">Confirming payment…</p>}>
        <Result searchParams={searchParams as Promise<{ order_id?: string }>} />
      </Suspense>
    </main>
  )
}
