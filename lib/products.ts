import 'server-only'
import { assetUrl } from '@/lib/supabase-admin'
import type { ViewerConfig } from '@/lib/particle/runtime'

export type Product = {
  id: string; slug: string; title: string; description: string; artist_name: string
  price_inr: number; stock: number; sold: number; asset_path: string
  asset_type: 'image' | 'cloud'; viewer_config: Partial<ViewerConfig>; palette: string[]
  status: 'draft' | 'published'
  serial: string | null; seed: number | null; minted_at: string | null
  fingerprint: string | null; royalty_bps: number
}

export type ViewerExtras = {
  /** Show the collector-only effect (owner viewing their own piece). */
  owner?: boolean
  interactive?: boolean
  intro?: boolean
}

/** Props for <ProductViewer/> from a product row. The seed makes each piece visibly unique; no plaque is etched, so the art stays clean. */
export function viewerProps(
  p: Pick<Product, 'asset_path' | 'asset_type' | 'palette' | 'viewer_config'> & Partial<Pick<Product, 'seed' | 'serial'>>,
  maxParticles?: number,
  extras: ViewerExtras = {},
) {
  return {
    assetUrl: assetUrl(p.asset_path),
    assetType: p.asset_type,
    palette: p.palette,
    config: p.viewer_config,
    maxParticles,
    seed: p.seed ?? undefined,
    ...extras,
  }
}
