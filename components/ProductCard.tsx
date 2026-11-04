import Link from 'next/link'
import ProductViewer from '@/components/particle/ProductViewer'
import ScrambleText from '@/components/ScrambleText'
import { viewerProps, type Product } from '@/lib/products'
import { inr } from '@/lib/format'

/** Short, chain-style digest of the piece's fingerprint: 0x3fa9…c21e */
export function shortHash(p: Pick<Product, 'fingerprint' | 'id'>) {
  const h = (p.fingerprint ?? p.id).replace(/[^0-9a-f]/gi, '').toLowerCase().padEnd(12, '0')
  return `0x${h.slice(0, 6)}…${h.slice(-4)}`
}

export default function ProductCard({ product: p, index = 0, lastSale }: { product: Product; index?: number; lastSale?: number | null }) {
  const owned = p.sold > 0 || p.stock <= 0
  return (
    <Link href={`/products/${p.slug}`} className="card-art group reveal" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="relative aspect-square">
        <ProductViewer {...viewerProps(p, 14000)} lazy className="absolute inset-0" />
        <div className="card-glow" />
        <div className="scan" />
        <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          <span className={`badge ${owned ? '' : 'badge-live'}`}>{owned ? 'OWNED' : 'AVAILABLE'}</span>
        </div>
        <span className="hash absolute bottom-2.5 left-3"><ScrambleText text={shortHash(p)} hover /></span>
      </div>
      <div className="flex items-end justify-between gap-3 border-t border-[var(--line)] p-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium tracking-tight">{p.title}</h3>
          <p className="truncate text-xs text-[#8f8f8f]">{p.artist_name || 'Unknown artist'}</p>
        </div>
        <div className="text-right">
          <p className="mono text-sm">{owned && lastSale != null ? inr(lastSale) : inr(p.price_inr)}</p>
          <p className="mono text-[10px] text-[#6b6b6b]">{owned ? (lastSale != null ? 'Last sale' : 'Held') : 'Price'}</p>
        </div>
      </div>
    </Link>
  )
}
