'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Known segments: label, and where they link (null = no page of its own).
const SEGMENTS: Record<string, { label: string; href: string | null }> = {
  products: { label: 'Collection', href: '/collection' },
  collection: { label: 'Collection', href: '/collection' },
  market: { label: 'Marketplace', href: '/market' },
  'how-it-works': { label: 'How it works', href: '/how-it-works' },
  profile: { label: 'My collection', href: '/profile' },
  certificate: { label: 'Certificates', href: null },
  checkout: { label: 'Checkout', href: null },
  resale: { label: 'Resale', href: null },
  return: { label: 'Payment status', href: null },
  buy: { label: 'Buy', href: null },
  redeem: { label: 'Redeem', href: null },
  admin: { label: 'Admin', href: '/admin' },
  ledger: { label: 'Ledger', href: '/admin/ledger' },
  terms: { label: 'Terms of Use', href: '/terms' },
  privacy: { label: 'Privacy Policy', href: '/privacy' },
  'refund-policy': { label: 'Refund Policy', href: '/refund-policy' },
  about: { label: 'About Us', href: '/about' },
  verify: { label: 'Certificate Check', href: '/verify' },
  login: { label: 'Log in', href: '/login' },
  'forgot-password': { label: 'Forgot password', href: '/forgot-password' },
  signup: { label: 'Sign up', href: '/signup' },
}

function humanize(s: string) {
  const d = decodeURIComponent(s)
  if (/^[A-Za-z]+-\d+$/.test(d)) return d.toUpperCase() // serials such as GIV-0042
  if (d.length > 24 && /^[0-9a-f-]+$/i.test(d)) return `${d.slice(0, 8)}…`
  return d.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return null

  const crumbs: { label: string; href: string | null }[] = [{ label: 'Home', href: '/' }]
  let acc = ''
  parts.forEach((part, i) => {
    acc += `/${part}`
    const known = SEGMENTS[part]
    const last = i === parts.length - 1
    crumbs.push({ label: known ? known.label : humanize(part), href: last ? null : known ? known.href : acc })
  })

  return (
    <nav aria-label="Breadcrumb" className="border-b border-[var(--line)] bg-black/40">
      <ol className="container-x flex h-10 items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-[#8f8f8f] mono [scrollbar-width:none]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={`${c.label}-${i}`} className="crumb flex items-center gap-2" style={{ animationDelay: `${i * 60}ms` }}>
              {i > 0 && <span aria-hidden className="text-[#3d3d3d]">/</span>}
              {c.href && !last ? (
                <Link href={c.href} className="link-underline hover:text-[var(--g)]">{c.label}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-white' : ''}>{c.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
