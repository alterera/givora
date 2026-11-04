'use client'

import { useEffect, useRef, useState } from 'react'

const GLYPHS = '0123456789abcdef'

/** Decodes text from random hex glyphs, on scroll-in and (optionally) whenever the nearest `.group` is hovered. */
export default function ScrambleText({ text, hover = false, className = '' }: { text: string; hover?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [out, setOut] = useState(text)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const run = () => {
      if (timer.current) clearInterval(timer.current)
      let frame = 0
      const total = 14
      timer.current = setInterval(() => {
        frame++
        const settled = Math.floor((frame / total) * text.length)
        setOut(text.split('').map((c, i) => (i < settled || c === ' ' || /[^0-9a-z]/i.test(c) ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(''))
        if (frame >= total) { clearInterval(timer.current!); setOut(text) }
      }, 40)
    }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect() } }, { threshold: 0.6 })
    io.observe(el)
    const group = hover ? el.closest('.group') : null
    group?.addEventListener('pointerenter', run)
    return () => { io.disconnect(); group?.removeEventListener('pointerenter', run); if (timer.current) clearInterval(timer.current) }
  }, [text, hover])

  return <span ref={ref} className={className} aria-label={text}>{out}</span>
}
