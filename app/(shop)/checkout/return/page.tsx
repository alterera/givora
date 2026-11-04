import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { syncOrder } from '@/lib/fulfil'
import CopyLink from '@/components/CopyLink'

function Shell({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="reveal flex flex-col gap-5">
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
    .from('orders').select('id, status, is_gift, gift_recipient_email, products(title)').eq('cashfree_order_id', order_id).single()
  if (!order) return <Shell eyebrow="Order" title="Order not found" />

  if (order.status !== 'paid') {
    return (
      <Shell eyebrow="Payment" title={status === 'ACTIVE' ? 'Payment pending' : 'Payment not completed'}>
        <p className="text-[#a1a1a1]">If you were charged, refresh this page in a moment.</p>
        <div className="flex gap-3"><Link href="" className="btn">Refresh</Link><Link href="/" className="btn btn-ghost">Back to shop</Link></div>
      </Shell>
    )
  }
  const { data: edition } = await db.from('editions').select('claim_token, edition_no').eq('order_id', order.id).single()
  if (!edition) return <Shell eyebrow="Payment received" title="Preparing your edition…"><p className="text-[#a1a1a1]">Refresh in a few seconds.</p></Shell>

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const link = `${site}/redeem/${edition.claim_token}`
  const product = order.products as unknown as { title: string }
  return (
    <Shell eyebrow={`Payment successful · Edition #${edition.edition_no}`} title={order.is_gift ? 'Your gift is ready' : `${product.title} is yours`}>
      {order.is_gift ? (
        <>
          <p className="max-w-md text-[#a1a1a1]">Share this link with the recipient. Whoever opens it first can redeem the gift, once.</p>
          <div className="panel max-w-xl p-5"><CopyLink link={link} token={edition.claim_token} recipient={order.gift_recipient_email} /></div>
        </>
      ) : (
        <>
          <p className="max-w-md text-[#a1a1a1]">Claim it to add it to your collection. You will create an account (or log in) in the next step.</p>
          <Link href={`/redeem/${edition.claim_token}`} className="btn btn-primary btn-lg w-fit">Claim to my collection</Link>
        </>
      )}
    </Shell>
  )
}

export default function ReturnPage({ searchParams }: PageProps<'/checkout/return'>) {
  return (
    <main className="container-x max-w-2xl py-16 md:py-24">
      <Suspense fallback={<p className="eyebrow">Confirming payment…</p>}>
        <Result searchParams={searchParams as Promise<{ order_id?: string }>} />
      </Suspense>
    </main>
  )
}
