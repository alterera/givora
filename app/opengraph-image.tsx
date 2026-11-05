import fs from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site'

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const svg = await fs.readFile(path.join(process.cwd(), 'public', 'logo.svg'))
  const logo = `data:image/svg+xml;base64,${svg.toString('base64')}`
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'radial-gradient(circle at 80% 20%, #0b3a28 0%, #020a06 45%, #000 100%)', color: '#ededed' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={64} height={64} alt="" />
          <div style={{ fontSize: 34, letterSpacing: 6, textTransform: 'uppercase', color: '#19ffa0' }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>Art made of light.</div>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, color: '#19ffa0' }}>Owned by you.</div>
        </div>
        <div style={{ fontSize: 28, color: '#8fb3a2' }}>One-of-one digital particle art · certified, collectible, giftable</div>
      </div>
    ),
    size,
  )
}
