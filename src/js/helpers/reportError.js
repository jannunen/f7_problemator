/**
 * The last net, for errors no boundary sees.
 *
 * Two paths reach here that onErrorCaptured never does:
 *
 *   - errors thrown outside a component's render/lifecycle, which Vue routes
 *     to app.config.errorHandler
 *   - unhandled promise rejections, which Vue never sees at all. A failed
 *     store.dispatch inside onMounted with no .catch is invisible today: the
 *     screen simply never gets its data and sits there looking hung.
 *
 * Both used to be silent. Silent is the worst outcome — the user cannot tell a
 * slow request from a dead screen, so they wait.
 */

/**
 * How long the same message is suppressed before it can toast again.
 *
 * A poll that fails every few seconds must not produce a toast every few
 * seconds. The console still gets every occurrence; only the interruption is
 * rate-limited.
 */
export const TOAST_COOLDOWN_MS = 10_000

const lastShown = new Map()

/** Whether this message should interrupt the user, given what we showed recently. */
export function shouldToast(message, now = Date.now(), cooldown = TOAST_COOLDOWN_MS) {
  const previous = lastShown.get(message)
  if (previous != null && now - previous < cooldown) return false
  lastShown.set(message, now)
  return true
}

/** For tests, and for a sign-out that should not inherit the old session's noise. */
export function resetToastCooldown() {
  lastShown.clear()
}

/** A short line for a human. The detail goes to the console, not the toast. */
export function userMessage(error) {
  const raw = (error && (error.message || error.reason?.message)) || ''

  // Network failures are worth naming: the user can act on them, and in a gym
  // they are the most likely cause by far.
  if (/network|fetch|timeout|ERR_INTERNET|Failed to fetch/i.test(raw)) {
    return 'Lost connection to the server. Check your network and try again.'
  }

  return 'Something went wrong. The screen may not be up to date.'
}

/**
 * Installs both nets. Called once, from the entry point.
 * `toast` is passed in rather than imported so this stays testable and so the
 * two apps can surface errors their own way.
 */
export function installErrorReporting(app, toast) {
  app.config.errorHandler = (error, instance, info) => {
    console.error(`[app] error during ${info}`, error, instance)
    const message = userMessage(error)
    if (toast && shouldToast(message)) toast(message)
  }

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[app] unhandled promise rejection', event.reason)
    const message = userMessage(event.reason)
    if (toast && shouldToast(message)) toast(message)
  })
}
