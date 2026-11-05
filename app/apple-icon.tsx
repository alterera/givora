import fs from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** iOS home-screen icon: the logo mark (public/logo.svg) centred on black. */
export default async function AppleIcon() {
  const svg = await fs.readFile(path.join(process.cwd(), 'public', 'logo.svg'))
  const src = `data:image/svg+xml;base64,${svg.toString('base64')}`
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={112} height={112} alt="" />
      </div>
    ),
    size,
  )
}
