import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      // Private, transactional or per-user pages have no search value.
      disallow: ['/admin', '/api/', '/checkout', '/profile', '/redeem/', '/buy/', '/login', '/signup', '/forgot-password', '/reset-password'],
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
