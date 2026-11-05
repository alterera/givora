import Link from 'next/link'
import { Suspense } from 'react'
import { getViewer } from '@/lib/auth'
import { logoutAction } from '@/lib/actions/auth'
import NavLinks from '@/components/NavLinks'
import MobileMenu from '@/components/MobileMenu'
import Image from 'next/image'

async function UserNav() {
  const viewer = await getViewer()
  if (!viewer) {
    return (
      <>
        <Link href="/login" className="btn btn-sm btn-ghost">Log in</Link>
        <Link href="/signup" className="btn btn-sm btn-primary">Sign up</Link>
      </>
    )
  }
  return (
    <>
      <Link href="/profile" className="btn btn-sm btn-ghost">My collection</Link>
      {viewer.isAdmin && <Link href="/admin" className="btn btn-sm btn-ghost">Admin</Link>}
      <form action={logoutAction}><button className="btn btn-sm">Log out</button></form>
    </>
  )
}

/** Always-visible account button on small screens, placed before the menu toggle. */
async function MobileQuick() {
  const viewer = await getViewer()
  return viewer
    ? <Link href="/profile" className="btn btn-sm">My collection</Link>
    : <Link href="/login" className="btn btn-sm btn-primary">Log in</Link>
}

/** The rest of the account actions, inside the mobile menu. */
async function MobileMenuUser() {
  const viewer = await getViewer()
  if (!viewer) return <Link href="/signup" className="btn btn-sm">Sign up</Link>
  return (
    <>
      {viewer.isAdmin && <Link href="/admin" className="btn btn-sm btn-ghost">Admin</Link>}
      <form action={logoutAction}><button className="btn btn-sm">Log out</button></form>
    </>
  )
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <Image src="/logo.svg" alt="" width={30} height={30} className="h-8 w-8" />
      <span>Givora <span className="font-normal text-[#8f8f8f]">World</span></span>
    </Link>
  )
}

export default function Header() {
  const fallback = <span className="h-8 w-28" />
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-black/80 backdrop-blur-xl">
      <div className="container-x relative flex h-14 items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            <Suspense fallback={null}><NavLinks /></Suspense>
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Suspense fallback={fallback}><UserNav /></Suspense>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Suspense fallback={<span className="h-8 w-20" />}><MobileQuick /></Suspense>
          <Suspense fallback={<span className="size-9" />}>
            <MobileMenu>
              <Suspense fallback={fallback}><MobileMenuUser /></Suspense>
            </MobileMenu>
          </Suspense>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[rgba(25,255,160,.35)] to-transparent" />
    </header>
  )
}
