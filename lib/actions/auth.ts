'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'

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

export async function signupAction(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get('email') ?? '').trim(),
    password: String(form.get('password') ?? ''),
  })
  if (error) return { error: error.message }
  if (!data.session) return { error: 'Account created but email confirmation is on. Disable "Confirm email" in Supabase for now.' }
  redirect(safeNext(form.get('next')))
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
