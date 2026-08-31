/**
 * Whether this page load is a return trip from Stripe Checkout's
 * success_url, which carries ?subscribed=1.
 *
 * Takes the raw search and hash strings rather than reading window.location
 * itself, so the one decision worth getting right — did the climber just pay
 * — is testable without a DOM. Checked in both places deliberately: the
 * backend's STRIPE_RETURN_URL is server-configured, and its documented
 * default (config/coaching.php) targets Framework7's old hash-style routing
 * (.../#!/training) even though the app has since moved to real pushState
 * URLs — see platform.js's useBrowserHistory. Reading both shapes means the
 * client behaves correctly whichever one production actually has set.
 */
export function wasReturnedFromStripeCheckout(search, hash) {
  if (new URLSearchParams(search ?? '').get('subscribed') === '1') return true

  const hashQuery = (hash ?? '').split('?')[1] ?? ''
  return new URLSearchParams(hashQuery).get('subscribed') === '1'
}
