'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CertificateLookup() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const digits = value.trim().toUpperCase().replace(/^GIV-?/, '')
    if (!/^\d{1,8}$/.test(digits)) { setError('Enter a serial such as GIV-0042.'); return }
    router.push(`/certificate/GIV-${digits.padStart(4, '0')}`)
  }

  return (
    <form onSubmit={submit} className="glow-box flex flex-col gap-3 p-5 sm:p-6">
      <label htmlFor="serial" className="label">Piece serial</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="serial" value={value} onChange={(e) => { setValue(e.target.value); setError('') }} placeholder="GIV-0042" autoComplete="off" spellCheck={false} className="input mono" />
        <button className="btn btn-primary sm:px-6">Check certificate</button>
      </div>
      <p role="alert" className="min-h-5 text-sm text-red-300">{error}</p>
    </form>
  )
}
