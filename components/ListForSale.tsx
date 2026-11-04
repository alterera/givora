'use client'

import { useActionState, useState } from 'react'
import { listPieceAction, type ResaleState } from '@/lib/actions/resale'
import { inr, splitResale, PLATFORM_FEE_BPS } from '@/lib/format'

export default function ListForSale({ productId, royaltyBps, lastSale }: { productId: string; royaltyBps: number; lastSale: number | null }) {
  const [state, action, pending] = useActionState<ResaleState, FormData>(listPieceAction, undefined)
  const [price, setPrice] = useState('')
  const [kind, setKind] = useState<'public' | 'private'>('public')
  const n = Number(price)
  const split = n > 0 ? splitResale(n, PLATFORM_FEE_BPS, royaltyBps) : null

  return (
    <form action={action} className="flex flex-col gap-4 p-4">
      <input type="hidden" name="product_id" value={productId} />
      <div className="grid grid-cols-2 border border-[var(--line)] text-sm">
        {([['public', 'Public listing'], ['private', 'Private link']] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={`py-2 transition-colors ${kind === k ? 'bg-white text-black' : 'text-[#a1a1a1] hover:text-white'}`}>{label}</button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />
      <div>
        <label className="label" htmlFor={`price-${productId}`}>Asking price (INR){lastSale != null && <span className="text-[#5f5f5f]"> · last sale {inr(lastSale)}</span>}</label>
        <input id={`price-${productId}`} name="price" type="number" min="1" step="1" required value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
      </div>
      {kind === 'private' && (
        <div>
          <label className="label" htmlFor={`for-${productId}`}>Only this buyer (optional email)</label>
          <input id={`for-${productId}`} name="for_email" type="email" placeholder="buyer@example.com" className="input" />
          <p className="mt-1 text-xs text-[#6b6b6b]">You get a link for one person. It is not shown in the marketplace.</p>
        </div>
      )}
      {split && (
        <dl className="mono grid gap-1 border border-[var(--line)] bg-black p-3 text-xs">
          <div className="flex justify-between"><dt className="text-[#8f8f8f]">Givora fee ({PLATFORM_FEE_BPS / 100}%)</dt><dd>− {inr(split.fee)}</dd></div>
          <div className="flex justify-between"><dt className="text-[#8f8f8f]">Artist royalty ({royaltyBps / 100}%)</dt><dd>− {inr(split.royalty)}</dd></div>
          <div className="flex justify-between border-t border-[var(--line)] pt-1 text-sm text-white"><dt>You receive</dt><dd>{inr(split.seller)}</dd></div>
        </dl>
      )}
      <button disabled={pending} className="btn btn-primary">{pending ? 'Listing…' : 'List for sale'}</button>
      <p className="text-xs text-[#6b6b6b]">Proceeds are held for 7 days after a sale, then paid out by Givora.</p>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
    </form>
  )
}
