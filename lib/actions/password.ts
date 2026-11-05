'use server'

import crypto from 'node:crypto'
import { after } from 'next/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendOtpEmail } from '@/lib/email'
import { checkPassword, PASSWORD_ERROR } from '@/lib/password-rules'

export type ResetState = { error?: string; values?: { email?: string } } | undefined

const OTP_MINUTES = 10
const MAX_ATTEMPTS = 5
const MAX_REQUESTS_PER_HOUR = 5
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Keyed hash, so a leaked table row cannot be turned back into a code without the server secret. */
const hashCode = (email: string, code: string) =>
  crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-only').update(`${email}:${code}`).digest('hex')

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

const RESEND_SECONDS = 60

/** Creates and e-mails a code if the account exists. Silent in every other case (no account, rate limit, cooldown). */
async function issueCode(email: string) {
  const db = createAdminClient()
  const { data: profile } = await db.from('profiles').select('id').eq('email', email).maybeSingle() // exact match: no wildcard lookups
  if (!profile) return
  const since = new Date(Date.now() - 3600_000).toISOString()
  const { data: recent } = await db.from('password_resets').select('created_at').eq('email', email).gte('created_at', since).order('created_at', { ascending: false })
  const latest = recent?.[0]?.created_at ? new Date(recent[0].created_at).getTime() : 0
  if (Date.now() - latest < RESEND_SECONDS * 1000 - 2000) return // cooldown, enforced here as well as in the UI
  if ((recent?.length ?? 0) >= MAX_REQUESTS_PER_HOUR) return
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  const { error } = await db.from('password_resets').insert({
    email, code_hash: hashCode(email, code), expires_at: new Date(Date.now() + OTP_MINUTES * 60_000).toISOString(),
  })
  if (error) { console.error('[reset] could not store code:', error.message); return }
  after(() => sendOtpEmail(email, code, OTP_MINUTES))
  after(async () => { // housekeeping: forget codes older than a day
    await db.from('password_resets').delete().lt('created_at', new Date(Date.now() - 86_400_000).toISOString())
  })
}

/** Step 1: e-mail a 6-digit code. Always behaves the same, so it cannot be used to discover which e-mails have accounts. */
export async function requestResetAction(_: ResetState, form: FormData): Promise<ResetState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 120) return { error: 'Enter a valid email address.', values: { email } }
  await issueCode(email)
  redirect(`/reset-password?email=${encodeURIComponent(email)}`)
}

/** "Send a new code" on the reset page: same behaviour, but stays on the page. */
export async function resendCodeAction(email: string): Promise<{ ok: boolean }> {
  const clean = String(email ?? '').trim().toLowerCase()
  if (!EMAIL.test(clean) || clean.length > 120) return { ok: false }
  await issueCode(clean)
  return { ok: true }
}

/** Step 2: check the code and set the new password. */
export async function resetPasswordAction(_: ResetState, form: FormData): Promise<ResetState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const code = String(form.get('code') ?? '').replace(/\D/g, '')
  const password = String(form.get('password') ?? '')
  const confirm = String(form.get('confirm_password') ?? '')
  const fail = (error: string): ResetState => ({ error, values: { email } })

  if (!EMAIL.test(email)) return fail('Enter a valid email address.')
  if (code.length !== 6) return fail('Enter the 6-digit code from the email.')
  if (!checkPassword(password).ok) return fail(PASSWORD_ERROR)
  if (password !== confirm) return fail('The two passwords do not match.')

  const db = createAdminClient()
  const { data: row } = await db.from('password_resets').select('id, code_hash, attempts')
    .eq('email', email).is('consumed_at', null).gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  const invalid = 'That code is wrong or has expired. Request a new one.'
  if (!row) return fail(invalid)
  if (row.attempts >= MAX_ATTEMPTS) return fail('Too many wrong attempts. Request a new code.')

  if (!same(row.code_hash, hashCode(email, code))) {
    await db.from('password_resets').update({ attempts: row.attempts + 1 }).eq('id', row.id)
    return fail(invalid)
  }

  const { data: profile } = await db.from('profiles').select('id').eq('email', email).maybeSingle()
  if (!profile) return fail(invalid)
  const { error } = await db.auth.admin.updateUserById(profile.id, { password })
  if (error) return fail(error.message)

  await db.from('password_resets').update({ consumed_at: new Date().toISOString() }).eq('email', email).is('consumed_at', null)
  redirect('/login?reset=1')
}
