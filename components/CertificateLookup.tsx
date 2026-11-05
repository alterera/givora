'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const LEN = 12 // hex characters in a serial: GIV-XXXX-XXXX-XXXX

/** Reduce any input to the 12 hex characters of a serial. */
const toHex = (v: string) => v.toUpperCase().replace(/^\s*GIV[-\s]?/, '').replace(/[^0-9A-F]/g, '').slice(0, LEN)
const format = (hex: string) => (hex ? `GIV-${hex.match(/.{1,4}/g)!.join('-')}` : '')

export default function CertificateLookup() {
  const router = useRouter()
  const [hex, setHex] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (hex.length !== LEN) { setError(`A serial has ${LEN} hex characters. You have entered ${hex.length}.`); return }
    setBusy(true)
    router.push(`/certificate/${format(hex)}`)
  }

  const pct = (hex.length / LEN) * 100

  return (
    <form onSubmit={submit} className="terminal relative overflow-hidden" aria-label="Certificate lookup">
      <div className="flex items-center justify-between border-b border-[#0f2a1e] px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden><span className="size-2 rounded-full bg-[#1c3a2d]" /><span className="size-2 rounded-full bg-[#1c3a2d]" /><span className="size-2 rounded-full bg-[var(--g)]" /></div>
        <span className="mono text-[10px] tracking-[.2em] text-[#4f8f72]">RESOLVER · ATTESTATION v1</span>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <label htmlFor="serial" className="mono text-xs text-[#6fa88f]"><span className="text-[var(--g)]">$</span> givora resolve --serial</label>
        <input
          id="serial"
          value={format(hex)}
          onChange={(e) => { setHex(toHex(e.target.value)); setError('') }}
          placeholder="GIV-XXXX-XXXX-XXXX"
          autoComplete="off" autoCapitalize="characters" spellCheck={false}
          aria-describedby="serial-help"
          className="input mono h-12 text-base tracking-wider sm:text-lg"
        />
        <div id="serial-help" className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#0f2a1e]"><div className="h-px bg-[var(--g)] shadow-[0_0_8px_var(--g)] transition-all duration-300" style={{ width: `${pct}%` }} /></div>
          <span className="mono text-[10px] tabular-nums text-[#4f8f72]">{hex.length}/{LEN} HEX</span>
        </div>
        <p role="alert" className="min-h-5 text-sm text-red-300">{error}</p>
        <button disabled={busy} className="btn btn-primary btn-lg w-full sm:w-fit sm:px-8">{busy ? 'Resolving…' : 'Resolve certificate →'}</button>
      </div>
    </form>
  )
}
