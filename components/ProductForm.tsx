'use client'

import { useActionState, useState } from 'react'
import { bakeGlbToCloud } from '@/lib/particle/bake'
import { saveProductAction, type AdminState } from '@/lib/actions/admin'

type Initial = {
  id?: string; slug?: string; title?: string; description?: string; artist_name?: string
  price_inr?: number; stock?: number; asset_path?: string; asset_type?: string
  viewer_config?: Record<string, unknown>; palette?: string[]; status?: string
}

export default function ProductForm({ initial = {} }: { initial?: Initial }) {
  const [status, setStatus] = useState('')
  const [state, action, pending] = useActionState<AdminState, FormData>(async (prev, form) => {
    const file = form.get('asset')
    if (file instanceof File && file.name.toLowerCase().endsWith('.glb')) {
      try {
        setStatus('Baking GLB into a point cloud…')
        const { buffer } = await bakeGlbToCloud(file)
        form.set('asset', new File([buffer], file.name.replace(/\.glb$/i, '.cloud'), { type: 'application/octet-stream' }))
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Could not convert the GLB.' }
      } finally {
        setStatus('')
      }
    }
    return saveProductAction(prev, form)
  }, undefined)
  const palette = initial.palette ?? ['#0dffab', '#1456ff', '#8dcaff']

  return (
    <form action={action} className="grid max-w-3xl gap-6">
      <input type="hidden" name="id" defaultValue={initial.id ?? ''} />
      <input type="hidden" name="asset_path" defaultValue={initial.asset_path ?? ''} />
      <input type="hidden" name="asset_type" defaultValue={initial.asset_type ?? 'bin'} />

      <fieldset className="panel grid gap-4 p-5 md:grid-cols-2">
        <legend className="eyebrow px-2">Details</legend>
        <div><label className="label">Title</label><input name="title" defaultValue={initial.title} required className="input" /></div>
        <div><label className="label">Slug</label><input name="slug" placeholder="my-artwork" defaultValue={initial.slug} required className="input" /></div>
        <div className="md:col-span-2"><label className="label">Artist name</label><input name="artist_name" defaultValue={initial.artist_name} className="input" /></div>
        <div className="md:col-span-2"><label className="label">Description</label><textarea name="description" defaultValue={initial.description} rows={4} className="input" /></div>
        <div><label className="label">Price (INR)</label><input name="price_inr" type="number" step="0.01" min="0.01" defaultValue={initial.price_inr} required className="input" /></div>
        <div><label className="label">Stock (editions)</label><input name="stock" type="number" min="0" step="1" defaultValue={initial.stock ?? 10} required className="input" /></div>
      </fieldset>

      <fieldset className="panel grid gap-4 p-5">
        <legend className="eyebrow px-2">Artwork</legend>
        <div>
          <label className="label">
            Upload .glb (colours kept), .bin from Particleify, or png/jpg/webp{initial.asset_path && <> · current: <span className="mono">{initial.asset_path}</span></>}
          </label>
          <input name="asset" type="file" accept=".glb,.bin,.png,.jpg,.jpeg,.webp" className="input h-auto py-2 file:mr-3 file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
        </div>
        <div>
          <label className="label">Palette (used for .bin clouds only)</label>
          <div className="flex gap-3">{palette.map((c, i) => <input key={i} name={`palette${i + 1}`} type="color" defaultValue={c} className="h-10 w-14 cursor-pointer border border-[var(--line)] bg-black p-1" />)}</div>
        </div>
        <div>
          <label className="label">Viewer config JSON (paste a Particleify CONFIG; non-visual keys are dropped)</label>
          <textarea name="viewer_config" rows={7} defaultValue={JSON.stringify(initial.viewer_config ?? {}, null, 2)} className="input mono text-xs" />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <select name="status" defaultValue={initial.status ?? 'draft'} className="input w-40">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button disabled={pending} className="btn btn-primary btn-lg">{pending ? (status || 'Saving…') : 'Save product'}</button>
      </div>
      {state?.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
    </form>
  )
}
