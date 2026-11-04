import 'server-only'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function getUser() {
  await connection() // supabase-js reads Date.now(); defer to request time
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function requireUser(next = '/profile') {
  const user = await getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

export async function requireAdmin() {
  const user = await requireUser('/admin')
  const { data } = await createAdminClient()
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!data?.is_admin) redirect('/')
  return user
}

/** Current user plus admin flag (for navigation). */
export async function getViewer() {
  const user = await getUser()
  if (!user) return null
  const { data } = await createAdminClient().from('profiles').select('is_admin').eq('id', user.id).single()
  return { user, isAdmin: !!data?.is_admin }
}

/** Wall-clock time for request-time logic (kept out of components for the purity lint). */
export const serverNow = () => Date.now()
