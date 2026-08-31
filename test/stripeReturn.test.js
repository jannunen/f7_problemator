import { describe, it, expect } from 'vitest'
import { wasReturnedFromStripeCheckout } from '../src/js/helpers/stripeReturn.js'

describe('wasReturnedFromStripeCheckout', () => {
  it('recognises the flag in a real query string (pushState URLs)', () => {
    expect(wasReturnedFromStripeCheckout('?subscribed=1', '')).toBe(true)
  })

  it('recognises the flag inside a hash-routed URL (the backend default)', () => {
    expect(wasReturnedFromStripeCheckout('', '#!/training?subscribed=1')).toBe(true)
  })

  it('is false on an ordinary load with neither', () => {
    expect(wasReturnedFromStripeCheckout('', '')).toBe(false)
    expect(wasReturnedFromStripeCheckout('?foo=bar', '#!/training')).toBe(false)
  })

  it('is false for subscribed=0 or any other value', () => {
    expect(wasReturnedFromStripeCheckout('?subscribed=0', '')).toBe(false)
    expect(wasReturnedFromStripeCheckout('?subscribed=true', '')).toBe(false)
  })

  it('survives missing arguments instead of throwing', () => {
    expect(wasReturnedFromStripeCheckout(undefined, undefined)).toBe(false)
    expect(wasReturnedFromStripeCheckout(null, null)).toBe(false)
  })
})
