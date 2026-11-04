export const inr = (n: number | string) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

/** Stable date label from an ISO string (UTC, so server and client agree). */
export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Resale money split, mirrored from fulfill_resale() so previews match the ledger. */
export function splitResale(price: number, feeBps: number, royaltyBps: number) {
  const fee = Math.round((price * feeBps) / 100) / 100
  const royalty = Math.round((price * royaltyBps) / 100) / 100
  return { fee, royalty, seller: Math.round((price - fee - royalty) * 100) / 100 }
}

export const PLATFORM_FEE_BPS = 500
