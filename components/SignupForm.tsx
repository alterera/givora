'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signupAction, type SignupState } from '@/lib/actions/auth'

export default function SignupForm({ next }: { next: string }) {
  const [state, signup, pending] = useActionState<SignupState, FormData>(signupAction, undefined)
  const v = state?.values ?? {}
  const q = next !== '/profile' ? `?next=${encodeURIComponent(next)}` : ''
  return (
    <form action={signup} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="s-first">First name <span className="text-[var(--g)]">*</span></label><input id="s-first" name="first_name" autoComplete="given-name" defaultValue={v.first_name} required className="input" /></div>
        <div><label className="label" htmlFor="s-last">Last name <span className="text-[var(--g)]">*</span></label><input id="s-last" name="last_name" autoComplete="family-name" defaultValue={v.last_name} required className="input" /></div>
      </div>
      <div><label className="label" htmlFor="s-email">Email <span className="text-[var(--g)]">*</span></label><input id="s-email" name="email" type="email" autoComplete="email" defaultValue={v.email} required className="input" /></div>
      <div><label className="label" htmlFor="s-phone">Phone <span className="text-[#6b6b6b]">(optional)</span></label><input id="s-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v.phone} placeholder="+91 98765 43210" className="input" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="s-pass">Password <span className="text-[var(--g)]">*</span></label><input id="s-pass" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" /></div>
        <div><label className="label" htmlFor="s-confirm">Confirm password <span className="text-[var(--g)]">*</span></label><input id="s-confirm" name="confirm_password" type="password" autoComplete="new-password" minLength={8} required className="input" /></div>
      </div>
      <p className="text-xs text-[#6b6b6b]">At least 8 characters.</p>
      <button disabled={pending} className="btn btn-primary btn-lg mt-1">{pending ? 'Creating account…' : 'Create account'}</button>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
      <p className="text-center text-sm text-[#8f8f8f]">Already have an account? <Link href={`/login${q}`} className="text-[var(--g)] hover:underline">Log in</Link></p>
    </form>
  )
}
