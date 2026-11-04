'use client'

import { useState, useTransition } from 'react'
import { emailGiftAction } from '@/lib/actions/gift'

export default function CopyLink({ link, token, recipient }: { link: string; token: string; recipient?: string | null }) {
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState('')
  const [pending, start] = useTransition()
  const [to, setTo] = useState(recipient ?? '')
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="label">Redeem link</label>
        <div className="flex">
          <input readOnly value={link} className="input mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <button
            className="btn -ml-px shrink-0"
            onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
      </div>
      <div>
        <label className="label">Or email it to the recipient</label>
        <div className="flex">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="friend@example.com" type="email" className="input" />
          <button disabled={pending || !to} className="btn -ml-px shrink-0" onClick={() => start(async () => setMsg((await emailGiftAction(token, to)).message))}>
            {pending ? 'Sending…' : 'Email it'}
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-[#a1a1a1]">{msg}</p>}
      </div>
    </div>
  )
}
