import type { Product } from '@/lib/products'

/** A slow ticker of piece fingerprints: pure decoration that sells the "verifiable" idea. */
export default function HashBand({ products }: { products: Pick<Product, 'id' | 'fingerprint' | 'serial'>[] }) {
  const items = products.length ? products : [{ id: '0'.repeat(32), fingerprint: null, serial: null }]
  const row = [...items, ...items, ...items, ...items].slice(0, 24)
  const line = (p: (typeof items)[number], i: number) => {
    const h = (p.fingerprint ?? p.id).replace(/[^0-9a-f]/gi, '').toLowerCase().padEnd(40, '0').slice(0, 40)
    return <span key={i} className="hash">{p.serial ?? 'GIV'} · sha256:{h}</span>
  }
  return (
    <div className="hash-band" aria-hidden>
      <div className="hash-track">{row.map(line)}{row.map((p, i) => line(p, i + 100))}</div>
    </div>
  )
}
