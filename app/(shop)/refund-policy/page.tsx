import Link from 'next/link'
import LegalPage from '@/components/LegalPage'

export const metadata = { title: 'Refund Policy · Givora World' }

export default function RefundPage() {
  return (
    <LegalPage
      eyebrow="Legal" title="Refund Policy" updated="1 November 2026"
      intro="Every piece is a unique, one-of-one original, so refunds are limited. Here is exactly when we do and do not refund."
      sections={[
        { title: 'Sales are final', body: <p>Once a piece has been delivered to your collection or a gift link has been created, the sale is final. Because each piece exists only once, we cannot take it back and resell it as new.</p> },
        { title: 'When we refund in full', body: (<ul className="list-disc space-y-1 pl-5"><li>You were charged but the order failed, expired or was never confirmed.</li><li>You were charged twice for the same order.</li><li>The piece you paid for was sold to someone else first.</li><li>A technical fault on our side prevents you from accessing the piece you bought, and we cannot fix it.</li></ul>) },
        { title: 'Gifts', body: <p>An unclaimed gift can be refunded to the purchaser while its claim link is still unused. Once the recipient claims it, it is theirs and the sale is final.</p> },
        { title: 'Resale purchases', body: <p>Pieces bought from another collector follow the same rules. If a resale fails after payment, you are refunded in full.</p> },
        { title: 'How refunds are paid', body: <p>Approved refunds go back to the original payment method through Cashfree. Banks usually take 5 to 7 working days to show them.</p> },
        { title: 'How to ask', body: <p>Write to us with your order email and order ID using the contact on our <Link href="/about" className="text-[var(--g)] underline">About page</Link>. We aim to reply within 2 working days.</p> },
      ]}
    />
  )
}
