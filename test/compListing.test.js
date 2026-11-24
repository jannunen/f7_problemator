import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { isCompFull, registrationPhase, compListing } from '../src/js/helpers/compListing.js'

dayjs.extend(utc)
const now = dayjs.utc('2026-06-15 12:00:00')
const BEFORE = '2026-06-10 10:00:00'
const AFTER = '2026-06-20 10:00:00'
const LATER = '2026-06-25 10:00:00'

const comp = (over = {}) => ({
  maxcontenders: 0,
  paidregistrations_count: 12,
  participates: false,
  participatesunpaid: false,
  registration_start: BEFORE,
  registration_end: AFTER,
  ...over,
})

describe('isCompFull', () => {
  it('no cap is never full', () => expect(isCompFull(comp({ maxcontenders: 0, paidregistrations_count: 500 }))).toBe(false))
  it('full at the cap, and over it', () => {
    expect(isCompFull(comp({ maxcontenders: 40, paidregistrations_count: 40 }))).toBe(true)
    expect(isCompFull(comp({ maxcontenders: 40, paidregistrations_count: 41 }))).toBe(true)
  })
  it('one spot left is not full', () => expect(isCompFull(comp({ maxcontenders: 40, paidregistrations_count: 39 }))).toBe(false))
})

describe('registrationPhase', () => {
  it('open inside the window', () => expect(registrationPhase(comp(), now)).toBe('open'))
  it('upcoming before the start', () => {
    expect(registrationPhase(comp({ registration_start: AFTER, registration_end: LATER }), now)).toBe('upcoming')
  })
  it('ended after the end', () => {
    expect(registrationPhase(comp({ registration_start: '2026-06-01 10:00:00', registration_end: BEFORE }), now)).toBe('ended')
  })
  it('ended, not upcoming, when only the end is set and it has passed', () => {
    expect(registrationPhase(comp({ registration_start: null, registration_end: BEFORE }), now)).toBe('ended')
  })
  it('a missing bound never restricts', () => {
    expect(registrationPhase(comp({ registration_start: null, registration_end: null }), now)).toBe('open')
    expect(registrationPhase(comp({ registration_start: '0000-00-00 00:00:00', registration_end: AFTER }), now)).toBe('open')
    expect(registrationPhase(comp({ registration_start: BEFORE, registration_end: '' }), now)).toBe('open')
  })
})

describe('compListing', () => {
  it('not registered, registration open: I could still register', () => {
    expect(compListing(comp(), now)).toEqual({ standing: 'open', registration: 'open' })
  })

  it('registered wins over everything else', () => {
    const full = { maxcontenders: 40, paidregistrations_count: 40 }
    expect(compListing(comp({ participates: { id: 1 } }), now).standing).toBe('registered')
    expect(compListing(comp({ participates: { id: 1 }, participatesunpaid: { id: 2 } }), now).standing).toBe('registered')
    expect(compListing(comp({ participates: { id: 1 }, ...full }), now).standing).toBe('registered')
  })

  it('registered but unpaid comes next, also in a full competition', () => {
    expect(compListing(comp({ participatesunpaid: { id: 2 } }), now).standing).toBe('unpaid')
    expect(compListing(comp({ participatesunpaid: { id: 2 }, maxcontenders: 40, paidregistrations_count: 40 }), now).standing).toBe('unpaid')
  })

  it('full: says so, and drops the registration dates', () => {
    expect(compListing(comp({ maxcontenders: 40, paidregistrations_count: 40 }), now)).toEqual({ standing: 'full', registration: null })
  })

  it('a full competition has no registration line even for someone who is in it', () => {
    expect(compListing(comp({ participates: { id: 1 }, maxcontenders: 40, paidregistrations_count: 40 }), now).registration).toBeNull()
  })

  it('registration not open yet: no standing, the line says when it opens', () => {
    expect(compListing(comp({ registration_start: AFTER, registration_end: LATER }), now)).toEqual({ standing: null, registration: 'upcoming' })
  })

  it('registration over: no standing for an outsider, kept for someone registered', () => {
    const closed = { registration_start: '2026-06-01 10:00:00', registration_end: BEFORE }
    expect(compListing(comp(closed), now)).toEqual({ standing: null, registration: 'ended' })
    expect(compListing(comp({ ...closed, participates: { id: 1 } }), now)).toEqual({ standing: 'registered', registration: 'ended' })
  })
})
