'use client'

import { useActionState, useEffect, useState } from 'react'
import { load } from '@cashfreepayments/cashfree-js'
import { startResaleCheckout, type ResaleState } from '@/lib/actions/resale'

export default function ResaleCheckoutForm({ listingId, mode, label }: { listingId: string; mode: 'sandbox' | 'production'; label: string }) {
  const [state, action, pending] = useActionState<ResaleState, FormData>(startResaleCheckout, undefined)
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
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="listing_id" value={listingId} />
      <button disabled={busy} className="btn btn-primary btn-lg w-full">{busy ? 'Opening secure payment…' : label}</button>
      {(state?.error || payError) && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state?.error ?? payError}</p>}
    </form>
  )
}
