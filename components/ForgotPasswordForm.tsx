'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestResetAction, type ResetState } from '@/lib/actions/password'

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestResetAction, undefined)
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="f-email">Email</label>
        <input id="f-email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} className="input" />
      </div>
      <button disabled={pending} className="btn btn-primary btn-lg">{pending ? 'Sending code…' : 'Send reset code'}</button>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
      <p className="text-center text-sm text-[#8f8f8f]">Remembered it? <Link href="/login" className="text-[var(--g)] hover:underline">Log in</Link></p>
    </form>
  )
}
