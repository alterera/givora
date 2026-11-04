import Link from 'next/link'
import LegalPage from '@/components/LegalPage'

export const metadata = { title: 'Privacy Policy · Givora World' }

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal" title="Privacy Policy" updated="1 November 2026"
      intro="We collect as little as we need to sell you a piece and keep its record accurate. This page explains what, why and who else sees it."
      sections={[
        { title: 'What we collect', body: <p>Your email address, your order and ownership history, and, if you create an account, your login details and optional public handle. If you subscribe to updates, we store that email too.</p> },
        { title: 'Why we use it', body: <p>To process your order, deliver your piece or gift, maintain its public history, send receipts and gift emails, and, if you opted in, send news about drops and price changes.</p> },
        { title: 'What is public', body: <p>A piece’s certificate shows its serial, artist, mint date, fingerprint, sale prices and a collector handle. Your email address is never shown. You can hide your handle in your profile.</p> },
        { title: 'Who processes it', body: <p>Cashfree handles payments. Supabase hosts our database and sign-in. An email provider delivers our messages. They only receive what they need to do their job.</p> },
        { title: 'Cookies', body: <p>We use cookies that keep you signed in and secure your session. We do not use advertising cookies.</p> },
        { title: 'Your choices', body: <p>You can unsubscribe from updates at any time, and ask us to correct or delete your account data. Records that form a piece’s public history may be kept in anonymised form so the history stays intact.</p> },
        { title: 'Contact', body: <p>Privacy questions go to the contact on our <Link href="/about" className="text-[var(--g)] underline">About page</Link>.</p> },
      ]}
    />
  )
}
