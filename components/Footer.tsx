import HalftoneWordmarkFooter from '@/components/ui/halftone-wordmark-footer'

const COLUMNS = [
  { title: 'Explore', links: [{ label: 'Collection', href: '/collection' }, { label: 'Marketplace', href: '/market' }, { label: 'How it works', href: '/how-it-works' }] },
  { title: 'Account', links: [{ label: 'Log in', href: '/login' }, { label: 'My collection', href: '/profile' }, { label: 'Redeem a gift', href: '/how-it-works#gifting' }] },
  { title: 'Legal', links: [{ label: 'Terms of Use', href: '/terms' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Refund Policy', href: '/refund-policy' }, { label: 'About Us', href: '/about' }, { label: 'Certificate Check', href: '/verify' }] },
]

export default function Footer() {
  return (
    <div className="mt-auto w-full border-t border-[var(--line)]">
      <HalftoneWordmarkFooter
        wordmark="givora"
        label="Givora World"
        meta="© 2018 - 2026 · One-of-one digital art"
        columns={COLUMNS}
        preset="night"
        palette={{ background: '#000', ink: '#c9ffe8', warm: '#19ffa0' }}
        fontFamily='"Helvetica Neue", Arial, system-ui, sans-serif'
        monoFamily='var(--font-geist-mono), ui-monospace, monospace'
        height="520px"
      />
    </div>
  )
}
