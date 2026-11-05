'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { resetPasswordAction, type ResetState } from '@/lib/actions/password'

export default function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPasswordAction, undefined)
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="r-email">Email</label>
        <input id="r-email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email ?? email} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="r-code">6-digit code</label>
        <input
          id="r-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required placeholder="······"
          className="input mono h-12 text-center text-xl tracking-[.5em]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="r-pass">New password</label><input id="r-pass" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" /></div>
        <div><label className="label" htmlFor="r-confirm">Confirm password</label><input id="r-confirm" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required className="input" /></div>
      </div>
      <button disabled={pending} className="btn btn-primary btn-lg">{pending ? 'Updating…' : 'Set new password'}</button>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
      <p className="text-center text-sm text-[#8f8f8f]">No code? <Link href="/forgot-password" className="text-[var(--g)] hover:underline">Send a new one</Link></p>
    </form>
  )
}
