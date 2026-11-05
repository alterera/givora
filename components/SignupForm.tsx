'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { EnvelopeSimpleIcon, PhoneIcon, UserIcon } from '@phosphor-icons/react'
import { signupAction, type SignupState } from '@/lib/actions/auth'
import Field from '@/components/auth/Field'
import PasswordFields from '@/components/auth/PasswordFields'

export default function SignupForm({ next }: { next: string }) {
  const [state, signup, pending] = useActionState<SignupState, FormData>(signupAction, undefined)
  const [valid, setValid] = useState(false)
  const v = state?.values ?? {}
  const q = next !== '/profile' ? `?next=${encodeURIComponent(next)}` : ''
  return (
    <form action={signup} className="flex flex-col gap-3.5">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field id="s-first" name="first_name" label="First name" autoComplete="given-name" defaultValue={v.first_name} required icon={<UserIcon />} />
        <Field id="s-last" name="last_name" label="Last name" autoComplete="family-name" defaultValue={v.last_name} required icon={<UserIcon />} />
        <Field id="s-email" name="email" type="email" label="Email" autoComplete="email" defaultValue={v.email} required icon={<EnvelopeSimpleIcon />} />
        <Field id="s-phone" name="phone" type="tel" inputMode="tel" label="Phone" optional autoComplete="tel" defaultValue={v.phone} icon={<PhoneIcon />} />
      </div>
      <PasswordFields idPrefix="s" onValidChange={setValid} />
      <button disabled={pending || !valid} className="btn btn-primary btn-lg disabled:opacity-50">{pending ? 'Creating account…' : 'Create account'}</button>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
      <p className="text-center text-xs text-[#6b6b6b]">By continuing you agree to our <Link href="/terms" className="underline hover:text-[var(--g)]">Terms</Link> and <Link href="/privacy" className="underline hover:text-[var(--g)]">Privacy Policy</Link>.</p>
      <p className="text-center text-sm text-[#8f8f8f]">Already have an account? <Link href={`/login${q}`} className="text-[var(--g)] hover:underline">Log in</Link></p>
    </form>
  )
}
