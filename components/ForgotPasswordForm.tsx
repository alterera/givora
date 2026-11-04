'use client'

import Link from 'next/link'
import { useState } from 'react'

/** UI only for now: no reset email is sent yet. */
export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  if (sent) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <p className="glow-box p-4 text-sm text-[#b9d9cb]">If an account exists for <span className="mono text-[var(--g)]">{email}</span>, a password reset link is on its way.</p>
        <Link href="/login" className="btn btn-lg">Back to log in</Link>
      </div>
    )
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-4">
      <div><label className="label" htmlFor="f-email">Email</label><input id="f-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" /></div>
      <button className="btn btn-primary btn-lg">Send reset link</button>
      <p className="text-center text-sm text-[#8f8f8f]">Remembered it? <Link href="/login" className="text-[var(--g)] hover:underline">Log in</Link></p>
    </form>
  )
}
