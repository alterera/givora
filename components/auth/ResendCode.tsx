'use client'

import { useEffect, useState, useTransition } from 'react'
import { resendCodeAction } from '@/lib/actions/password'

const COOLDOWN = 60 // keep in step with RESEND_SECONDS in lib/actions/password.ts

/** "Send a new code" with a visible countdown. The first code was just sent, so the timer starts running immediately. */
export default function ResendCode({ email }: { email: string }) {
  const [left, setLeft] = useState(COOLDOWN)
  const [sent, setSent] = useState(false)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  const disabled = left > 0 || pending || !email
  return (
    <p className="text-center text-sm text-[#8f8f8f]" aria-live="polite">
      Didn’t get it?{' '}
      <button
        type="button"
        disabled={disabled}
        onClick={() => start(async () => { await resendCodeAction(email); setSent(true); setLeft(COOLDOWN) })}
        className="text-[var(--g)] enabled:hover:underline disabled:cursor-not-allowed disabled:text-[#5a5a5a]"
      >
        {pending ? 'Sending…' : left > 0 ? `Resend in ${String(Math.floor(left / 60))}:${String(left % 60).padStart(2, '0')}` : 'Resend code'}
      </button>
      {sent && left > 0 && <span className="block pt-1 text-xs text-[#6fa88f]">A new code is on its way.</span>}
    </p>
  )
}
