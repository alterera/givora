import 'server-only'
import { assetUrl } from '@/lib/supabase-admin'
import type { ViewerConfig } from '@/lib/particle/runtime'

export type Product = {
  id: string; slug: string; title: string; description: string; artist_name: string
  price_inr: number; stock: number; sold: number; asset_path: string
  asset_type: 'bin' | 'image' | 'cloud'; viewer_config: Partial<ViewerConfig>; palette: string[]
  status: 'draft' | 'published'
}

/** Props for <ProductViewer/> from a product row. */
export function viewerProps(p: Pick<Product, 'asset_path' | 'asset_type' | 'palette' | 'viewer_config'>, maxParticles?: number) {
  return {
    assetUrl: assetUrl(p.asset_path),
    assetType: p.asset_type,
    palette: p.palette,
    config: p.viewer_config,
    maxParticles,
  }
}
