import { computed, ref } from 'vue'

/**
 * The one place the access token lives.
 *
 * It used to live in three: localStorage (which the request interceptor read),
 * Vuex `access_token` (which nothing restored on boot, so it said null for a
 * returning user who was in fact signed in), and nowhere reactive at all — so
 * a query could not wait for sign-in even if it wanted to.
 *
 * That last gap is what emptied the gym list. GET /gym is behind auth:api and
 * answers 401 with no token; the query fired on mount regardless, retried for
 * about seven seconds, and settled in error. Nothing refetched on login, so
 * the list stayed empty until the app was reloaded — and whether it happened
 * at all depended on whether sign-in beat the retries.
 *
 * A ref, so `enabled` can be a computed off it and TanStack starts the query
 * itself the moment a token appears.
 */

/**
 * The token a previous session left behind, or null.
 *
 * "null" and "undefined" are checked as strings on purpose: setToken() wrote
 * `localStorage.setItem('token', payload)` with no guard, so signing out
 * stored the literal text. The request interceptor already had to special-case
 * it, which is how we know it happens.
 */
export function readStoredToken() {
  try {
    const stored = localStorage.getItem('token')
    if (!stored || stored === 'null' || stored === 'undefined') return null
    return stored
  } catch {
    // No localStorage at all: a test runner, or a browser with site data
    // blocked. Signed out is the safe reading of "cannot tell".
    return null
  }
}

export const authToken = ref(readStoredToken())

export const isAuthenticated = computed(() => !!authToken.value)

/** Set or clear the token, keeping localStorage and the ref in step. */
export function setAuthToken(token) {
  const value = token && token !== 'null' && token !== 'undefined' ? token : null
  authToken.value = value

  try {
    if (value) localStorage.setItem('token', value)
    else localStorage.removeItem('token')
  } catch {
    // Storage being unavailable must not stop the app knowing it is signed
    // in for this session.
  }
}
