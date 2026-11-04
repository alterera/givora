'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Fades and lifts its children in the first time they scroll into view. */
export default function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.disconnect() }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={`rv ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}
