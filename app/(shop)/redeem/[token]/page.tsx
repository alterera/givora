import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { getUser } from '@/lib/auth'
import { viewerProps, type Product } from '@/lib/products'
import ProductViewer from '@/components/particle/ProductViewer'
import RedeemForm from '@/components/RedeemForm'

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="reveal mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-[#a1a1a1]">{body}</p>
      <Link href="/" className="btn mt-3">Back to shop</Link>
    </div>
  )
}

async function Redeem({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data } = await createAdminClient()
    .from('editions').select('owner_id, edition_no, products(*)').eq('claim_token', token).single()
  if (!data) return <Message title="Invalid link" body="This redeem link does not exist. Check that you copied it fully." />
  if (data.owner_id) return <Message title="Already redeemed" body="This gift has already been claimed by someone." />
  const p = data.products as unknown as Product
  const user = await getUser()
  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
      <div className="reveal relative aspect-square border border-[var(--line)]">
        <ProductViewer {...viewerProps(p)} interactive className="absolute inset-0" />
      </div>
      <div className="reveal d1 flex flex-col gap-4">
        <p className="eyebrow">A gift for you · Edition #{data.edition_no}</p>
        <h1 className="text-4xl font-semibold tracking-tighter">{p.title}</h1>
        <p className="text-[#a1a1a1]">by {p.artist_name}</p>
        <div className="mt-4"><RedeemForm token={token} loggedInEmail={user?.email ?? undefined} /></div>
      </div>
    </div>
  )
}

export default function RedeemPage({ params }: PageProps<'/redeem/[token]'>) {
  return (
    <main className="container-x py-10 md:py-16">
      <Suspense fallback={<div className="panel particle-skeleton relative aspect-square max-w-xl" />}><Redeem params={params} /></Suspense>
    </main>
  )
}
