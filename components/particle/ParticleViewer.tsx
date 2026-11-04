'use client'

import { useEffect, useRef, useState } from 'react'
import { createParticleViewer, type ViewerApi, type ViewerConfig } from '@/lib/particle/runtime'

export type ParticleViewerProps = {
  assetUrl: string
  assetType: 'bin' | 'image' | 'cloud'
  palette: string[]
  config?: Partial<ViewerConfig>
  maxParticles?: number
  interactive?: boolean
  intro?: boolean
  seed?: number
  serial?: string
  owner?: boolean
  onReady?: (api: ViewerApi | null) => void
  /** Only hold a WebGL context while on screen (browsers cap contexts at ~16). */
  lazy?: boolean
  className?: string
}

export default function ParticleViewer({
  assetUrl, assetType, palette, config, maxParticles, interactive, intro, seed, serial, owner, onReady, lazy, className,
}: ParticleViewerProps) {
  const host = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [onScreen, setOnScreen] = useState(!lazy)
  const key = JSON.stringify([assetUrl, assetType, palette, config, maxParticles, interactive, intro, seed, serial, owner])

  useEffect(() => {
    if (!lazy || !host.current) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '200px' })
    io.observe(host.current)
    return () => io.disconnect()
  }, [lazy])

  useEffect(() => {
    const container = host.current
    if (!container || !onScreen) return
    // A fresh canvas per run: a canvas whose WebGL context was force-lost can never get a new one.
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'width:100%;height:100%;display:block;opacity:0;transition:opacity 900ms ease'
    container.appendChild(canvas)
    let viewer: ReturnType<typeof createParticleViewer> | null = null
    const fade = setTimeout(() => { canvas.style.opacity = '1'; setReady(true) }, 120)
    try {
      viewer = createParticleViewer(canvas, {
        assetUrl, assetType, palette, config, maxParticles, interactive, intro, seed, serial, owner, onReady, onError: setError,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'WebGL is not available'
      queueMicrotask(() => setError(message))
    }
    return () => {
      clearTimeout(fade)
      viewer?.dispose()
      canvas.remove()
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, onScreen])

  return (
    <div className={`${className?.includes('absolute') ? '' : 'relative '}${className ?? ''}`} style={{ background: config?.backgroundColor ?? '#000' }}>
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
      {!ready && !error && <div className="particle-skeleton" aria-hidden />}
      {error && <p className="absolute inset-0 grid place-items-center px-6 text-center text-xs text-red-300">{error}</p>}
    </div>
  )
}
