import 'server-only'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Sends the gift link. Without RESEND_API_KEY it only logs (the buyer can still copy the link). */
export async function sendGiftEmail(
  to: string, link: string, title: string, note?: { sender?: string | null; message?: string | null },
) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn(`[email disabled] gift for ${to}: ${link}`)
    return { sent: false }
  }
  const from = note?.sender ? esc(note.sender) : 'Someone'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'Givora <onboarding@resend.dev>',
      to,
      subject: `${note?.sender ?? 'Someone'} sent you a piece of art`,
      html: `<p>${from} gifted you <b>${esc(title)}</b>, a one-of-one digital artwork on Givora World.</p>` +
        (note?.message ? `<blockquote style="border-left:3px solid #000;padding-left:12px">${esc(note.message)}</blockquote>` : '') +
        `<p><a href="${link}">Unwrap your gift</a></p>`,
    }),
  })
  return { sent: res.ok }
}
