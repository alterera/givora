'use client'

import { useState } from 'react'

/** Hashes a file in the browser and compares it with the minted fingerprint. Nothing is uploaded. */
export default function VerifyFile({ fingerprint, fileUrl }: { fingerprint: string; fileUrl: string }) {
  const [result, setResult] = useState<'match' | 'mismatch' | null>(null)
  const [busy, setBusy] = useState(false)

  async function check(file: File) {
    setBusy(true)
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
    setResult(hex === fingerprint ? 'match' : 'mismatch')
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="btn w-fit cursor-pointer">
        {busy ? 'Hashing…' : 'Verify an artwork file'}
        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && check(e.target.files[0])} />
      </label>
      <a href={fileUrl} download className="mono text-xs text-[#8f8f8f] link-underline w-fit">Download the minted artwork file</a>
      {result === 'match' && <p className="text-sm text-[var(--accent-glow)]">✓ Exact match. This is the minted artwork.</p>}
      {result === 'mismatch' && <p className="text-sm text-red-300">✕ Does not match the minted fingerprint.</p>}
    </div>
  )
}
