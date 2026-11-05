import Link from 'next/link'
import LegalPage from '@/components/LegalPage'

export const metadata = {
  title: 'Terms of Use',
  description: 'The terms governing purchases, ownership, gifting and resale on Givora World.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal" title="Terms of Use" updated="1 November 2026"
      intro="These terms govern your use of Givora World and your purchase, ownership, gifting and resale of digital artworks on it. By using the site you agree to them."
      sections={[
        { title: 'The service', body: <p>Givora World sells and hosts one-of-one digital particle artworks. Each piece has a unique serial number, a generative seed and a public certificate showing its history.</p> },
        { title: 'Accounts', body: <p>You can check out with an email address. To list a piece for resale, or to see your collection, you need an account. You are responsible for keeping your login secure and for activity under your account.</p> },
        { title: 'What you own', body: <p>Buying a piece gives you ownership of that single edition, recorded on its certificate. The artist keeps the copyright in the underlying artwork. You receive a personal, non-exclusive licence to display the piece and to resell or gift your edition.</p> },
        { title: 'Payments', body: <p>Prices are shown in Indian rupees. Payments are processed by Cashfree; we never see or store your card details. An order is complete only when the payment is confirmed.</p> },
        { title: 'Gifts and resale', body: <p>Gifts are delivered by a private claim link. Whoever holds an unclaimed link can claim the piece, so share it carefully. Resales are added to the piece’s public history; a platform fee and the artist’s royalty are deducted from the sale price as shown at listing time.</p> },
        { title: 'Acceptable use', body: <p>Do not attempt to copy, scrape or tamper with the artworks, interfere with checkout, or use the site for anything unlawful. We may suspend accounts that do.</p> },
        { title: 'Liability', body: <p>The service is provided as is. To the extent the law allows, our liability for any claim is limited to the amount you paid for the piece concerned.</p> },
        { title: 'Changes and contact', body: <p>We may update these terms; the date above shows the latest version. Questions? Use the contact details on the <Link href="/about" className="text-[var(--g)] underline">About page</Link>.</p> },
      ]}
    />
  )
}
