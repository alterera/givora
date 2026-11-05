'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const NAV_LINKS = [
  { label: 'Collection', href: '/collection' },
  { label: 'Marketplace', href: '/market' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Verify', href: '/verify' },
]

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`) || (href === '/collection' && path.startsWith('/products'))

export default function NavLinks({ onNavigate, className = '', linkClassName = '' }: { onNavigate?: () => void; className?: string; linkClassName?: string }) {
  const path = usePathname()
  return (
    <>
      {NAV_LINKS.map(({ label, href }) => {
        const active = isActive(path, href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`relative text-sm transition-colors ${active ? 'text-[var(--g)]' : 'text-[#a1a1a1] hover:text-white'} ${linkClassName} ${className}`}
          >
            {label}
            <span className={`absolute -bottom-[19px] left-0 h-px bg-[var(--g)] shadow-[0_0_8px_var(--g)] transition-all duration-300 max-md:hidden ${active ? 'w-full' : 'w-0'}`} />
          </Link>
        )
      })}
    </>
  )
}
