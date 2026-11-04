'use client'

import { useActionState, useEffect, useState } from 'react'
import { load } from '@cashfreepayments/cashfree-js'
import { startCheckout, type CheckoutState } from '@/lib/actions/checkout'

const OCCASIONS = [
  ['birthday', 'Birthday'],
  ['thank-you', 'Thank you'],
  ['anniversary', 'Anniversary'],
  ['just-because', 'Just because'],
] as const

export default function CheckoutForm({ slug, mode, giftDefault = false }: { slug: string; mode: 'sandbox' | 'production'; giftDefault?: boolean }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, undefined)
  const [gift, setGift] = useState(giftDefault)
  const [occasion, setOccasion] = useState('')
  const [message, setMessage] = useState('')
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
      {gift && <input type="hidden" name="gift" value="on" />}
      <input type="hidden" name="occasion" value={occasion} />

      <div className="grid grid-cols-2 border border-[var(--line)] text-sm" role="tablist" aria-label="Who is this for?">
        {[[false, 'For me'], [true, 'As a gift']].map(([v, label]) => (
          <button
            key={String(v)} type="button" role="tab" aria-selected={gift === v}
            onClick={() => setGift(v as boolean)}
            className={`py-2.5 transition-colors ${gift === v ? 'bg-white text-black' : 'text-[#a1a1a1] hover:text-white'}`}
          >{label as string}</button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="email">Your email</label>
        <input id="email" name="email" type="email" placeholder="you@example.com" required className="input" />
        <p className="mt-1.5 text-xs text-[#6b6b6b]">We send your receipt here. No account needed to pay.</p>
      </div>

      <div className={`grid transition-all duration-500 ${gift ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="panel flex flex-col gap-5 p-5" inert={!gift}>
            <div>
              <p className="label">What is the occasion?</p>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map(([id, label]) => (
                  <button
                    key={id} type="button" onClick={() => setOccasion(occasion === id ? '' : id)}
                    className={`border px-3 py-1.5 text-sm transition-colors ${occasion === id ? 'border-white bg-white text-black' : 'border-[var(--line-strong)] text-[#a1a1a1] hover:text-white'}`}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="sender_name">From (your name)</label><input id="sender_name" name="sender_name" maxLength={60} placeholder="Asha" className="input" /></div>
              <div><label className="label" htmlFor="recipient">Recipient email (optional)</label><input id="recipient" name="recipient" type="email" placeholder="friend@example.com" className="input" /></div>
            </div>
            <div>
              <label className="label" htmlFor="message">A personal note <span className="text-[#5f5f5f]">({message.length}/280)</span></label>
              <textarea id="message" name="message" rows={3} maxLength={280} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Happy birthday. I thought you would like something no one else can own." className="input" />
            </div>
            <p className="text-xs text-[#6b6b6b]">Your name stays in the piece&rsquo;s provenance as the person who gave it. The note is shown only to the recipient.</p>
          </div>
        </div>
      </div>

      <button disabled={busy} className="btn btn-primary btn-lg w-full">{busy ? 'Opening secure payment…' : gift ? 'Pay and create gift' : 'Pay now'}</button>
      {(state?.error || payError) && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state?.error ?? payError}</p>}
      <p className="text-center text-xs text-[#6b6b6b]">Payments are processed by Cashfree. You are redirected to complete payment.</p>
    </form>
  )
}
