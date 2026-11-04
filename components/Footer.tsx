import Link from 'next/link'
import { Logo } from './Header'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--line)]">
      <div className="container-x py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3 max-w-xs">
          <Logo />
          <p className="text-sm text-[#8f8f8f]">Limited-edition digital art, rendered as living clouds of light. Collect it, keep it, gift it.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[#a1a1a1]">
          <span className="eyebrow mb-1">Explore</span>
          <Link href="/#collection" className="link-underline w-fit">Collection</Link>
          <Link href="/#how" className="link-underline w-fit">How it works</Link>
          <Link href="/profile" className="link-underline w-fit">My collection</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm text-[#a1a1a1]">
          <span className="eyebrow mb-1">Account</span>
          <Link href="/login" className="link-underline w-fit">Log in</Link>
          <Link href="/#gifting" className="link-underline w-fit">Redeem a gift</Link>
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="container-x py-5 flex flex-wrap justify-between gap-2 text-xs text-[#6b6b6b] mono">
          <span>© Givora World</span>
          <span>Digital goods · No physical delivery</span>
        </div>
      </div>
    </footer>
  )
}
