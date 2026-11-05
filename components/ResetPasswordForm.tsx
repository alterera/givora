'use client'

import { useActionState, useState } from 'react'
import { EnvelopeSimpleIcon, HashIcon } from '@phosphor-icons/react'
import { resetPasswordAction, type ResetState } from '@/lib/actions/password'
import Field from '@/components/auth/Field'
import PasswordFields from '@/components/auth/PasswordFields'
import ResendCode from '@/components/auth/ResendCode'

export default function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPasswordAction, undefined)
  const [mail, setMail] = useState(email)
  const [valid, setValid] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <Field id="r-email" name="email" type="email" label="Email" autoComplete="email" required value={mail} onChange={(e) => setMail(e.target.value)} icon={<EnvelopeSimpleIcon />} />
        <Field
          id="r-code" name="code" label="6-digit code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required placeholder="······"
          className="mono tracking-[.4em]" icon={<HashIcon />}
        />
        <PasswordFields idPrefix="r" passLabel="New password" onValidChange={setValid} />
        <button disabled={pending || !valid} className="btn btn-primary btn-lg disabled:opacity-50">{pending ? 'Updating…' : 'Set new password'}</button>
        {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
      </form>
      <ResendCode email={mail} />
    </div>
  )
}
