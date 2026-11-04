// One-off, run AFTER supabase/migrations/0003_pieces.sql:
//   node --env-file=.env.local scripts/backfill-pieces.mjs
// Hashes every product's stored artwork file into `fingerprint`. For published products this also
// mints them (serial, seed, "minted" event) through the database trigger.
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const { data: products, error } = await db.from('products').select('id, slug, asset_path, fingerprint, minted_at, status')
if (error) throw error

for (const p of products) {
  if (p.fingerprint) { console.log(`skip ${p.slug} (already fingerprinted)`); continue }
  const { data: file, error: dl } = await db.storage.from('product-assets').download(p.asset_path)
  if (dl) { console.error(`FAILED ${p.slug}: ${dl.message}`); continue }
  const fingerprint = crypto.createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex')
  const { data, error: up } = await db.from('products').update({ fingerprint }).eq('id', p.id).select('serial, minted_at').single()
  if (up) { console.error(`FAILED ${p.slug}: ${up.message}`); continue }
  console.log(`ok ${p.slug}: ${fingerprint.slice(0, 12)}… ${data.serial ? `minted as ${data.serial}` : '(draft, will mint on publish)'}`)
}
