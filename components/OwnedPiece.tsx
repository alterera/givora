'use client'

import { useRef, useState } from 'react'
import ProductViewer from '@/components/particle/ProductViewer'
import type { ParticleViewerProps } from '@/components/particle/ParticleViewer'
import type { ViewerApi } from '@/lib/particle/runtime'

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

/**
 * The owner's live view: collector-only effect plus unlocks (high-resolution still, 6 s loop).
 * Note: these are conveniences for owners, not DRM. The artwork file itself is public by design.
 */
export default function OwnedPiece({ viewer, serial }: { viewer: ParticleViewerProps; serial: string }) {
  const api = useRef<ViewerApi | null>(null)
  const [busy, setBusy] = useState<'' | 'still' | 'loop'>('')
  const [error, setError] = useState('')

  async function still() {
    if (!api.current) return
    setBusy('still'); setError('')
    try { save(await api.current.capture(4096, 4096), `${serial}-4096.png`) }
    catch (e) { setError(e instanceof Error ? e.message : 'Capture failed') }
    setBusy('')
  }
  async function loop() {
    if (!api.current) return
    setBusy('loop'); setError('')
    try { save(await api.current.recordLoop(6), `${serial}-loop.webm`) }
    catch (e) { setError(e instanceof Error ? e.message : 'Recording failed') }
    setBusy('')
  }

  return (
    <div>
      <div className="relative aspect-[4/5] border-b border-[var(--line)]">
        <ProductViewer {...viewer} owner interactive onReady={(a) => { api.current = a }} className="absolute inset-0" />
        <span className="badge badge-live absolute left-3 top-3">COLLECTOR VIEW</span>
        {busy === 'loop' && <span className="badge absolute right-3 top-3 animate-pulse">● RECORDING 6s</span>}
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        <button className="btn" onClick={still} disabled={!!busy}>{busy === 'still' ? 'Rendering…' : 'Download 4096px still'}</button>
        <button className="btn" onClick={loop} disabled={!!busy}>{busy === 'loop' ? 'Recording…' : 'Record 6s loop'}</button>
      </div>
      {error && <p className="px-3 pb-3 text-xs text-red-300">{error}</p>}
    </div>
  )
}
