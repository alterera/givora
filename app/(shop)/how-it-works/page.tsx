import Link from 'next/link'
import Reveal from '@/components/Reveal'
import ScrambleText from '@/components/ScrambleText'

export const metadata = { title: 'How it works · Givora World' }

const PIPELINE = [
  ['00', 'ENTROPY_SEED', 'Deterministic generative seeding', 'At mint, a unique entropy seed is derived and bound to the piece. It parameterises the particle manifold, so the chromatic distribution of every point cloud is irreproducible.', 'seed = KDF(entropy ∥ serial)'],
  ['01', 'ATTEST_ORIGIN', 'Cryptographic fingerprint attestation', 'The source asset is run through a 256-bit one-way digest and the resulting fingerprint is sealed into the certificate. Any single-bit mutation of the file invalidates the attestation.', 'fp = SHA-256(asset) → 0x9f3a…c21e'],
  ['02', 'SETTLE_VALUE', 'Encrypted settlement channel', 'Acquisition is cleared over a TLS-encrypted, PCI-compliant settlement rail via Cashfree. Credentials never touch our infrastructure; we only receive a signed webhook confirming finality.', 'verify(HMAC-SHA256(ts ∥ body), sig)'],
  ['03', 'CUSTODY_TRANSFER', 'Atomic custody handoff', 'On confirmed settlement, custody of the single edition is transferred in one atomic transaction. Claim tokens for gifts are single-use, high-entropy bearer capabilities.', 'tx { reserve → settle → assign } ⇒ ACID'],
  ['04', 'LEDGER_APPEND', 'Hash-chained provenance ledger', 'Every state transition (mint, acquisition, gift, relist, resale) is appended to an immutable ledger. Each entry commits to the digest of its predecessor, so history is tamper-evident.', 'hₙ = H(hₙ₋₁ ∥ event ∥ ts)'],
  ['05', 'PUBLIC_VERIFY', 'Zero-trust verification', 'Anyone can resolve a serial to its public attestation and re-derive the fingerprint locally in the browser. No account, no permission, no trust in us required.', 'verify(serial) → ✓ origin ✓ custody ✓ chain'],
]

const GLOSSARY = [
  ['Manifold', 'The point cloud your piece is rendered from, a parametric surface sampled into thousands of luminous particles.'],
  ['Attestation', 'A cryptographically sealed statement about a piece, who minted it, when, and what its fingerprint is.'],
  ['Custody', 'Which account currently holds the sole edition. Exactly one at any time, never two.'],
  ['Ledger', 'The append-only, hash-chained record of every event in a piece’s life.'],
  ['Royalty rail', 'The deterministic split that routes a share of every resale back to the originating artist.'],
  ['Claim capability', 'A single-use, unguessable link that transfers custody to whoever redeems it first.'],
]

const QA = [
  ['Can a piece be duplicated?', 'No. Custody is a single-holder invariant enforced inside an atomic transaction, and the fingerprint is bound to the attestation.'],
  ['What makes history tamper-evident?', 'Each ledger entry commits to the digest of the one before it. Altering any event breaks every digest after it.'],
  ['Do I have to trust Givora to verify a piece?', 'No. Fingerprint verification runs client-side with the Web Crypto API. Nothing is uploaded.'],
  ['What happens on resale?', 'Settlement clears, custody moves atomically, the event is appended to the ledger, and the royalty rail pays the artist.'],
]

const HEX = Array.from({ length: 9 }, (_, i) => (0x9f3a51c2 + i * 0x2b7d13).toString(16).padStart(8, '0')).join(' ')

export default function HowItWorksPage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-[var(--line)]">
        <div className="absolute inset-0 -z-10 grid-bg opacity-60" />
        <div className="container-x py-14 md:py-24">
          <p className="eyebrow reveal mb-3">Protocol overview · v1.0</p>
          <h1 className="reveal d1 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tighter md:text-6xl">
            <span className="text-glow-green"><ScrambleText text="Provenance, encrypted" /></span> end to end.
          </h1>
          <p className="reveal d2 mt-5 max-w-2xl text-lg text-[#a1a1a1]">
            Each artwork is a cryptographically attested, single-custody asset. From entropy seeding to hash-chained history, this is the pipeline that makes one-of-one verifiable.
          </p>
          <div className="reveal d3 terminal mt-8 max-w-2xl overflow-hidden p-4 text-xs leading-6 text-[#6fa88f]">
            <p><span className="text-[var(--g)]">$</span> givora verify --serial GIV-7F3A-91C2-D4E8</p>
            <p className="break-all text-[#3f8f6c]">{HEX}</p>
            <p><span className="text-[var(--g)]">✓</span> origin attested &nbsp;<span className="text-[var(--g)]">✓</span> custody unique &nbsp;<span className="text-[var(--g)]">✓</span> chain intact<span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-[var(--g)]" /></p>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <Reveal>
          <p className="eyebrow mb-3">Pipeline</p>
          <h2 className="mb-10 max-w-2xl text-3xl font-semibold tracking-tight">Six stages between a seed and a signed original.</h2>
        </Reveal>
        <ol className="relative flex flex-col gap-4 border-l border-[#0f2a1e] pl-6 md:pl-10">
          {PIPELINE.map(([n, tag, title, body, code]) => (
            <li key={n} className="relative">
              <span className="absolute -left-[31px] top-6 size-2.5 border border-[var(--g)] bg-black md:-left-[47px]" />
              <Reveal>
                <div className="group terminal p-5 transition-colors hover:border-[rgba(25,255,160,.5)] md:p-7">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="mono text-xs text-[var(--g)]">{n}</span>
                    <span className="mono text-[11px] tracking-[.18em] text-[#4f8f72]">{tag}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-medium tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#8fb3a2]">{body}</p>
                  <p className="mono mt-4 overflow-x-auto whitespace-nowrap border-t border-[#0f2a1e] pt-3 text-xs text-[var(--g)]">{code}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-[var(--line)] bg-[#020a06]">
        <Reveal className="container-x py-16">
          <p className="eyebrow mb-3">Lexicon</p>
          <h2 className="mb-10 text-3xl font-semibold tracking-tight">Terms of the protocol.</h2>
          <dl className="grid gap-px border border-[#0f2a1e] bg-[#0f2a1e] sm:grid-cols-2 lg:grid-cols-3">
            {GLOSSARY.map(([t, d]) => (
              <div key={t} className="bg-black p-6 transition-colors hover:bg-[#06140d]">
                <dt className="mono text-sm text-[var(--g)]">{t}</dt>
                <dd className="mt-2 text-sm text-[#8fb3a2]">{d}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section id="gifting" className="container-x scroll-mt-20 py-16">
        <Reveal>
          <p className="eyebrow mb-3">Gifting</p>
          <h2 className="mb-4 max-w-2xl text-3xl font-semibold tracking-tight">Custody, transferred by capability.</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[#8fb3a2]">
            A gift is settled by the sender, then sealed behind a single-use claim capability. The sender is permanently recorded as the donor in the ledger, an optional sealed message is revealed on redemption, and custody moves to the first account to present the capability.
          </p>
        </Reveal>
      </section>

      <section className="container-x pb-16">
        <Reveal>
          <p className="eyebrow mb-3">Assurances</p>
          <div className="divide-y divide-[#0f2a1e] border-y border-[#0f2a1e]">
            {QA.map(([q, a]) => (
              <div key={q} className="grid gap-2 py-5 md:grid-cols-[1fr_1.5fr] md:gap-10"><h3 className="font-medium">{q}</h3><p className="text-sm text-[#8fb3a2]">{a}</p></div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="container-x pb-24">
        <Reveal>
          <div className="glow-box flex flex-wrap items-center justify-between gap-4 p-6 md:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Initiate your first acquisition.</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/collection" className="btn btn-primary btn-lg">Browse the collection</Link>
              <Link href="/verify" className="btn btn-lg">Check a certificate</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
