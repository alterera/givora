'use client'

import { useEffect, useState } from 'react'

const BARS = 18

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** Live viewer readout: a steady count, an activity trace, and a quiet status line. */
export default function LiveViewers({ seed }: { seed: string }) {
  const [n, setN] = useState<number | null>(null)
  const [trace, setTrace] = useState<number[]>(() => Array(BARS).fill(0.25))
  const [bump, setBump] = useState(0)

  useEffect(() => {
    const base = 9 + (hash(seed) % 31) // stable range per piece
    let cur = base + Math.floor(Math.random() * 5) - 2
    let timer: ReturnType<typeof setTimeout>
    const span = 8
    const level = (v: number) => Math.min(1, Math.max(0.12, (v - (base - span / 2)) / span))

    const tick = () => {
      const drift = cur > base + 6 ? -1 : cur < base - 5 ? 1 : Math.random() < 0.5 ? -1 : 1
      cur = Math.max(3, cur + (Math.random() < 0.6 ? drift : 0)) // often holds steady, like real traffic
      setN(cur)
      setBump((b) => b + 1)
      setTrace((t) => [...t.slice(1), level(cur)])
      timer = setTimeout(tick, 3200 + Math.random() * 4800)
    }
    timer = setTimeout(() => {
      setN(cur)
      setTrace(Array.from({ length: BARS }, (_, i) => level(base + Math.sin(i * 0.9 + (hash(seed) % 7)) * 2.4)))
      timer = setTimeout(tick, 3000)
    }, 0)
    return () => clearTimeout(timer)
  }, [seed])

  return (
    <div className="relative flex items-stretch overflow-hidden border border-[#12392a] bg-[#030a07]" role="status" aria-live="polite" aria-label={n ? `${n} people viewing this piece now` : 'Loading viewers'}>
      <span aria-hidden className="w-0.5 shrink-0 bg-[var(--g)] shadow-[0_0_14px_var(--g)]" />
      <div className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3">
        <div className="min-w-[3.25rem]">
          <p className="mono flex items-center gap-1.5 text-[9px] font-medium tracking-[.22em] text-[#4f8f72]">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-[var(--g)]" style={{ animation: 'live-ping 2s ease-out infinite' }} />
              <span className="relative size-1.5 rounded-full bg-[var(--g)]" />
            </span>
            LIVE
          </p>
          <p key={bump} className="mono mt-0.5 text-3xl font-semibold leading-none tabular-nums text-white" style={{ animation: 'tick .4s ease-out' }}>{n ?? '–'}</p>
        </div>
        <p className="min-w-0 text-[13px] leading-snug text-[#8fb3a2]">
          people viewing<br className="max-[360px]:hidden" /> this piece now
        </p>
        <div aria-hidden className="ml-auto flex h-9 shrink-0 items-end gap-[3px]">
          {trace.map((v, i) => (
            <span
              key={i}
              className="w-[3px] rounded-[1px] bg-[var(--g)] transition-[height,opacity] duration-700 ease-out"
              style={{ height: `${Math.round(v * 100)}%`, opacity: 0.25 + (i / BARS) * 0.75 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
