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
  const { data, error } = await createAdminClient()
    .from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  // A database error is not the same as "not an admin": say so instead of silently bouncing to /.
  if (error) console.error('[auth] could not read profiles.is_admin:', error.message, '(run supabase/migrations/0005_grants.sql if this says "permission denied")')
  else if (!data) console.error(`[auth] no profiles row for user ${user.id}; run supabase/migrations/0005_grants.sql`)
  if (!data?.is_admin) redirect('/')
  return user
}

/** Current user plus admin flag (for navigation). */
export async function getViewer() {
  const user = await getUser()
  if (!user) return null
  const { data, error } = await createAdminClient().from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (error) console.error('[auth] could not read profiles.is_admin:', error.message)
  return { user, isAdmin: !!data?.is_admin }
}

/** Wall-clock time for request-time logic (kept out of components for the purity lint). */
export const serverNow = () => Date.now()
