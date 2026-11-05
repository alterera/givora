import 'server-only'
import { inr } from '@/lib/format'
import { SITE_NAME, SITE_URL } from '@/lib/site'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * Sender. `onboarding@resend.dev` only delivers to the Resend account owner: set EMAIL_FROM to an address
 * on a domain you have verified in Resend (e.g. "Givora World <no-reply@yourdomain.com>") to reach everyone.
 */
const FROM = () => process.env.EMAIL_FROM ?? `${SITE_NAME} <hello@givoraworld.com>`

type Mail = { to: string; subject: string; html: string; text: string }

/** One place that talks to Resend. Never throws: email trouble must not break checkout or login flows. */
export async function sendEmail({ to, subject, html, text }: Mail): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn(`[email disabled] "${subject}" for ${to}`)
    return { sent: false, error: 'RESEND_API_KEY is not set' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM(), to, subject, html, text }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] Resend rejected "${subject}" (${res.status}): ${body.slice(0, 300)}`)
      return { sent: false, error: `Resend ${res.status}` }
    }
    return { sent: true }
  } catch (e) {
    console.error('[email] send failed:', e instanceof Error ? e.message : e)
    return { sent: false, error: 'network' }
  }
}

/* ───────────── shared dark, green-accented template ───────────── */

const G = '#19ffa0'

function shell(preheader: string, heading: string, inner: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#000;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#050a07;border:1px solid #12392a;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#ededed;">
<tr><td style="padding:24px 28px;border-bottom:1px solid #12392a;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:${G};font-weight:600;">${SITE_NAME}</td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;color:#fff;">${heading}</h1>
${inner}
${cta ? `<p style="margin:28px 0 4px;"><a href="${cta.href}" style="display:inline-block;background:${G};color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;">${esc(cta.label)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #12392a;font-size:12px;color:#5f7f70;">${SITE_NAME} · <a href="${SITE_URL}" style="color:#5f7f70;">${SITE_URL.replace(/^https?:\/\//, '')}</a></td></tr>
</table></td></tr></table></body></html>`
}

const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#b4b4b4;">${t}</p>`
const row = (k: string, v: string) => `<tr><td style="padding:9px 0;border-bottom:1px solid #12251c;font-size:13px;color:#6fa88f;">${k}</td><td style="padding:9px 0;border-bottom:1px solid #12251c;font-size:14px;color:#ededed;text-align:right;font-family:ui-monospace,Menlo,Consolas,monospace;">${v}</td></tr>`
const table = (rows: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;">${rows}</table>`

/* ───────────── password reset OTP ───────────── */

export function sendOtpEmail(to: string, code: string, minutes: number) {
  const spaced = code.split('').join('&nbsp;')
  return sendEmail({
    to,
    subject: `${code} is your ${SITE_NAME} password reset code`,
    text: `Your ${SITE_NAME} password reset code is ${code}. It expires in ${minutes} minutes. If you did not ask for this, you can ignore this email.`,
    html: shell(`Your code is ${code}`, 'Reset your password',
      p('Use this one-time code to choose a new password. It expires in ' + minutes + ' minutes.') +
      `<p style="margin:22px 0;padding:18px;text-align:center;background:#000;border:1px solid #12392a;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:34px;letter-spacing:.2em;color:${G};">${spaced}</p>` +
      p('If you did not request this, ignore this email. Your password will not change, and nobody can reset it without this code.')),
  })
}

/* ───────────── purchase receipt ───────────── */

export type ReceiptDetails = {
  title: string
  serial: string | null
  amount: number | string
  orderId: string
  kind: 'primary' | 'resale'
  isGift: boolean
  giftRecipient?: string | null
  /** Claim link for a gift the buyer must pass on themselves (no recipient email given). */
  shareLink?: string | null
}

export function sendPurchaseEmail(to: string, d: ReceiptDetails) {
  const certificate = d.serial ? `${SITE_URL}/certificate/${d.serial}` : null
  const rows =
    row('Piece', esc(d.title)) +
    (d.serial ? row('Serial', esc(d.serial)) : '') +
    row('Amount paid', inr(d.amount)) +
    row('Order ID', esc(d.orderId)) +
    row('Type', d.kind === 'resale' ? 'Collector purchase' : d.isGift ? 'Gift' : 'Purchase')

  let body = p('Thank you. Your payment was received and the piece is recorded in its public history.') + table(rows)
  let cta: { label: string; href: string } | undefined = { label: 'View your collection', href: `${SITE_URL}/profile` }
  if (d.isGift) {
    if (d.giftRecipient) body += p(`We have emailed your gift to <b style="color:#fff">${esc(d.giftRecipient)}</b>. You will be recorded in the piece’s history as the person who gave it.`)
    else if (d.shareLink) {
      body += p('Your gift is ready. Share this private link with the person you are gifting it to. Whoever opens it first can claim the piece.')
      body += `<p style="margin:0 0 6px;word-break:break-all;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;"><a href="${d.shareLink}" style="color:${G};">${esc(d.shareLink)}</a></p>`
      cta = { label: 'Open gift link', href: d.shareLink }
    }
  }
  if (certificate) body += p(`Public certificate: <a href="${certificate}" style="color:${G};">${esc(certificate)}</a>`)

  return sendEmail({
    to,
    subject: `Your ${SITE_NAME} order: ${d.title}`,
    text: `Thank you for your order.\n\nPiece: ${d.title}\n${d.serial ? `Serial: ${d.serial}\n` : ''}Amount: ${inr(d.amount)}\nOrder ID: ${d.orderId}\n${certificate ? `Certificate: ${certificate}\n` : ''}${d.shareLink ? `Gift link: ${d.shareLink}\n` : ''}`,
    html: shell(`Order confirmed: ${d.title}`, 'Order confirmed', body, cta),
  })
}

/* ───────────── gift received ───────────── */

const OCCASIONS: Record<string, string> = { birthday: 'a birthday gift', 'thank-you': 'a thank-you gift', anniversary: 'an anniversary gift', 'just-because': 'a gift, just because' }

export function sendGiftReceivedEmail(
  to: string, link: string, title: string,
  note?: { sender?: string | null; message?: string | null; occasion?: string | null },
) {
  const who = note?.sender?.trim() || 'Someone'
  const occasion = note?.occasion && OCCASIONS[note.occasion] ? ` as ${OCCASIONS[note.occasion]}` : ''
  const quote = note?.message
    ? `<blockquote style="margin:18px 0;padding:4px 0 4px 16px;border-left:3px solid ${G};font-size:15px;line-height:1.6;color:#ededed;font-style:italic;">${esc(note.message)}</blockquote>`
    : ''
  return sendEmail({
    to,
    subject: `${who} sent you a piece of art`,
    text: `${who} gifted you "${title}"${occasion}, a one-of-one digital artwork on ${SITE_NAME}.\n${note?.message ? `\n"${note.message}"\n` : ''}\nUnwrap your gift: ${link}`,
    html: shell(`${who} sent you "${title}"`, `${esc(who)} sent you a gift`,
      p(`${esc(who)} gifted you <b style="color:#fff">${esc(title)}</b>${occasion}, a one-of-one digital artwork. There is only one copy, and it is yours once you claim it.`) +
      quote +
      p('The link below is private. Open it to unwrap the piece and add it to your collection.'),
      { label: 'Unwrap your gift', href: link }),
  })
}

/** Kept for the "email the gift link" button on the gift page. */
export async function sendGiftEmail(
  to: string, link: string, title: string, note?: { sender?: string | null; message?: string | null; occasion?: string | null },
) {
  const { sent } = await sendGiftReceivedEmail(to, link, title, note)
  return { sent }
}
