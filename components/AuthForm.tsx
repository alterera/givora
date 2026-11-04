'use client'

import { useActionState } from 'react'
import { loginAction, signupAction, type AuthState } from '@/lib/actions/auth'

export default function AuthForm({ next }: { next: string }) {
  const [loginState, login, loginPending] = useActionState<AuthState, FormData>(loginAction, undefined)
  const [signupState, signup, signupPending] = useActionState<AuthState, FormData>(signupAction, undefined)
  const busy = loginPending || signupPending
  const error = loginState?.error ?? signupState?.error
  return (
    <form className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div><label className="label" htmlFor="a-email">Email</label><input id="a-email" name="email" type="email" required className="input" /></div>
      <div><label className="label" htmlFor="a-pass">Password</label><input id="a-pass" name="password" type="password" required className="input" /></div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <button formAction={login} disabled={busy} className="btn btn-primary btn-lg">{loginPending ? 'Logging in…' : 'Log in'}</button>
        <button formAction={signup} disabled={busy} className="btn btn-lg">{signupPending ? 'Creating…' : 'Sign up'}</button>
      </div>
      {error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
    </form>
  )
}
