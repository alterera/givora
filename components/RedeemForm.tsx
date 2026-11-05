'use client'

import { useActionState, useState } from 'react'
import { EnvelopeSimpleIcon, LockKeyIcon } from '@phosphor-icons/react'
import { redeemAction } from '@/lib/actions/redeem'
import type { AuthState } from '@/lib/actions/auth'
import Field from '@/components/auth/Field'
import PasswordFields from '@/components/auth/PasswordFields'

export default function RedeemForm({ token, loggedInEmail, purchase = false, defaultEmail }: { token: string; loggedInEmail?: string; purchase?: boolean; defaultEmail?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(redeemAction, undefined)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [valid, setValid] = useState(false)
  const blocked = pending || (!loggedInEmail && mode === 'signup' && !valid)
  const cta = pending ? 'Saving…' : loggedInEmail ? (purchase ? 'Add to my collection' : 'Keep this gift') : mode === 'signup' ? 'Create account & keep it' : 'Log in & keep it'
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="mode" value={mode} />
      {loggedInEmail ? (
        <p className="panel p-3 text-sm text-[#a1a1a1]">Saving to <span className="text-white">{loggedInEmail}</span></p>
      ) : (
        <>
          <div className="grid grid-cols-2 border border-[var(--line)] p-0.5 text-sm" role="tablist">
            {(['signup', 'login'] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`py-2 transition-colors ${mode === m ? 'bg-[var(--g)] text-black' : 'text-[#a1a1a1] hover:text-[var(--g)]'}`}>
                {m === 'signup' ? 'New here' : 'I have an account'}
              </button>
            ))}
          </div>
          <Field id="rd-email" name="email" type="email" label="Email" autoComplete="email" required defaultValue={defaultEmail} icon={<EnvelopeSimpleIcon />} />
          {mode === 'signup'
            ? <PasswordFields idPrefix="rd" onValidChange={setValid} />
            : <Field id="rd-pass" name="password" type="password" label="Password" autoComplete="current-password" required icon={<LockKeyIcon />} />}
        </>
      )}
      <button disabled={blocked} className="btn btn-primary btn-lg disabled:opacity-50">{cta}</button>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
    </form>
  )
}
