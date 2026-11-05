import { FloatingPaths } from '@/components/floating-paths'
import { AuthDivider } from '@/components/auth-divider'
import { GoogleIcon } from '@/components/google-icon'
import { Button } from '@/components/ui/button'
import { SITE_NAME } from '@/lib/site'

const FACTS = [
  ['1 / 1', 'Every piece exists once'],
  ['SHA-256', 'Artwork fingerprinted at mint'],
  ['Chained', 'Provenance you can verify'],
]

/** Split-screen auth layout: a live particle sculpture on the left (drag it), the form on the right. */
export default function AuthShell({
  eyebrow, title, subtitle, social = false, wide = false, children,
}: { eyebrow: string; title: string; subtitle?: string; social?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[calc(100svh-3.5rem)] flex-1 lg:grid lg:grid-cols-2">
      <aside aria-hidden className="relative hidden overflow-hidden border-r border-[var(--line)] bg-black lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(25,255,160,.14),transparent_70%)]" />
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-6 bg-gradient-to-t from-black via-black/80 to-transparent p-10 pt-24">
          <div>
            <p className="eyebrow mb-2">{SITE_NAME}</p>
            <p className="max-w-sm text-2xl font-semibold leading-tight tracking-tight">One-of-one digital particle art, owned on a public chain of custody.</p>
          </div>
          <dl className="grid grid-cols-3 gap-px border border-[var(--line)] bg-[var(--line)]">
            {FACTS.map(([k, v]) => (
              <div key={k} className="bg-black/80 p-3">
                <dt className="mono text-sm text-[var(--g)]">{k}</dt>
                <dd className="mt-1 text-[11px] leading-snug text-[#8f8f8f]">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mono text-[10px] uppercase tracking-[.2em] text-[#4f8f72]">Drag the sculpture to rotate</p>
        </div>
      </aside>

      <section className="relative flex flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div aria-hidden className="absolute inset-0 -z-10 grid-bg opacity-40 lg:opacity-20" />
        <div className={`reveal mx-auto w-full ${wide ? 'max-w-md' : 'max-w-sm'}`}>
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 mb-7 text-sm text-[#8f8f8f]">{subtitle}</p>}
          {!subtitle && <div className="mb-7" />}
          {social && (
            <>
              <div className="grid gap-2">
                {[['Google', GoogleIcon]].map(([name, Icon]) => {
                  const I = Icon as typeof GoogleIcon
                  return (
                    <Button key={name as string} type="button" variant="outline" disabled className="h-10 w-full justify-center border-[var(--line)] bg-black text-[#8f8f8f]">
                      <I data-icon="inline-start" />Continue with {name as string}
                    </Button>
                  )
                })}
              </div>
              <div className="my-6"><AuthDivider>OR</AuthDivider></div>
            </>
          )}
          {children}
        </div>
      </section>
    </main>
  )
}
