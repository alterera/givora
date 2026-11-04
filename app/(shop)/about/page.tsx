import Link from 'next/link'
import Reveal from '@/components/Reveal'

export const metadata = { title: 'About Us · Givora World' }

const VALUES = [
  ['One of one', 'Every piece exists once. No editions, no reprints, no inflation.'],
  ['Verifiable', 'Each piece carries a fingerprint and a recorded history anyone can check.'],
  ['Artist first', 'Artists earn on the first sale and again on every resale.'],
]

export default function AboutPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  return (
    <main className="container-x py-10 md:py-16">
      <p className="eyebrow reveal mb-3">About us</p>
      <h1 className="reveal d1 max-w-3xl text-4xl font-semibold tracking-tighter md:text-6xl">A home for art made of <span className="text-glow-green">light.</span></h1>
      <p className="reveal d2 mt-5 max-w-2xl text-lg text-[#a1a1a1]">Givora World is a gallery for particle-cloud artworks. Each piece is rendered live from thousands of points of light, minted once, and owned by one person at a time. You can keep it, give it to someone, or pass it on to the next collector.</p>
      <Reveal>
        <div className="mt-14 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
          {VALUES.map(([t, d]) => <div key={t} className="bg-black p-7 transition-colors hover:bg-[#06100b]"><h2 className="font-medium tracking-tight">{t}</h2><p className="mt-2 text-sm text-[#8f8f8f]">{d}</p></div>)}
        </div>
      </Reveal>
      <Reveal>
        <div className="glow-box mt-14 flex flex-wrap items-center justify-between gap-4 p-6 md:p-8">
          <div>
            <h2 className="text-xl font-medium tracking-tight">Get in touch</h2>
            <p className="mt-1 text-sm text-[#a1a1a1]">Orders, refunds, press or artist enquiries.{' '}
              {email ? <a href={`mailto:${email}`} className="text-[var(--g)] underline">{email}</a> : null}
            </p>
          </div>
          <Link href="/#updates" className="btn btn-primary">Stay updated</Link>
        </div>
      </Reveal>
    </main>
  )
}
