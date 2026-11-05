import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import { getUser } from '@/lib/auth'
import { viewerProps, type Product } from '@/lib/products'
import GiftReveal from '@/components/GiftReveal'
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

type Row = {
  owner_id: string | null
  frozen: boolean
  products: Product
  orders: { is_gift: boolean; gift_sender_name: string | null; gift_message: string | null; gift_occasion: string | null } | null
}

async function Redeem({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data } = await createAdminClient()
    .from('editions')
    .select('owner_id, frozen, products(*), orders(is_gift, gift_sender_name, gift_message, gift_occasion)')
    .eq('claim_token', token).single()
  if (!data) return <Message title="Invalid link" body="This redeem link does not exist. Check that you copied it fully." />
  const row = data as unknown as Row
  if (row.owner_id) return <Message title="Already redeemed" body="This piece has already been claimed." />
  if (row.frozen) return <Message title="On hold" body="This piece is temporarily on hold. Please contact support." />
  const p = row.products
  const gift = row.orders?.is_gift ? row.orders : null
  const user = await getUser()
  const form = <RedeemForm token={token} loggedInEmail={user?.email ?? undefined} />

  return (
    <GiftReveal
      viewer={viewerProps(p)}
      mode="gift" title={p.title} artist={p.artist_name} serial={p.serial}
      sender={gift?.gift_sender_name ?? null} message={gift?.gift_message ?? null} occasion={gift?.gift_occasion ?? null}
    >
      {form}
    </GiftReveal>
  )
}

export default function RedeemPage({ params }: PageProps<'/redeem/[token]'>) {
  return (
    <main className="container-x py-10 md:py-16">
      <Suspense fallback={<div className="panel particle-skeleton relative mx-auto h-72 max-w-md" />}><Redeem params={params} /></Suspense>
    </main>
  )
}
