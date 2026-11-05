'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { checkPassword, PASSWORD_ERROR } from '@/lib/password-rules'

export type AuthState = { error?: string } | undefined

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === 'string' ? v : ''
  return s.startsWith('/') && !s.startsWith('//') ? s : '/profile'
}

export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get('email') ?? '').trim(),
    password: String(form.get('password') ?? ''),
  })
  if (error) return { error: error.message }
  redirect(safeNext(form.get('next')))
}

export type SignupState = { error?: string; values?: Record<string, string> } | undefined

export async function signupAction(_: SignupState, form: FormData): Promise<SignupState> {
  const get = (k: string) => String(form.get(k) ?? '').trim()
  const values = { first_name: get('first_name'), last_name: get('last_name'), email: get('email'), phone: get('phone') }
  const password = String(form.get('password') ?? '')
  const confirm = String(form.get('confirm_password') ?? '')
  const fail = (error: string): SignupState => ({ error, values })

  if (!values.first_name || !values.last_name) return fail('Enter your first and last name.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return fail('Enter a valid email address.')
  if (values.phone && !/^[+()\-\s\d]{7,18}$/.test(values.phone)) return fail('Enter a valid phone number, or leave it blank.')
  if (!checkPassword(password).ok) return fail(PASSWORD_ERROR)
  if (password !== confirm) return fail('The two passwords do not match.')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: { data: { first_name: values.first_name, last_name: values.last_name, phone: values.phone || null } },
  })
  if (error) return fail(error.message)
  if (!data.session) return fail('Account created, but email confirmation is on. Turn off "Confirm email" in Supabase for now, or confirm via the email we sent.')
  redirect(safeNext(form.get('next')))
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
