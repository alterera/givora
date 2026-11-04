'use client'

import { useActionState, useEffect, useState } from 'react'
import { load } from '@cashfreepayments/cashfree-js'
import { startCheckout, type CheckoutState } from '@/lib/actions/checkout'

export default function CheckoutForm({ slug, mode }: { slug: string; mode: 'sandbox' | 'production' }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, undefined)
  const [gift, setGift] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    if (!state?.paymentSessionId) return
    ;(async () => {
      const cashfree = await load({ mode })
      const result = await cashfree.checkout({ paymentSessionId: state.paymentSessionId!, redirectTarget: '_self' })
      if (result?.error) setPayError(result.error.message)
    })()
  }, [state, mode])

  const busy = pending || !!state?.paymentSessionId

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label className="label" htmlFor="email">Your email</label>
        <input id="email" name="email" type="email" placeholder="you@example.com" required className="input" />
        <p className="mt-1.5 text-xs text-[#6b6b6b]">We send your receipt and claim link here. No account needed to pay.</p>
      </div>

      <label className={`panel flex cursor-pointer items-start gap-3 p-4 transition-colors ${gift ? 'border-white' : 'hover:border-[var(--line-strong)]'}`}>
        <input type="checkbox" name="gift" checked={gift} onChange={(e) => setGift(e.target.checked)} className="mt-1 size-4 accent-white" />
        <span>
          <span className="block font-medium">Create Gift</span>
          <span className="block text-sm text-[#8f8f8f]">Buy this for someone else. You will get a redeem link to copy or email.</span>
        </span>
      </label>

      <div className={`grid transition-all duration-300 ${gift ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <label className="label" htmlFor="recipient">Recipient email (optional)</label>
          <input id="recipient" name="recipient" type="email" placeholder="friend@example.com" className="input" tabIndex={gift ? 0 : -1} />
        </div>
      </div>

      <button disabled={busy} className="btn btn-primary btn-lg w-full">{busy ? 'Opening secure payment…' : 'Pay now'}</button>
      {(state?.error || payError) && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state?.error ?? payError}</p>}
      <p className="text-center text-xs text-[#6b6b6b]">Payments are processed by Cashfree. You are redirected to complete payment.</p>
    </form>
  )
}
