/** Canonical origin used for metadata, sitemaps and e-mail links. No trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
export const SITE_NAME = 'Givora World'
export const SITE_TAGLINE = 'One-of-one digital particle art'
export const SITE_DESCRIPTION =
  'Collect, gift and resell one-of-one digital artworks rendered live as clouds of light. Every piece has its own serial, a public certificate and a tamper-evident history.'
