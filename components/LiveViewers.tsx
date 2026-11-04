'use client'

import { useEffect, useState } from 'react'

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** Live "people viewing" badge. The number drifts up and down every few seconds. */
export default function LiveViewers({ seed }: { seed: string }) {
  const [n, setN] = useState<number | null>(null)
  const [bump, setBump] = useState(0)

  useEffect(() => {
    const base = 9 + (hash(seed) % 31) // 9–39, stable per piece
    let cur = base + Math.floor(Math.random() * 6) - 2
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const step = Math.random() < 0.5 ? -1 : 1
      const pull = cur > base + 7 ? -1 : cur < base - 5 ? 1 : step
      cur = Math.max(3, cur + pull * (Math.random() < 0.2 ? 2 : 1))
      setN(cur); setBump((b) => b + 1)
      timer = setTimeout(tick, 2800 + Math.random() * 4200)
    }
    timer = setTimeout(() => { setN(cur); timer = setTimeout(tick, 2500) }, 0)
    return () => clearTimeout(timer)
  }, [seed])

  return (
    <div className="glow-box flex items-center gap-3 px-3.5 py-2.5" role="status" aria-live="polite">
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inset-0 rounded-full bg-[var(--g)]" style={{ animation: 'live-ping 1.8s ease-out infinite' }} />
        <span className="relative size-2.5 rounded-full bg-[var(--g)]" />
      </span>
      <p className="min-w-0 text-sm leading-tight">
        <span key={bump} className="mono inline-block min-w-[2ch] text-lg font-semibold text-[var(--g)]" style={{ animation: 'tick .35s ease-out' }}>{n ?? '··'}</span>
        <span className="ml-2 text-[#b9d9cb]">collectors viewing now</span>
      </p>
      <span className="mono ml-auto hidden shrink-0 text-[10px] tracking-widest text-[#4f8f72] min-[420px]:inline">LIVE</span>
    </div>
  )
}
