import 'server-only'

/** Sends the gift link. Without RESEND_API_KEY it only logs (the buyer can still copy the link). */
export async function sendGiftEmail(to: string, link: string, title: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn(`[email disabled] gift for ${to}: ${link}`)
    return { sent: false }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'Givora <onboarding@resend.dev>',
      to,
      subject: `You received a gift: ${title}`,
      html: `<p>You have been gifted <b>${title}</b> on Givora World.</p><p><a href="${link}">Redeem your gift</a></p>`,
    }),
  })
  return { sent: res.ok }
}
