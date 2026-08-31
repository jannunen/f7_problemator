import { describe, it, expect } from 'vitest'
import { isTrialExhausted, canManageSubscription } from '../src/js/helpers/adaSubscription.js'

describe('isTrialExhausted', () => {
  it('is true only for the needs_subscription 402 shape', () => {
    expect(isTrialExhausted({ needs_subscription: true })).toBe(true)
  })

  it('is false for an unrelated error, even with a similar-looking body', () => {
    expect(isTrialExhausted({ error: 'Something else went wrong' })).toBe(false)
    expect(isTrialExhausted({ needs_subscription: false })).toBe(false)
  })

  it('survives a missing or malformed response body instead of throwing', () => {
    expect(isTrialExhausted(null)).toBe(false)
    expect(isTrialExhausted(undefined)).toBe(false)
  })
})

describe('canManageSubscription', () => {
  it('is false for a climber who has never gone through Stripe Checkout', () => {
    expect(canManageSubscription(null)).toBe(false)
    expect(canManageSubscription(undefined)).toBe(false)
    expect(canManageSubscription('trialing')).toBe(false)
  })

  it('is true for any status that implies a Stripe customer exists', () => {
    expect(canManageSubscription('active')).toBe(true)
    expect(canManageSubscription('past_due')).toBe(true)
    expect(canManageSubscription('canceled')).toBe(true)
  })
})
