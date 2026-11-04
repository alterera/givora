import Link from 'next/link'
import ProductViewer from '@/components/particle/ProductViewer'
import { viewerProps, type Product } from '@/lib/products'

export default function ProductCard({ product: p, index = 0 }: { product: Product; index?: number }) {
  const soldOut = p.stock <= 0
  return (
    <Link href={`/products/${p.slug}`} className="card-art group reveal" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="relative aspect-[4/5]">
        <ProductViewer {...viewerProps(p, 18000)} lazy className="absolute inset-0" />
        <div className="card-glow" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className={`badge ${soldOut ? '' : 'badge-live'}`}>{soldOut ? 'SOLD OUT' : `${p.stock} LEFT`}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-[var(--line)] p-4">
        <div className="min-w-0">
          <h3 className="truncate font-medium tracking-tight">{p.title}</h3>
          <p className="truncate text-sm text-[#8f8f8f]">{p.artist_name || 'Unknown artist'}</p>
        </div>
        <div className="text-right">
          <p className="mono text-sm">₹{Number(p.price_inr).toLocaleString('en-IN')}</p>
          <p className="mono text-[11px] text-[#6b6b6b] transition-transform group-hover:translate-x-1">View →</p>
        </div>
      </div>
    </Link>
  )
}
