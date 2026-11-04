import Link from 'next/link'
import { Suspense } from 'react'
import { getViewer } from '@/lib/auth'
import { logoutAction } from '@/lib/actions/auth'

async function UserNav() {
  const viewer = await getViewer()
  if (!viewer) {
    return (
      <>
        <Link href="/login" className="btn btn-ghost">Log in</Link>
        <Link href="/#collection" className="btn btn-primary hidden sm:inline-flex">Browse art</Link>
      </>
    )
  }
  return (
    <>
      <Link href="/profile" className="btn btn-ghost">My collection</Link>
      {viewer.isAdmin && <Link href="/admin" className="btn btn-ghost">Admin</Link>}
      <form action={logoutAction}><button className="btn">Log out</button></form>
    </>
  )
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2 22 20H2L12 2Z" fill="#fff" />
      </svg>
      <span>Givora <span className="text-[#8f8f8f] font-normal">World</span></span>
    </Link>
  )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-black/70 backdrop-blur-xl">
      <div className="container-x flex h-14 items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#a1a1a1]">
            <Link href="/#collection" className="link-underline">Collection</Link>
            <Link href="/market" className="link-underline">Marketplace</Link>
            <Link href="/#how" className="link-underline">How it works</Link>
            <Link href="/#gifting" className="link-underline">Gifting</Link>
          </nav>
        </div>
        <nav className="flex items-center gap-2">
          <Suspense fallback={<span className="h-10 w-20" />}><UserNav /></Suspense>
        </nav>
      </div>
    </header>
  )
}
