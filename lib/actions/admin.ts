'use server'

import crypto from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient, ASSET_BUCKET } from '@/lib/supabase-admin'

export type AdminState = { error?: string } | undefined

const HEX = /^#[0-9a-fA-F]{6}$/

export async function saveProductAction(_: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin() // never rely on the proxy alone
  const db = createAdminClient()

  const id = String(form.get('id') ?? '')
  const title = String(form.get('title') ?? '').trim()
  const slug = String(form.get('slug') ?? '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  const price = Number(form.get('price_inr'))
  const stock = Number(form.get('stock'))
  if (!title || !slug) return { error: 'Title and slug are required.' }
  if (!(price > 0)) return { error: 'Price must be greater than 0.' }
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock must be a whole number.' }

  const palette = ['palette1', 'palette2', 'palette3'].map((k) => String(form.get(k) ?? ''))
  if (!palette.every((c) => HEX.test(c))) return { error: 'Palette colours must be #rrggbb.' }

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

  const file = form.get('asset')
  let assetPath = String(form.get('asset_path') ?? '')
  let assetType = String(form.get('asset_type') ?? 'bin')
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (ext === 'bin') assetType = 'bin'
    else if (ext === 'cloud') assetType = 'cloud'
    else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) assetType = 'image'
    else return { error: 'Upload a .glb model, a .bin point cloud, or a png/jpg/webp image.' }
    assetPath = `${crypto.randomUUID()}.${ext}`
    const { error } = await db.storage.from(ASSET_BUCKET).upload(assetPath, file, {
      contentType: ext === 'bin' || ext === 'cloud' ? 'application/octet-stream' : file.type,
    })
    if (error) return { error: `Upload failed: ${error.message}` }
  }
  if (!assetPath) return { error: 'An asset file is required.' }

  const row = {
    slug, title, description: String(form.get('description') ?? ''),
    artist_name: String(form.get('artist_name') ?? ''),
    price_inr: price, stock, asset_path: assetPath, asset_type: assetType,
    viewer_config: viewerConfig, palette,
    status: form.get('status') === 'published' ? 'published' : 'draft',
  }
  const { error } = id
    ? await db.from('products').update(row).eq('id', id)
    : await db.from('products').insert(row)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/admin')
}
