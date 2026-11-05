'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import NavLinks from '@/components/NavLinks'

/** Hamburger + dropdown for small screens. Closes on navigation and on Escape. */
export default function MobileMenu({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname // a route change closes it automatically

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenAt(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpenAt(open ? null : pathname)}
        className="grid size-9 place-items-center border border-[var(--line-strong)] text-[#ededed] transition-colors hover:border-[var(--g)] hover:text-[var(--g)]"
      >
        <span className="relative block h-3 w-4">
          <span className={`absolute left-0 h-px w-4 bg-current transition-all duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
          <span className={`absolute left-0 top-1.5 h-px w-4 bg-current transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`absolute left-0 h-px w-4 bg-current transition-all duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
        </span>
      </button>

      <div
        id="mobile-nav"
        className={`absolute inset-x-0 top-full origin-top border-b border-[var(--line)] bg-black/95 backdrop-blur-xl transition-all duration-300 ${open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}
      >
        <div className="container-x flex flex-col gap-1 py-4">
          <NavLinks onNavigate={() => setOpenAt(null)} linkClassName="py-3 text-base border-b border-[var(--line)]" />
          <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => { if ((e.target as HTMLElement).closest('a, button')) setOpenAt(null) }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
