import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { unref } from 'vue'
import { queries } from '../src/js/queryKeys.js'
import { authToken, isAuthenticated, setAuthToken, readStoredToken } from '../src/js/authToken.js'

/**
 * The gym list arriving empty because the request went out before auth did.
 *
 * GET /api/v03/gym sits behind auth:api and answers 401 with no token. The
 * response interceptor only recovers a 401 when there is a token to refresh,
 * so an unauthenticated one is rejected outright; TanStack retries three
 * times over about seven seconds and then settles in error. Nothing refetches
 * on login — the key is ['gyms'] with no auth in it, and nothing in the store
 * invalidates it — so the list stays empty until the app is reloaded.
 *
 * Whether it happens at all comes down to whether sign-in finished inside
 * those seven seconds, which is why it is intermittent.
 *
 * Every other query in queryKeys.js is already gated: badges wait for a gym
 * id via `enabled: needs(gymid)`. gyms was the one that waited for nothing.
 */
describe('the gyms query', () => {
  beforeEach(() => setAuthToken(null))

  it('does not fire before there is a token', () => {
    expect(unref(queries.gyms().enabled)).toBe(false)
  })

  it('fires once there is one', () => {
    setAuthToken('a.real.jwt')
    expect(unref(queries.gyms().enabled)).toBe(true)
  })

  /**
   * The actual bug. The query is created while signed out and must start on
   * its own when the token lands — a guard that is only read once would leave
   * the list exactly as empty as no guard at all.
   */
  it('turns itself on when the token arrives, without being recreated', () => {
    const gyms = queries.gyms()
    expect(unref(gyms.enabled)).toBe(false)

    setAuthToken('a.real.jwt')

    expect(unref(gyms.enabled)).toBe(true)
  })

  it('stops again on sign-out', () => {
    setAuthToken('a.real.jwt')
    setAuthToken(null)
    expect(unref(queries.gyms().enabled)).toBe(false)
  })
})

/**
 * gyms was reported, but it was never the only one: every query whose
 * endpoint sits behind auth:api has the same failure, and each was verified
 * against the running API to answer 401 with no token.
 *
 * This is the regression guard. A new query over an authenticated endpoint
 * that forgets its gate fails here rather than in somebody's empty list.
 */
describe('every query over an authenticated endpoint', () => {
  const AUTHENTICATED = ['gyms', 'competitions', 'feed']

  beforeEach(() => setAuthToken(null))

  it.each(AUTHENTICATED)('waits for sign-in: %s', (name) => {
    expect(unref(queries[name]().enabled)).toBe(false)
    setAuthToken('a.real.jwt')
    expect(unref(queries[name]().enabled)).toBe(true)
  })
})

describe('readStoredToken', () => {
  const stub = (value) => {
    vi.stubGlobal('localStorage', {
      getItem: () => value,
      setItem: () => {},
      removeItem: () => {},
    })
  }

  afterEach(() => vi.unstubAllGlobals())

  it('reads a token left by a previous session', () => {
    stub('a.real.jwt')
    expect(readStoredToken()).toBe('a.real.jwt')
  })

  /**
   * setToken() wrote `localStorage.setItem('token', payload)` with no guard,
   * so signing out stored the *string* "null". The interceptor already had to
   * special-case it; anything else reading the token has to as well, or a
   * signed-out app looks signed in.
   */
  it('does not mistake the string "null" for a token', () => {
    stub('null')
    expect(readStoredToken()).toBeNull()
    stub('undefined')
    expect(readStoredToken()).toBeNull()
  })

  it('survives an environment with no localStorage at all', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(readStoredToken()).toBeNull()
  })
})

describe('authToken', () => {
  it('is the one place the token lives', () => {
    setAuthToken('a.real.jwt')
    expect(authToken.value).toBe('a.real.jwt')
    expect(isAuthenticated.value).toBe(true)
  })
})
