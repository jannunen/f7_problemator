/**
 * Leaves the app for a page hosted somewhere else — Stripe Checkout, Stripe's
 * billing portal — the way CompetitionEntry.vue's openPaymentWindow already
 * does for competition payment. A synthetic, immediately-clicked anchor
 * rather than window.open(): both call sites need a new tab (Stripe Checkout
 * refuses to run inside an iframe, which rules out navigating the app's own
 * view), and this is the technique already established in this codebase for
 * exactly that.
 *
 * rel="noopener" is the one addition over the existing precedent — the
 * opened page would otherwise get a handle back to this window.
 */
export function openExternal(url) {
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener'
  link.click()
}
