import { ImageResponse } from 'next/og'
import { getProductBySlug } from '@/lib/catalog'
import { inr } from '@/lib/format'
import { SITE_NAME } from '@/lib/site'

const SIZE = { width: 1200, height: 630 }

/** Deterministic pseudo-random in [0,1) so each piece always gets the same constellation. */
function rng(seed: number) {
  let t = seed >>> 0
  return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296 }
}

/**
 * Share-preview card for a piece. The real artwork is a live WebGL particle cloud, which cannot be
 * rendered on the server, so the card draws a particle constellation seeded from the piece instead.
 */
export async function GET(_: Request, ctx: RouteContext<'/og/[slug]'>) {
  const { slug } = await ctx.params
  const p = await getProductBySlug(slug)
  const title = p?.title ?? SITE_NAME
  const artist = p?.artist_name || 'Unknown artist'
  const palette = p?.palette?.length ? p.palette : ['#19ffa0', '#1456ff', '#8dcaff']
  const rand = rng(p?.seed ?? 7)

  // Particles on a spiral-ish ring on the right-hand side.
  const dots = Array.from({ length: 140 }, (_, i) => {
    const a = i * 2.399963 + rand() * 0.6
    const r = 40 + Math.sqrt(i / 140) * 230 + rand() * 24
    return { x: 880 + Math.cos(a) * r - 0, y: 315 + Math.sin(a) * r * 0.9, s: 3 + rand() * 7, c: palette[Math.floor(rand() * palette.length)], o: 0.35 + rand() * 0.65 }
  })

  const sold = !!p && (p.sold > 0 || p.stock <= 0)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: 'radial-gradient(circle at 74% 50%, #0a2c1f 0%, #020a06 50%, #000 100%)', color: '#ededed' }}>
        {dots.map((d, i) => (
          <div key={i} style={{ position: 'absolute', left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: 9999, background: d.c, opacity: d.o }} />
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64, width: 760 }}>
          <div style={{ display: 'flex', fontSize: 28, letterSpacing: 6, textTransform: 'uppercase', color: '#19ffa0' }}>{SITE_NAME}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {p?.serial && <div style={{ display: 'flex', fontSize: 26, color: '#4f8f72', letterSpacing: 3, marginBottom: 14 }}>{p.serial}</div>}
            <div style={{ display: 'flex', fontSize: title.length > 24 ? 64 : 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
            {p && <div style={{ display: 'flex', fontSize: 34, color: '#8fb3a2', marginTop: 18 }}>by {artist}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {p && <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: '#000', background: '#19ffa0', padding: '10px 26px' }}>{inr(p.price_inr)}</div>}
            <div style={{ display: 'flex', fontSize: 26, color: '#8fb3a2' }}>{!p ? 'One-of-one digital particle art' : sold ? '1 of 1 · collected' : '1 of 1 · available now'}</div>
          </div>
        </div>
      </div>
    ),
    { ...SIZE, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' } },
  )
}
