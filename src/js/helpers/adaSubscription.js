/**
 * The two decisions around Ada's Stripe subscription that are worth
 * pulling out of the component and testing on their own: whether a failed
 * hire means "buy a subscription" rather than "something broke", and
 * whether there is a subscription to manage at all.
 *
 * Neither of these touches Stripe, a URL, or a DOM node — that half
 * (opening the checkout/portal page) lives in externalWindow.js instead,
 * deliberately not tested here. See AdaExplainerPage.vue for how the two
 * connect.
 */

/**
 * True when POST /coaching/virtual/hire failed because the trial is over
 * and there is no active subscription behind it — VirtualCoachController's
 * 402 `needs_subscription` response. Anything else (network error, 500,
 * an unrelated 4xx) is a real failure and stays a real failure; this only
 * recognises the one case with an actual next step.
 */
export function isTrialExhausted(errorResponseData) {
  return !!errorResponseData?.needs_subscription
}

/**
 * Whether the billing portal has anything to show this climber.
 *
 * Mirrors VirtualCoachController::portal()'s own gate — no AiCoachSubscription
 * row (status null) or one still on `trialing` never went through Stripe
 * Checkout, so there is no stripe_customer_id yet and the portal would 422.
 * Checked here so the entry point can simply not be shown, rather than being
 * shown and then failing.
 */
export function canManageSubscription(status) {
  return !!status && status !== 'trialing'
}
