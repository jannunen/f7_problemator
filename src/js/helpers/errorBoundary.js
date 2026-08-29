/**
 * The decisions an error boundary has to make, kept out of the component so
 * they can be tested.
 *
 * A boundary that always offers "Try again" is a trap. Retry re-renders the
 * same subtree with the same state, so it only helps when the cause was
 * transient — a request that failed, a race that lost. For the other common
 * class, a value that is null when the code assumed it was not, retry throws
 * again immediately and the button becomes a loop the user presses forever.
 *
 * So the boundary counts. The first failure on a screen gets a retry. A second
 * failure of the same error on the same screen does not: at that point it is a
 * bug, and saying so is more honest than inviting another attempt.
 */

/** Retries offered for one screen before we conclude it is a bug, not a blip. */
export const MAX_RETRIES = 1

/**
 * Identifies a failure well enough to tell "the same thing broke again" from
 * "something else broke". The message carries the useful part — which property
 * was read off what — and the route scopes it, so navigating elsewhere and
 * hitting an unrelated error starts its own count.
 */
export function errorSignature(error, routePath = '') {
  const message = (error && (error.message || String(error))) || 'unknown'
  return `${routePath}::${message}`
}

/**
 * What the boundary should do with a caught error.
 *
 * `previous` is the state it is holding: the last signature it saw and how
 * many times it has retried that signature.
 */
export function nextBoundaryState(error, routePath, previous = {}) {
  const signature = errorSignature(error, routePath)
  const repeated = previous.signature === signature
  const retries = repeated ? (previous.retries || 0) : 0

  return {
    signature,
    retries,
    // A different error on the same screen is a fresh problem and gets its own
    // allowance, which is why retries resets rather than accumulating.
    canRetry: retries < MAX_RETRIES,
    message: (error && error.message) || String(error || 'Unknown error'),
  }
}

/** After the user presses Try again, so a second failure is not offered a third. */
export function afterRetry(state) {
  return { ...state, retries: (state.retries || 0) + 1, canRetry: false }
}
