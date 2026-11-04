'use client'

import { useState } from 'react'

export default function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex">
        <input readOnly value={value} className="input mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn -ml-px shrink-0" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
