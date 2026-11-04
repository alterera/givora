declare module '@cashfreepayments/cashfree-js' {
  type CheckoutResult = { error?: { message: string }; redirect?: boolean } | undefined
  export function load(opts: { mode: 'sandbox' | 'production' }): Promise<{
    checkout(opts: { paymentSessionId: string; redirectTarget?: '_self' | '_blank' | '_top' | '_modal' }): Promise<CheckoutResult>
  }>
}
