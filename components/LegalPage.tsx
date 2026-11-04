import type { ReactNode } from 'react'

export type LegalSection = { title: string; body: ReactNode }

export default function LegalPage({ eyebrow, title, updated, intro, sections }: {
  eyebrow: string; title: string; updated?: string; intro: string; sections: LegalSection[]
}) {
  return (
    <main className="container-x py-10 md:py-16">
      <p className="eyebrow reveal mb-3">{eyebrow}</p>
      <h1 className="reveal d1 text-3xl font-semibold tracking-tight md:text-5xl"><span className="text-glow-green">{title}</span></h1>
      {updated && <p className="reveal d2 mono mt-3 text-xs text-[#4f8f72]">Last updated {updated}</p>}
      <p className="reveal d2 mt-5 max-w-2xl text-[#a1a1a1]">{intro}</p>
      <div className="mt-12 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-2 border-l border-[var(--line)] pl-4 text-sm text-[#8f8f8f]">
            {sections.map((s, i) => <li key={s.title}><a href={`#s${i + 1}`} className="link-underline">{String(i + 1).padStart(2, '0')} · {s.title}</a></li>)}
          </ul>
        </nav>
        <div className="flex max-w-2xl flex-col gap-10">
          {sections.map((s, i) => (
            <section key={s.title} id={`s${i + 1}`} className="scroll-mt-24">
              <h2 className="mb-3 flex items-baseline gap-3 text-xl font-medium tracking-tight">
                <span className="mono text-xs text-[var(--g)]">{String(i + 1).padStart(2, '0')}</span>{s.title}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-[#b4b4b4]">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
