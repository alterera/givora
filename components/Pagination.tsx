import Link from 'next/link'

function range(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const lo = Math.max(2, page - 1), hi = Math.min(pages - 1, page + 1)
  if (lo > 2) out.push('…')
  for (let i = lo; i <= hi; i++) out.push(i)
  if (hi < pages - 1) out.push('…')
  out.push(pages)
  return out
}

export default function Pagination({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null
  const href = (n: number) => (n === 1 ? base : `${base}?page=${n}`)
  const cell = 'pager-item inline-flex h-9 min-w-9 items-center justify-center border px-3 text-sm mono'
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1
        ? <Link href={href(page - 1)} className={`${cell} border-[var(--line-strong)] hover:bg-[var(--g)] hover:text-black`}>← Prev</Link>
        : <span className={`${cell} border-[var(--line)] text-[#4a4a4a]`}>← Prev</span>}
      {range(page, pages).map((n, i) => n === '…'
        ? <span key={`gap-${i}`} className="px-1 text-[#5f5f5f]">…</span>
        : <Link key={n} href={href(n)} aria-current={n === page ? 'page' : undefined}
            className={`${cell} ${n === page ? 'border-[var(--g)] bg-[var(--g)] text-black' : 'border-[var(--line-strong)] text-[#a1a1a1] hover:bg-[var(--g)] hover:text-black'}`}>{n}</Link>)}
      {page < pages
        ? <Link href={href(page + 1)} className={`${cell} border-[var(--line-strong)] hover:bg-[var(--g)] hover:text-black`}>Next →</Link>
        : <span className={`${cell} border-[var(--line)] text-[#4a4a4a]`}>Next →</span>}
    </nav>
  )
}
