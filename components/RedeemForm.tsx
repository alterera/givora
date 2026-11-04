'use client'

import { useActionState, useState } from 'react'
import { redeemAction } from '@/lib/actions/redeem'
import type { AuthState } from '@/lib/actions/auth'

export default function RedeemForm({ token, loggedInEmail }: { token: string; loggedInEmail?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(redeemAction, undefined)
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="mode" value={mode} />
      {loggedInEmail ? (
        <p className="panel p-3 text-sm text-[#a1a1a1]">Redeeming as <span className="text-white">{loggedInEmail}</span></p>
      ) : (
        <>
          <div className="flex border border-[var(--line)] text-sm">
            {(['signup', 'login'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 py-2 transition-colors ${mode === m ? 'bg-[var(--g)] text-black' : 'text-[#a1a1a1] hover:text-[var(--g)]'}`}>
                {m === 'signup' ? 'Create account' : 'I have an account'}
              </button>
            ))}
          </div>
          <div><label className="label" htmlFor="r-email">Email</label><input id="r-email" name="email" type="email" required className="input" /></div>
          <div><label className="label" htmlFor="r-pass">Password</label><input id="r-pass" name="password" type="password" required className="input" /></div>
        </>
      )}
      <button disabled={pending} className="btn btn-primary btn-lg">
        {pending ? 'Redeeming…' : loggedInEmail ? 'Redeem' : mode === 'signup' ? 'Create account & redeem' : 'Log in & redeem'}
      </button>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
    </form>
  )
}
