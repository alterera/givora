'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { createAdminClient } from '@/lib/supabase-admin'
import type { AuthState } from './auth'
import { checkPassword, PASSWORD_ERROR } from '@/lib/password-rules'

export async function redeemAction(_: AuthState, form: FormData): Promise<AuthState> {
  const token = String(form.get('token') ?? '')
  const mode = String(form.get('mode') ?? 'signup')
  const supabase = await createClient()

  let { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    if (!email || !password) return { error: 'Email and password are required.' }
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      user = data.user
    } else {
      if (!checkPassword(password).ok) return { error: PASSWORD_ERROR }
      if (password !== String(form.get('confirm_password') ?? password)) return { error: 'The two passwords do not match.' }
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }
      if (!data.session) return { error: 'Email confirmation is on in Supabase; disable "Confirm email" for now.' }
      user = data.user
    }
  }
  if (!user) return { error: 'Could not sign in.' }

  const { data: productId, error } = await createAdminClient().rpc('claim_edition', { p_token: token, p_user: user.id })
  if (error) return { error: 'Something went wrong. Try again.' }
  if (!productId) return { error: 'This gift has already been redeemed or the link is invalid.' }
  redirect('/profile')
}
