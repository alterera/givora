import type { ProvenanceStep } from '@/lib/pieces'
import { fmtDate, inr } from '@/lib/format'

function describe(s: ProvenanceStep) {
  switch (s.kind) {
    case 'minted': return { title: 'Minted', detail: s.to ? `by ${s.to}` : '' }
    case 'purchased': return { title: `Purchased by ${s.to}`, detail: s.price != null ? inr(s.price) : '' }
    case 'gifted': return { title: `Gifted to ${s.to}`, detail: s.from ? `from ${s.from}` : '' }
    case 'resold': return { title: `Resold to ${s.to}`, detail: `${s.price != null ? inr(s.price) : ''}${s.from ? ` · from ${s.from}` : ''}` }
  }
}

export default function Provenance({ steps, valid }: { steps: ProvenanceStep[]; valid: boolean }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="eyebrow">Provenance</p>
        <span className={`badge ${valid ? 'badge-live' : ''}`} title="Every step is hash-chained to the one before it.">
          {valid ? 'CHAIN VERIFIED' : 'CHAIN BROKEN'}
        </span>
      </div>
      <ol className="relative ml-1.5 border-l border-[var(--line-strong)]">
        {steps.map((s, i) => {
          const d = describe(s)
          const last = i === steps.length - 1
          return (
            <li key={i} className="relative pb-6 pl-6 last:pb-0">
              <span className={`absolute -left-[5px] top-1.5 size-2.5 ${last ? 'bg-white' : 'bg-[#3d3d3d]'}`} />
              <p className="text-sm font-medium">{d.title}</p>
              <p className="mono text-xs text-[#8f8f8f]">{fmtDate(s.at)}{d.detail ? ` · ${d.detail}` : ''}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
