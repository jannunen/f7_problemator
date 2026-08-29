import { describe, it, expect } from 'vitest'
import { historyRootFrom } from '../src/js/platform.js'

/**
 * The root Framework7 pushes history against.
 *
 * This is a hard failure, not a soft one: pushState refuses any URL whose
 * origin differs from the document's, so a root that is wrong by one port
 * number throws SecurityError on every navigation and the app stops moving.
 *
 * It used to be VITE_REDIRECT_URI, pinned to https://localhost:3002/, while
 * vite.config.js asked for 3002 without insisting on it — so a second dev
 * server on 3003 broke every route against the first one's origin.
 */
describe('historyRootFrom', () => {
  it('follows whatever port the dev server actually got', () => {
    expect(historyRootFrom('https://localhost:3003')).toBe('https://localhost:3003/')
    expect(historyRootFrom('https://localhost:3002')).toBe('https://localhost:3002/')
  })

  it('works the same for the public app', () => {
    expect(historyRootFrom('https://pwa.problemator.fi')).toBe('https://pwa.problemator.fi/')
  })

  // Framework7 strips this prefix off the URL, so a missing slash would leave
  // the leading slash of every route glued to the origin.
  it('always ends in a slash, and never doubles one', () => {
    expect(historyRootFrom('https://example.test/')).toBe('https://example.test/')
    expect(historyRootFrom('https://example.test')).toBe('https://example.test/')
  })

  /**
   * Native builds never use this — useBrowserHistory is false inside a
   * Capacitor shell — but the module is imported there all the same, so it
   * has to produce something rather than throw on the way past.
   */
  it('falls back to a bare root when there is no origin to read', () => {
    expect(historyRootFrom('')).toBe('/')
    expect(historyRootFrom(undefined)).toBe('/')
    expect(historyRootFrom(null)).toBe('/')
  })
})
