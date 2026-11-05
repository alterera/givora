'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction, type AuthState } from '@/lib/actions/auth'

export default function AuthForm({ next, notice }: { next: string; notice?: string }) {
  const [state, login, pending] = useActionState<AuthState, FormData>(loginAction, undefined)
  const q = next !== '/profile' ? `?next=${encodeURIComponent(next)}` : ''
  return (
    <form action={login} className="flex flex-col gap-4">
      {notice && <p role="status" className="glow-box p-3 text-sm text-[#b9d9cb]">{notice}</p>}
      <input type="hidden" name="next" value={next} />
      <div><label className="label" htmlFor="a-email">Email</label><input id="a-email" name="email" type="email" autoComplete="email" required className="input" /></div>
      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="a-pass">Password</label>
          <Link href="/forgot-password" className="mb-1.5 text-xs text-[#6fa88f] hover:text-[var(--g)]">Forgot password?</Link>
        </div>
        <input id="a-pass" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <button disabled={pending} className="btn btn-primary btn-lg mt-2">{pending ? 'Logging in…' : 'Log in'}</button>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
      <p className="text-center text-sm text-[#8f8f8f]">New here? <Link href={`/signup${q}`} className="text-[var(--g)] hover:underline">Create an account</Link></p>
    </form>
  )
}
