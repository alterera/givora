'use client'

import { useState } from 'react'
import ProductViewer from '@/components/particle/ProductViewer'
import type { ParticleViewerProps } from '@/components/particle/ParticleViewer'

const OCCASION_LABEL: Record<string, string> = {
  birthday: 'Happy birthday',
  'thank-you': 'Thank you',
  anniversary: 'Happy anniversary',
  'just-because': 'Just because',
}

type Props = {
  viewer: ParticleViewerProps
  title: string
  artist: string
  serial: string | null
  sender: string | null
  message: string | null
  occasion: string | null
  children: React.ReactNode
}

/** The gift is wrapped until the recipient taps; unwrapping plays the piece's morph-in. */
export default function GiftReveal({ viewer, title, artist, serial, sender, message, occasion, children }: Props) {
  const [open, setOpen] = useState(false)
  const from = sender || 'Someone who thinks of you'

  if (!open) {
    return (
      <div className="reveal mx-auto flex max-w-md flex-col items-center gap-6 py-12 text-center">
        <div className="relative grid size-40 place-items-center border border-[var(--line-strong)] bg-[#050505]">
          <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--g)]/30" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--g)]/30" />
          <div className="relative size-6 rotate-45 border border-[var(--g)] bg-black" />
        </div>
        <div>
          <p className="eyebrow mb-3">{occasion ? OCCASION_LABEL[occasion] : 'A gift for you'}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{from} sent you a piece of art.</h1>
          <p className="mt-3 text-[#a1a1a1]">One of a kind. Yours to keep, show or pass on.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn btn-primary btn-lg">Unwrap your gift</button>
      </div>
    )
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
      <div className="reveal relative aspect-square border border-[var(--line)]">
        <ProductViewer {...viewer} intro interactive className="absolute inset-0" />
      </div>
      <div className="reveal d1 flex flex-col gap-5">
        <p className="eyebrow">A gift from {from}{serial ? ` · ${serial}` : ''}</p>
        <h1 className="text-4xl font-semibold tracking-tighter">{title}</h1>
        <p className="text-[#a1a1a1]">by {artist}</p>
        {message && (
          <blockquote className="panel border-l-2 border-l-white p-5 text-[#d4d4d4]">
            <p className="whitespace-pre-line leading-relaxed">&ldquo;{message}&rdquo;</p>
            <footer className="mono mt-3 text-xs text-[#8f8f8f]">{from}</footer>
          </blockquote>
        )}
        <p className="text-sm text-[#8f8f8f]">Create a free account to keep it. {from} will be recorded in its provenance as the person who gave it to you.</p>
        <div>{children}</div>
      </div>
    </div>
  )
}
