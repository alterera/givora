import Link from 'next/link'
import ProductViewer from '@/components/particle/ProductViewer'
import { viewerProps, type Product } from '@/lib/products'
import { inr } from '@/lib/format'

export default function ProductCard({ product: p, index = 0, lastSale }: { product: Product; index?: number; lastSale?: number | null }) {
  const owned = p.sold > 0 || p.stock <= 0
  return (
    <Link href={`/products/${p.slug}`} className="card-art group reveal" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="relative aspect-[4/5]">
        <ProductViewer {...viewerProps(p, 18000)} lazy className="absolute inset-0" />
        <div className="card-glow" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className={`badge ${owned ? '' : 'badge-live'}`}>{owned ? 'OWNED' : 'AVAILABLE'}</span>
          <span className="badge">1 OF 1</span>
        </div>
        {p.serial && <span className="mono absolute bottom-3 left-3 text-[11px] text-[#8f8f8f]">{p.serial}</span>}
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-[var(--line)] p-4">
        <div className="min-w-0">
          <h3 className="truncate font-medium tracking-tight">{p.title}</h3>
          <p className="truncate text-sm text-[#8f8f8f]">{p.artist_name || 'Unknown artist'}</p>
        </div>
        <div className="text-right">
          <p className="mono text-sm">{owned && lastSale != null ? inr(lastSale) : inr(p.price_inr)}</p>
          <p className="mono text-[11px] text-[#6b6b6b]">{owned ? (lastSale != null ? 'Last sale' : 'Held') : 'Price'}</p>
        </div>
      </div>
    </Link>
  )
}
