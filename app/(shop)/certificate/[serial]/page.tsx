import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createAdminClient, assetUrl } from '@/lib/supabase-admin'
import { getUser } from '@/lib/auth'
import { viewerProps, type Product } from '@/lib/products'
import { getOpenListing, getPieceState, getProvenance } from '@/lib/pieces'
import { fmtDate, inr } from '@/lib/format'
import ProductViewer from '@/components/particle/ProductViewer'
import Provenance from '@/components/Provenance'
import VerifyFile from '@/components/VerifyFile'

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-4 border-b border-[#141414] py-3 text-sm last:border-0">
      <dt className="eyebrow pt-0.5">{k}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

async function Certificate({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params
  const { data } = await createAdminClient()
    .from('products').select('*').eq('serial', serial.toUpperCase()).eq('status', 'published').single()
  if (!data) notFound()
  const p = data as Product

  const [state, prov, listing, user] = await Promise.all([getPieceState(p.id), getProvenance(p.id), getOpenListing(p.id), getUser()])
  const isOwner = !!user && state.ownerId === user.id
  const available = !state.editionId && p.stock > 0

  return (
    <main className="container-x grid gap-8 py-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-12">
      <div className="reveal lg:sticky lg:top-20 lg:self-start">
        <div className="relative aspect-square w-full border border-[var(--line)] lg:aspect-[5/6]">
          <ProductViewer {...viewerProps(p, undefined, { interactive: true, owner: isOwner })} className="absolute inset-0" />
          <span className="eyebrow pointer-events-none absolute bottom-3 left-3">Live artwork · seed {p.seed}</span>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:py-2">
        <header className="reveal d1">
          <p className="eyebrow">Certificate of authenticity</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="mono break-all text-2xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{p.serial}</h1>
            <span className="badge badge-live">1 OF 1</span>
          </div>
          <p className="mt-3 text-xl tracking-tight">{p.title}</p>
        </header>

        <dl className="reveal d2 panel px-5 py-2">
          <Row k="Artist">{p.artist_name || 'Unknown artist'}</Row>
          <Row k="Minted">{p.minted_at ? fmtDate(p.minted_at) : '-'}</Row>
          <Row k="Owner">
            {state.ownerName ?? (state.awaitingClaim ? <span className="text-[#8f8f8f]">Purchased, awaiting claim</span> : <span className="text-[#8f8f8f]">Unclaimed, with the artist</span>)}
            {isOwner && <span className="badge ml-2">YOU</span>}
          </Row>
          <Row k="Last sale">{prov.lastSalePrice != null ? inr(prov.lastSalePrice) : <span className="text-[#8f8f8f]">Not sold yet</span>}</Row>
          <Row k="Fingerprint"><span className="mono break-all text-xs text-[#bdbdbd]">SHA-256 {p.fingerprint}</span></Row>
          <Row k="Artist royalty">{(p.royalty_bps / 100).toFixed(p.royalty_bps % 100 ? 1 : 0)}% on every resale</Row>
        </dl>

        <div className="reveal d3 panel p-5">
          {available ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="eyebrow mb-1">Available from the artist</p><p className="text-2xl font-semibold">{inr(p.price_inr)}</p></div>
              <Link href={`/products/${p.slug}`} className="btn btn-primary btn-lg">Acquire this piece</Link>
            </div>
          ) : listing && listing.kind === 'public' ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="eyebrow mb-1">Listed by owner</p><p className="text-2xl font-semibold">{inr(listing.price)}</p></div>
              {listing.status === 'reserved' ? <span className="badge">SALE IN PROGRESS</span>
                : isOwner ? <Link href="/profile" className="btn">Manage listing</Link>
                : <Link href={`/checkout/resale/${listing.id}`} className="btn btn-primary btn-lg">Buy this piece</Link>}
            </div>
          ) : isOwner ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[#a1a1a1]">You own this piece. List it for sale, download your high-resolution still or record a loop.</p>
              <Link href="/profile" className="btn btn-primary">Open my collection</Link>
            </div>
          ) : (
            <p className="text-sm text-[#a1a1a1]">This piece is held by its owner and is not currently for sale.</p>
          )}
        </div>

        <div className="reveal d3"><Provenance steps={prov.steps} valid={prov.valid} /></div>

        {p.fingerprint && (
          <div className="reveal d4 panel p-5">
            <p className="eyebrow mb-3">Verify the artwork</p>
            <p className="mb-4 text-sm text-[#a1a1a1]">The fingerprint was calculated when the piece was minted and can never change. Check any copy of the file against it, right here in your browser.</p>
            <VerifyFile fingerprint={p.fingerprint} fileUrl={assetUrl(p.asset_path)} />
          </div>
        )}
        <p className="mono text-[11px] text-[#5f5f5f]">Provenance is append-only and hash-chained.</p>
      </div>
    </main>
  )
}

export default function CertificatePage({ params }: PageProps<'/certificate/[serial]'>) {
  return (
    <Suspense fallback={<main className="container-x py-12"><div className="panel particle-skeleton relative aspect-square max-w-2xl" /></main>}>
      <Certificate params={params} />
    </Suspense>
  )
}
