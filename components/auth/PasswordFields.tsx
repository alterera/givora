'use client'

import { useState } from 'react'
import { CheckIcon, CircleIcon, EyeIcon, EyeSlashIcon, LockKeyIcon } from '@phosphor-icons/react'
import Field from '@/components/auth/Field'
import { checkPassword } from '@/lib/password-rules'

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = ['#3a3a3a', '#ff5d5d', '#ffb84d', '#c8f35a', '#19ffa0']

/**
 * New-password + confirm pair with a live checklist, strength bar and match check.
 * `onValidChange` lets the parent disable its submit button until the password is acceptable.
 */
export default function PasswordFields({
  idPrefix, passLabel = 'Password', confirmLabel = 'Confirm', onValidChange,
}: { idPrefix: string; passLabel?: string; confirmLabel?: string; onValidChange?: (ok: boolean) => void }) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const { results, score } = checkPassword(pass)
  const matches = confirm.length > 0 && confirm === pass

  const emit = (p: string, c: string) => onValidChange?.(checkPassword(p).ok && p === c && c.length > 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${idPrefix}-pass`} name="password" type={show ? 'text' : 'password'} label={passLabel} autoComplete="new-password" required icon={<LockKeyIcon />}
          value={pass} onChange={(e) => { setPass(e.target.value); emit(e.target.value, confirm) }}
          aria-describedby={`${idPrefix}-rules`}
        />
        <Field
          id={`${idPrefix}-confirm`} name="confirm_password" type={show ? 'text' : 'password'} label={confirmLabel} autoComplete="new-password" required icon={<LockKeyIcon />}
          value={confirm} onChange={(e) => { setConfirm(e.target.value); emit(pass, e.target.value) }}
          aria-invalid={confirm.length > 0 && !matches}
        />
      </div>

      <div id={`${idPrefix}-rules`} aria-live="polite" className={pass ? 'block' : 'hidden'}>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-1 flex-1 transition-colors duration-300" style={{ background: i < score ? COLORS[score] : '#1f1f1f' }} />
            ))}
          </div>
          <span className="mono w-16 text-right text-[10px] uppercase tracking-wider" style={{ color: COLORS[score] }}>{LABELS[score]}</span>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {results.map((r) => (
            <li key={r.id} className={`flex items-center gap-1.5 text-xs transition-colors ${r.pass ? 'text-[var(--g)]' : 'text-[#6b6b6b]'}`}>
              {r.pass ? <CheckIcon weight="bold" className="size-3" /> : <CircleIcon className="size-3" />}
              {r.label}{!r.required && <span className="text-[#4a4a4a]"> (bonus)</span>}
            </li>
          ))}
          <li className={`flex items-center gap-1.5 text-xs transition-colors ${matches ? 'text-[var(--g)]' : confirm ? 'text-red-400' : 'text-[#6b6b6b]'}`}>
            {matches ? <CheckIcon weight="bold" className="size-3" /> : <CircleIcon className="size-3" />}Passwords match
          </li>
        </ul>
      </div>
      <button type="button" onClick={() => setShow((s) => !s)} className="flex w-fit items-center gap-1.5 text-xs text-[#6b6b6b] hover:text-[var(--g)]">
        {show ? <EyeSlashIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}{show ? 'Hide' : 'Show'} passwords
      </button>
    </div>
  )
}
