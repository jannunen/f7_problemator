import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import {
  parseBound, isWithinWindow, isCompRunning, isRegistrationOpen, msUntilEnd, windowLabel,
} from '../src/js/helpers/compWindow.js'

dayjs.extend(utc)
const now = dayjs.utc('2026-06-15 12:00:00')
const BEFORE = '2026-06-10 10:00:00'
const AFTER = '2026-06-20 10:00:00'

describe('isWithinWindow with real values (unchanged behaviour)', () => {
  it('inside', () => expect(isWithinWindow(BEFORE, AFTER, now)).toBe(true))
  it('before the window', () => expect(isWithinWindow('2026-06-16 00:00:00', AFTER, now)).toBe(false))
  it('after the window', () => expect(isWithinWindow(BEFORE, '2026-06-15 11:59:59', now)).toBe(false))
  it('bounds are exclusive', () => {
    expect(isWithinWindow('2026-06-15 12:00:00', AFTER, now)).toBe(false)
    expect(isWithinWindow(BEFORE, '2026-06-15 12:00:00', now)).toBe(false)
  })
})

describe('missing bounds mean no limit', () => {
  it.each([null, undefined, '', '   ', '0000-00-00 00:00:00', '0000-00-00', 'Invalid Date', 'garbage'])(
    'missing start %p', (v) => {
      expect(isWithinWindow(v, AFTER, now)).toBe(true)
      expect(isWithinWindow(v, '2026-06-01 00:00:00', now)).toBe(false) // end still applies
    })
  it.each([null, undefined, '', '0000-00-00 00:00:00', 'Invalid Date', 'garbage'])(
    'missing end %p', (v) => {
      expect(isWithinWindow(BEFORE, v, now)).toBe(true)
      expect(isWithinWindow('2026-06-16 00:00:00', v, now)).toBe(false) // start still applies
    })
  it('both missing is always open', () => {
    expect(isWithinWindow(null, null, now)).toBe(true)
    expect(isWithinWindow('0000-00-00 00:00:00', 'Invalid Date', now)).toBe(true)
  })
  it('defaults now when omitted', () => expect(isWithinWindow(null, null)).toBe(true))
})

describe('comp helpers', () => {
  it('running / registration read the right fields', () => {
    const c = { timespan_start: null, timespan_end: null, registration_start: BEFORE, registration_end: '2026-06-14 00:00:00' }
    expect(isCompRunning(c, now)).toBe(true)
    expect(isRegistrationOpen(c, now)).toBe(false)
    expect(isRegistrationOpen({ ...c, registration_end: null }, now)).toBe(true)
    expect(isRegistrationOpen({}, now)).toBe(true)
    expect(isCompRunning(undefined, now)).toBe(true)
  })
})

describe('msUntilEnd', () => {
  it('null without an end, never NaN', () => {
    expect(msUntilEnd({ timespan_end: null }, now)).toBeNull()
    expect(msUntilEnd({ timespan_end: '0000-00-00 00:00:00' }, now)).toBeNull()
    expect(msUntilEnd({}, now)).toBeNull()
  })
  it('a number with a real end', () => {
    expect(Number.isFinite(msUntilEnd({ timespan_end: AFTER }, now))).toBe(true)
  })
})

describe('parseBound / windowLabel', () => {
  it('parses real values', () => expect(parseBound(BEFORE).isValid()).toBe(true))
  it('labels', () => {
    const f = (v) => `<${v}>`
    expect(windowLabel(null, '', f, 'NONE')).toBe('NONE')
    expect(windowLabel(BEFORE, AFTER, f, 'NONE')).toBe(`<${BEFORE}> - <${AFTER}>`)
    expect(windowLabel(null, AFTER, f, 'NONE')).toBe(`- <${AFTER}>`)
    expect(windowLabel(BEFORE, null, f, 'NONE')).toBe(`<${BEFORE}> -`)
  })
})
