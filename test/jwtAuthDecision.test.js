import { describe, it, expect } from 'vitest'
import { classifyAuthError } from '../src/js/helpers/jwt.interceptor.js'

/**
 * The pure decision behind the response interceptor's 401 handling.
 *
 * The interceptor itself is not exercised here — it wires axios, a token
 * ref, and module-level refresh state together, and the interesting bug
 * (the Messages page stuck on "Loading…" forever after a 401) lived in the
 * decision, not in the axios plumbing. classifyAuthError is that decision,
 * pulled out so it can be checked directly: given a 401, whether there is a
 * token, whether the request was already retried, and whether the 401 came
 * from the refresh endpoint itself, what should happen next.
 */
describe('classifyAuthError', () => {
  const base = {
    status: 401,
    isRefreshRequest: false,
    alreadyRetried: false,
    hasToken: true,
    isRefreshing: false,
  }

  it('ignores anything that is not a 401', () => {
    expect(classifyAuthError({ ...base, status: 500 })).toBe('ignore')
    expect(classifyAuthError({ ...base, status: 404 })).toBe('ignore')
    expect(classifyAuthError({ ...base, status: undefined })).toBe('ignore')
  })

  /**
   * The reported bug: `{"message":"Unauthenticated."}` is Laravel's default
   * body, but the coaching endpoints answer `{"error":"Unauthenticated"}`
   * instead. classifyAuthError never looks at the body at all — status 401
   * is the only thing that reaches it — so both shapes (and anything else)
   * are handled identically.
   */
  it('does not need the response body to decide anything', () => {
    expect(classifyAuthError(base)).toBe('refresh')
  })

  it('refreshes a 401 with a token, not already retried, no refresh in flight', () => {
    expect(classifyAuthError(base)).toBe('refresh')
  })

  it('queues a 401 while a refresh is already in flight', () => {
    expect(classifyAuthError({ ...base, isRefreshing: true })).toBe('queue')
  })

  /**
   * The first gap: no token means there is nothing to refresh, but the old
   * code just rejected and stopped, leaving the caller's loading state on
   * forever with nobody signed out and nothing on screen.
   */
  it('is unrecoverable with no token to refresh', () => {
    expect(classifyAuthError({ ...base, hasToken: false })).toBe('unrecoverable')
  })

  it('is unrecoverable with no token even mid-refresh', () => {
    expect(classifyAuthError({ ...base, hasToken: false, isRefreshing: true })).toBe('unrecoverable')
  })

  /**
   * A second 401 on an already-retried request must not fall through
   * silently: refreshing again would just repeat the same failure.
   */
  it('is unrecoverable when a retried request 401s again', () => {
    expect(classifyAuthError({ ...base, alreadyRetried: true })).toBe('unrecoverable')
  })

  it('treats an already-retried request as unrecoverable even with no token', () => {
    expect(classifyAuthError({ ...base, alreadyRetried: true, hasToken: false })).toBe('unrecoverable')
  })

  /**
   * The deadlock: a 401 from the refresh endpoint's own request must never
   * be queued or retried by this same logic — at the moment it fires,
   * isRefreshing is still true for the refresh attempt currently failing, so
   * queuing it would wait on a processQueue() call that only happens after
   * this very request settles. Left alone, it is handled by the refresh
   * flow's own try/catch instead.
   */
  it('leaves the refresh endpoint\'s own 401 to the refresh flow, even while refreshing', () => {
    expect(classifyAuthError({ ...base, isRefreshRequest: true, isRefreshing: true })).toBe('refresh-request')
  })

  it('leaves the refresh endpoint\'s own 401 to the refresh flow regardless of token or retry state', () => {
    expect(classifyAuthError({ ...base, isRefreshRequest: true, hasToken: false })).toBe('refresh-request')
    expect(classifyAuthError({ ...base, isRefreshRequest: true, alreadyRetried: true })).toBe('refresh-request')
  })
})
