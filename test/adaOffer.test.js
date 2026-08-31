import { describe, it, expect } from 'vitest'
import { isAdaOfferDismissed, dismissAdaOffer, shouldShowAdaCard } from '../src/js/helpers/adaOffer.js'

// A minimal stand-in for localStorage — vitest here runs with environment:
// 'node', so there is no real one to reach for.
function fakeStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
  }
}

describe('isAdaOfferDismissed / dismissAdaOffer', () => {
  it('is not dismissed until dismissAdaOffer is called', () => {
    const storage = fakeStorage()
    expect(isAdaOfferDismissed(storage)).toBe(false)
    dismissAdaOffer(storage)
    expect(isAdaOfferDismissed(storage)).toBe(true)
  })

  it('survives with no storage at all rather than throwing', () => {
    expect(isAdaOfferDismissed(null)).toBe(false)
    expect(() => dismissAdaOffer(null)).not.toThrow()
  })
})

describe('shouldShowAdaCard', () => {
  it('shows only when the backend offers it and it has not been dismissed', () => {
    expect(shouldShowAdaCard(true, false)).toBe(true)
  })

  it('never shows once dismissed, even if should_offer is still true', () => {
    expect(shouldShowAdaCard(true, true)).toBe(false)
  })

  it('never shows when the backend says not to, dismissed or not', () => {
    expect(shouldShowAdaCard(false, false)).toBe(false)
    expect(shouldShowAdaCard(false, true)).toBe(false)
  })

  it('treats a missing should_offer as false rather than throwing', () => {
    expect(shouldShowAdaCard(undefined, false)).toBe(false)
    expect(shouldShowAdaCard(null, false)).toBe(false)
  })
})
