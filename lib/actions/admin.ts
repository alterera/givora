'use server'

import crypto from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient, ASSET_BUCKET } from '@/lib/supabase-admin'

export type AdminState = { error?: string } | undefined

export async function saveProductAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin() // never rely on the proxy alone
  const db = createAdminClient()

  const id = String(form.get('id') ?? '')
  const title = String(form.get('title') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  const price = Number(form.get('price_inr'))
  const royaltyPct = Number(form.get('royalty_pct') ?? 7.5)
  if (!title || !slug) return { error: 'Title and slug are required.' }
  if (!(price > 0)) return { error: 'Price must be greater than 0.' }
  if (!(royaltyPct >= 0 && royaltyPct <= 20)) return { error: 'Artist royalty must be between 0 and 20%.' }

  let viewerConfig: Record<string, unknown> = {}
  const rawConfig = String(form.get('viewer_config') ?? '').trim()
  if (rawConfig) {
    try {
      viewerConfig = JSON.parse(rawConfig)
      // Pasted Particleify CONFIG: drop fields that aren't visual params.
      for (const k of ['images', 'driver', 'transition', 'duration', 'hold', 'strength', 'paused']) delete viewerConfig[k]
    } catch {
      return { error: 'Viewer config is not valid JSON.' }
    }
  }

  // A minted piece is a public promise: its artwork and artist can never change.
  const existing = id ? (await db.from('products').select('minted_at, artist_name').eq('id', id).single()).data : null
  const minted = !!existing?.minted_at

  const artistName = String(form.get('artist_name') ?? '')
  if (minted && artistName !== existing?.artist_name) {
    return { error: 'This piece is minted. The artist name can no longer be changed.' }
  }

  const file = form.get('asset')
  let assetPath = String(form.get('asset_path') ?? '')
  let assetType = String(form.get('asset_type') ?? 'cloud')
  let fingerprint: string | undefined
  if (file instanceof File && file.size > 0) {
    if (minted) return { error: 'This piece is minted. Its artwork file can no longer be replaced.' }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (ext === 'cloud') assetType = 'cloud'
    else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) assetType = 'image'
    else return { error: 'Upload a .glb model or a png/jpg/webp image.' }
    const bytes = Buffer.from(await file.arrayBuffer())
    fingerprint = crypto.createHash('sha256').update(bytes).digest('hex') // SHA-256 of the stored file
    assetPath = `${crypto.randomUUID()}.${ext}`
    const { error } = await db.storage.from(ASSET_BUCKET).upload(assetPath, bytes, {
      contentType: ext === 'cloud' ? 'application/octet-stream' : file.type,
    })
    if (error) return { error: `Upload failed: ${error.message}` }
  }
  if (!assetPath) return { error: 'An asset file is required.' }

  const row: Record<string, unknown> = {
    slug, title, description: String(form.get('description') ?? ''),
    artist_name: artistName, price_inr: price,
    royalty_bps: Math.round(royaltyPct * 100),
    asset_path: assetPath, asset_type: assetType,
    viewer_config: viewerConfig,
    status: form.get('status') === 'published' ? 'published' : 'draft',
  }
  if (fingerprint) row.fingerprint = fingerprint

  // Stock is fixed at one copy per product; sales change it, never the form.
  const { error } = id
    ? await db.from('products').update(row).eq('id', id)
    : await db.from('products').insert({ ...row, stock: 1 })
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/admin')
}
