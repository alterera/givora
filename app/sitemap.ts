import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { getPublished } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1, changeFrequency: 'daily' },
  { path: '/collection', priority: 0.9, changeFrequency: 'daily' },
  { path: '/market', priority: 0.7, changeFrequency: 'daily' },
  { path: '/how-it-works', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/verify', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/refund-policy', priority: 0.2, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection() // build the list per request so new pieces appear without a redeploy
  const { products } = await getPublished()
  return [
    ...STATIC.map((s) => ({ url: `${SITE_URL}${s.path}`, changeFrequency: s.changeFrequency, priority: s.priority })),
    ...products.flatMap((p) => [
      { url: `${SITE_URL}/products/${p.slug}`, lastModified: p.minted_at ?? undefined, changeFrequency: 'weekly' as const, priority: 0.8 },
      ...(p.serial ? [{ url: `${SITE_URL}/certificate/${p.serial}`, lastModified: p.minted_at ?? undefined, changeFrequency: 'weekly' as const, priority: 0.4 }] : []),
    ]),
  ]
}
