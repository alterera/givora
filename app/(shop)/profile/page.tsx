import Link from 'next/link'
import { Suspense } from 'react'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { viewerProps, type Product } from '@/lib/products'
import ProductViewer from '@/components/particle/ProductViewer'

async function Owned() {
  const user = await requireUser('/profile')
  const { data } = await createAdminClient()
    .from('editions').select('id, edition_no, claimed_at, products(*)').eq('owner_id', user.id).order('claimed_at', { ascending: false })
  const items = (data ?? []) as unknown as { id: string; edition_no: number; products: Product }[]
  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">{user.email}</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">My collection</h1>
        </div>
        <span className="badge">{items.length} {items.length === 1 ? 'PIECE' : 'PIECES'}</span>
      </div>
      {!items.length ? (
        <div className="panel flex flex-col items-center gap-4 p-14 text-center">
          <p className="text-[#a1a1a1]">Your collection is empty.</p>
          <Link href="/#collection" className="btn btn-primary">Explore the collection</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ id, edition_no, products: p }, i) => (
            <div key={id} className="card-art reveal" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="relative aspect-[4/5]"><ProductViewer {...viewerProps(p, 40000)} lazy interactive className="absolute inset-0" /></div>
              <div className="flex items-center justify-between border-t border-[var(--line)] p-4">
                <div><h3 className="font-medium">{p.title}</h3><p className="text-sm text-[#8f8f8f]">{p.artist_name}</p></div>
                <span className="badge">#{edition_no}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function ProfilePage() {
  return (
    <main className="container-x py-10 md:py-16">
      <Suspense fallback={<div className="panel particle-skeleton relative h-72" />}><Owned /></Suspense>
    </main>
  )
}
