import CertificateLookup from '@/components/CertificateLookup'
import Reveal from '@/components/Reveal'
import ScrambleText from '@/components/ScrambleText'

export const metadata = {
  title: 'Certificate Check',
  description: 'Resolve a Givora serial to its public certificate: artist, mint date, fingerprint, current owner and full provenance.',
  alternates: { canonical: '/verify' },
}

const STAGES = [
  ['RESOLVE_SERIAL', 'Locate the attestation', 'The 48-bit serial is resolved to a single public attestation record.'],
  ['FETCH_ATTESTATION', 'Read the sealed claim', 'Artist, mint epoch, entropy seed and custody state are retrieved.'],
  ['REDERIVE_DIGEST', 'Recompute the fingerprint', 'SHA-256 over the artifact, compared bit-for-bit with the minted digest.'],
  ['VALIDATE_CHAIN', 'Walk the ledger', 'Every provenance entry must commit to the digest of its predecessor.'],
]

const GUARANTEES = [
  ['Origin integrity', 'The artifact is bound to its mint by a one-way 256-bit digest.'],
  ['Custody uniqueness', 'Exactly one holder at any instant, enforced by an atomic transaction.'],
  ['Ledger continuity', 'An append-only, hash-chained history. Alteration breaks every later link.'],
  ['Zero-trust check', 'Verification of a file runs client-side. Nothing leaves your browser.'],
]

const SAMPLE = [
  ['serial', 'GIV-7F3A-91C2-D4E8'],
  ['digest', 'sha256:9f3a51c2e07b…c21e'],
  ['custody', '1 holder · unique'],
  ['chain', '6 entries · intact'],
]

export default function VerifyPage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-[var(--line)]">
        <div className="absolute inset-0 -z-10 grid-bg opacity-60" />
        <div className="container-x py-12 md:py-20">
          <p className="eyebrow reveal mb-3">Certificate check · public attestation resolver</p>
          <h1 className="reveal d1 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter md:text-6xl">
            <span className="text-glow-green"><ScrambleText text="Verify a piece" /></span>
            <br />without trusting anyone.
          </h1>
          <p className="reveal d2 mt-5 max-w-2xl text-lg text-[#a1a1a1]">
            Resolve a serial to its sealed attestation: origin, custody and a hash-chained history that can be independently re-derived.
          </p>

          <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
            <div className="reveal d3"><CertificateLookup /></div>

            <div className="reveal d4 terminal p-5 sm:p-6" aria-label="Example output">
              <p className="mono mb-4 text-[10px] tracking-[.2em] text-[#4f8f72]">EXAMPLE OUTPUT</p>
              <dl className="mono space-y-2 text-xs sm:text-sm">
                {SAMPLE.map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="w-16 shrink-0 text-[#4f8f72]">{k}</dt>
                    <dd className="min-w-0 break-all text-[#b9d9cb]">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mono mt-5 border-t border-[#0f2a1e] pt-4 text-xs text-[var(--g)]">
                ✓ origin attested &nbsp;✓ custody unique &nbsp;✓ chain intact
                <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-[var(--g)]" />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <Reveal>
          <p className="eyebrow mb-3">Verification pipeline</p>
          <h2 className="mb-10 max-w-2xl text-3xl font-semibold tracking-tight">Four deterministic stages.</h2>
        </Reveal>
        <ol className="grid gap-px border border-[#0f2a1e] bg-[#0f2a1e] md:grid-cols-2 lg:grid-cols-4">
          {STAGES.map(([tag, title, body], i) => (
            <li key={tag} className="group relative bg-black p-6 transition-colors hover:bg-[#06140d]">
              <span className="mono text-xs text-[var(--g)]">{String(i + 1).padStart(2, '0')}</span>
              <p className="mono mt-3 text-[11px] tracking-[.16em] text-[#4f8f72]">{tag}</p>
              <h3 className="mt-2 font-medium tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-[#8fb3a2]">{body}</p>
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--g)] shadow-[0_0_10px_var(--g)] transition-transform duration-500 group-hover:scale-x-100" />
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-[var(--line)] bg-[#020a06]">
        <Reveal className="container-x py-16">
          <p className="eyebrow mb-3">What a valid certificate proves</p>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {GUARANTEES.map(([t, d]) => (
              <div key={t} className="flex gap-4">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-[var(--g)] shadow-[0_0_8px_var(--g)]" />
                <div><dt className="font-medium">{t}</dt><dd className="mt-1 text-sm text-[#8fb3a2]">{d}</dd></div>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>
    </main>
  )
}
