'use client'

import { useEffect, useState } from 'react'
import ProductViewer from '@/components/particle/ProductViewer'
import type { ParticleViewerProps } from '@/components/particle/ParticleViewer'

const OCCASION_LABEL: Record<string, string> = {
  birthday: 'Happy birthday',
  'thank-you': 'Thank you',
  anniversary: 'Happy anniversary',
  'just-because': 'Just because',
}

type Props = {
  /** 'gift' = a recipient opening something sent to them; 'purchase' = a buyer unboxing their own purchase. */
  mode?: 'gift' | 'purchase'
  viewer: ParticleViewerProps
  title: string
  artist: string
  serial: string | null
  sender?: string | null
  message?: string | null
  occasion?: string | null
  /** Shown to purchasers, e.g. "₹24,500". */
  price?: string | null
  children: React.ReactNode
}

// Deterministic confetti (no Math.random during render): index → position, colour, timing.
const CONFETTI = Array.from({ length: 34 }, (_, i) => ({
  left: 8 + ((i * 53) % 84),
  dx: ((i * 37) % 120) - 60,
  rot: 180 + ((i * 71) % 540),
  delay: (i % 9) * 0.06,
  dur: 1.5 + (i % 5) * 0.22,
  size: 5 + (i % 4) * 2,
  color: ['#19ffa0', '#8dcaff', '#ffffff', '#1456ff', '#7dffc9'][i % 5],
}))

function Crate({ stage, gift }: { stage: 'sealed' | 'opening'; gift: boolean }) {
  const opening = stage === 'opening'
  return (
    <div className="relative grid size-56 place-items-center sm:size-64" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border border-[var(--g)]/40"
          style={{ animation: `gift-ring ${opening ? 0.9 : 3.2}s ease-out ${opening ? 0 : i * 1.05}s ${opening ? 1 : 'infinite'} both` }}
        />
      ))}
      <div className="relative size-36 sm:size-40" style={{ animation: opening ? undefined : 'gift-float 4.2s ease-in-out infinite' }}>
        {/* body */}
        <div className="absolute inset-x-0 bottom-0 top-[26%] border border-[var(--g)]/60 bg-[linear-gradient(160deg,#06140e,#020604)] shadow-[0_0_60px_-10px_rgba(25,255,160,.55)]">
          <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-[var(--g)]/80" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--g)]/20" />
          <span className="mono absolute bottom-2 left-2 text-[9px] tracking-widest text-[var(--g)]/70">1 / 1</span>
        </div>
        {/* lid */}
        <div
          className="absolute inset-x-[-6%] top-[10%] h-[22%] border border-[var(--g)] bg-[#031009]"
          style={{ animation: opening ? 'gift-lid .8s cubic-bezier(.5,0,.8,.4) forwards' : undefined }}
        >
          <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-[var(--g)]" />
          {/* bow */}
          <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 gap-0.5">
            <span className="size-4 -rotate-12 rounded-full border border-[var(--g)] bg-black" />
            <span className="size-4 rotate-12 rounded-full border border-[var(--g)] bg-black" />
          </div>
        </div>
        {opening && <span className="absolute inset-0 m-auto size-24 rounded-full bg-[var(--g)]" style={{ animation: 'gift-flash .9s ease-out forwards' }} />}
      </div>
      {opening && gift && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 h-0">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                left: `${c.left}%`, width: c.size, height: c.size * 1.6, background: c.color,
                ['--dx' as string]: `${c.dx}px`, ['--rot' as string]: `${c.rot}deg`,
                animation: `confetti-fall ${c.dur}s cubic-bezier(.2,.6,.4,1) ${c.delay}s both`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Opening experience. Sealed → (tap) → lid lifts, flash → the artwork morphs in beside the claim form.
 * Used for gifts (with the sender's note) and for a buyer unboxing their own purchase.
 */
export default function GiftReveal({ mode = 'gift', viewer, title, artist, serial, sender, message, occasion, price, children }: Props) {
  const gift = mode === 'gift'
  const [stage, setStage] = useState<'sealed' | 'opening' | 'open'>('sealed')
  const from = sender || 'Someone who thinks of you'

  useEffect(() => {
    if (stage !== 'opening') return
    const t = setTimeout(() => setStage('open'), 1150)
    return () => clearTimeout(t)
  }, [stage])

  if (stage !== 'open') {
    return (
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-7 py-10 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(50%_50%_at_50%_40%,rgba(25,255,160,.16),transparent_70%)]" />
        <div className="reveal"><Crate stage={stage} gift={gift} /></div>
        <div className="reveal d1" style={{ opacity: stage === 'opening' ? 0.25 : undefined, transition: 'opacity .4s' }}>
          <p className="eyebrow mb-3">{gift ? (occasion ? OCCASION_LABEL[occasion] : 'A gift for you') : 'Payment successful · 1 of 1'}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {gift ? <>{from} sent you a piece of art.</> : 'Your piece is sealed and ready.'}
          </h1>
          <p className="mt-3 text-[#a1a1a1]">
            {gift ? 'One of a kind. Yours to keep, show or pass on.' : 'Unbox it, then add it to your collection.'}
          </p>
        </div>
        <button disabled={stage === 'opening'} onClick={() => setStage('opening')} className="btn btn-primary btn-lg reveal d2 min-w-48 disabled:opacity-60">
          {gift ? 'Unwrap your gift' : 'Unbox your piece'}
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
      <div className="pop-in relative aspect-square border border-[var(--g)]/30 shadow-[0_0_80px_-20px_rgba(25,255,160,.45)]">
        <ProductViewer {...viewer} intro interactive className="absolute inset-0" />
      </div>
      <div className="flex flex-col gap-5">
        <div className="pop-in" style={{ animationDelay: '.25s' }}>
          <p className="eyebrow mb-3">{gift ? `A gift from ${from}` : 'Unboxed'}{serial ? ` · ${serial}` : ''}</p>
          <h1 className="text-4xl font-semibold tracking-tighter">{title}</h1>
          <p className="mt-1 text-[#a1a1a1]">by {artist}{price ? ` · ${price}` : ''}</p>
        </div>

        {gift && message && (
          <blockquote className="pop-in glow-box relative p-5 text-[#d9eee4]" style={{ animationDelay: '.55s' }}>
            <span aria-hidden className="absolute -top-3 left-4 bg-black px-2 text-2xl leading-none text-[var(--g)]">&ldquo;</span>
            <p className="whitespace-pre-line leading-relaxed">{message}</p>
            <footer className="mono mt-3 text-xs text-[#6fa88f]">— {from}</footer>
          </blockquote>
        )}

        <ol className="pop-in flex items-center gap-3 text-xs" style={{ animationDelay: '.8s' }}>
          <li className="flex items-center gap-2 text-[var(--g)]"><span className="grid size-5 place-items-center border border-[var(--g)] text-[10px]">✓</span>{gift ? 'Unwrapped' : 'Unboxed'}</li>
          <span aria-hidden className="h-px w-8 bg-[var(--line-strong)]" />
          <li className="flex items-center gap-2 text-white"><span className="grid size-5 place-items-center bg-[var(--g)] text-[10px] text-black">2</span>{gift ? 'Keep it' : 'Add to your collection'}</li>
        </ol>

        <div className="pop-in" style={{ animationDelay: '1s' }}>
          <p className="mb-3 text-sm text-[#8f8f8f]">
            {gift
              ? `${from} will be recorded in its provenance as the person who gave it to you. It is free to keep: just sign in or create an account.`
              : 'Sign in or create an account to attach this piece to you. Until you do, anyone with this page’s link could claim it, so do it now.'}
          </p>
          {children}
        </div>
      </div>
    </div>
  )
}
