import { describe, it, expect } from 'vitest'
import {
  isWindingDown,
  accessEndsAt,
  canEndCoaching,
  endCoachingWarnings
} from '../src/js/helpers/coachingEnd.js'

describe('isWindingDown', () => {
  // The whole reason the flag exists: status alone cannot tell these apart.
  it('separates a cancelled subscription from a live one with the same status', () => {
    expect(isWindingDown({ status: 'active', cancel_at_period_end: true })).toBe(true)
    expect(isWindingDown({ status: 'active', cancel_at_period_end: false })).toBe(false)
  })

  it('is false once the subscription has actually ended', () => {
    expect(isWindingDown({ status: 'canceled', cancel_at_period_end: true })).toBe(false)
  })

  it('survives a missing state instead of throwing', () => {
    expect(isWindingDown(null)).toBe(false)
    expect(isWindingDown({})).toBe(false)
  })
})

describe('accessEndsAt', () => {
  it('parses the date access runs out', () => {
    const date = accessEndsAt({ access_until: '2026-10-08T12:00:00+00:00' })
    expect(date).toBeInstanceOf(Date)
    expect(date.toISOString()).toBe('2026-10-08T12:00:00.000Z')
  })

  it('renders nothing rather than an Invalid Date', () => {
    expect(accessEndsAt({ access_until: 'not a date' })).toBeNull()
    expect(accessEndsAt({ access_until: null })).toBeNull()
    expect(accessEndsAt(null)).toBeNull()
  })
})

describe('canEndCoaching', () => {
  it('is true only when there is a relationship row to end', () => {
    expect(canEndCoaching({ hired: true, relationship_id: 12 })).toBe(true)
  })

  it('is false when not hired, or hired without an id to act on', () => {
    expect(canEndCoaching({ hired: false, relationship_id: 12 })).toBe(false)
    expect(canEndCoaching({ hired: true, relationship_id: null })).toBe(false)
    expect(canEndCoaching(null)).toBe(false)
  })
})

describe('endCoachingWarnings', () => {
  it('says the programme stays, because ending the coaching does not stop it', () => {
    const warnings = endCoachingWarnings({ status: 'trialing' }, { hasActiveProgramme: true })
    expect(warnings).toContain('programme_stays')
  })

  it('says the subscription keeps billing when one actually is', () => {
    const warnings = endCoachingWarnings({ status: 'active', cancel_at_period_end: false })
    expect(warnings).toContain('subscription_stays')
  })

  // Warning about a charge that is not coming is worse than not warning:
  // it is untrue, and it teaches climbers to ignore the dialog.
  it('does not claim a trial or an already-cancelled subscription will keep billing', () => {
    expect(endCoachingWarnings({ status: 'trialing' })).not.toContain('subscription_stays')
    expect(endCoachingWarnings({ status: null })).not.toContain('subscription_stays')
    expect(
      endCoachingWarnings({ status: 'active', cancel_at_period_end: true })
    ).not.toContain('subscription_stays')
  })

  it('says nothing at all when there is nothing left behind', () => {
    expect(endCoachingWarnings({ status: 'trialing' }, { hasActiveProgramme: false })).toEqual([])
  })

  it('says both when both are true', () => {
    const warnings = endCoachingWarnings(
      { status: 'active', cancel_at_period_end: false },
      { hasActiveProgramme: true }
    )
    expect(warnings).toEqual(['programme_stays', 'subscription_stays'])
  })
})
