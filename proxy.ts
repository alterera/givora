import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/middleware'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|og/|robots.txt|sitemap.xml|manifest.webmanifest|icon.svg|apple-icon|opengraph-image|.*\.(?:svg|png|jpg|jpeg|gif|webp|cloud)$).*)',
  ],
}
