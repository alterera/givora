'use client'

import { useActionState } from 'react'
import { subscribe, type SubscribeState } from '@/lib/actions/newsletter'

const PERKS = ['New drops', 'Artist updates', 'Price drops', 'Resale listings']

export default function NewsletterCta() {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, undefined)
  return (
    <div className="relative isolate overflow-hidden border border-[var(--line)] p-8 md:p-14">
      <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <p className="eyebrow mb-3">Stay in the loop</p>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">Be first to see what drops next.</h2>
          <p className="mt-3 max-w-md text-[#a1a1a1]">Get an email when new pieces are minted, when the artist shares something, when prices move and when owners list a piece for resale.</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {PERKS.map((t) => <li key={t} className="badge">{t}</li>)}
          </ul>
        </div>
        <form action={action} className="flex flex-col gap-3">
          <label htmlFor="nl-email" className="label">Email address</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="input" />
            <button className="btn btn-primary" disabled={pending}>{pending ? 'Subscribing…' : 'Subscribe'}</button>
          </div>
          <p role="status" className={`min-h-5 text-sm ${state?.ok ? 'text-[var(--accent-glow)]' : 'text-red-300'}`}>{state?.message}</p>
          <p className="text-xs text-[#6b6b6b]">No spam. Unsubscribe any time.</p>
        </form>
      </div>
    </div>
  )
}
