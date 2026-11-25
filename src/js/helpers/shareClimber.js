/**
 * The public "my rank and what I climbed" page lives on the backend
 * (GET /climber/{id}/share), so the link is built from the configured API
 * host rather than from wherever this app happens to be served.
 */
export const climberShareUrl = (host, climberId) =>
  `${String(host ?? '').replace(/\/+$/, '')}/climber/${climberId}/share`

/**
 * Opens the native share sheet, or copies the link where there is none
 * (desktop Firefox, an insecure origin). Resolves to what happened —
 * 'shared' | 'cancelled' | 'copied' | 'failed' — so the caller decides what
 * to tell the climber. Never rejects.
 */
export async function shareLink({ url, title, text }, nav = globalThis.navigator) {
  if (typeof nav?.share === 'function') {
    try {
      await nav.share({ url, title, text })
      return 'shared'
    } catch (e) {
      // Closing the sheet is a choice, not a failure: copying the link behind
      // the climber's back would be a surprise. Anything else falls through.
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await nav.clipboard.writeText(url)
    return 'copied'
  } catch (e) {
    return 'failed'
  }
}
