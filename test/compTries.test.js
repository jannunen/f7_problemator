import { describe, it, expect } from 'vitest'
import { minOneTries, compTickTries } from '../src/js/helpers/compTries.js'

describe('minOneTries', () => {
  it.each([[1, 1], [2, 2], [17, 17], ['3', 3], [2.9, 2]])('keeps %s as %s', (v, out) => {
    expect(minOneTries(v)).toBe(out)
  })
  it.each([0, -1, -5, null, undefined, NaN, '', 'abc', '0', 0.4, Infinity])('turns %s into 1', (v) => {
    expect(minOneTries(v)).toBe(1)
  })
})

describe('compTickTries', () => {
  it('an untouched row is one try, no bonus, no zones', () => {
    expect(compTickTries(undefined)).toEqual({ tries: 1, tries_bonus: 0, attempts_low_zone: null, attempts_high_zone: null })
  })
  it('a row where only the bonus was set no longer sends 0 tries', () => {
    expect(compTickTries({ tries: 0, sport_points: 0, tries_bonus: 3 })).toMatchObject({ tries: 1, tries_bonus: 3 })
  })
  it('an old tick stored with 0 tries is re-saved with 1', () => {
    expect(compTickTries({ tries: 0, tries_bonus: 0 }).tries).toBe(1)
  })
  it('keeps the user\'s tries', () => {
    expect(compTickTries({ tries: 4 }).tries).toBe(4)
  })
  it('keeps 0 / missing bonus as "no bonus recorded"', () => {
    expect(compTickTries({ tries: 2, tries_bonus: 0 }).tries_bonus).toBe(0)
    expect(compTickTries({ tries: 2, tries_bonus: NaN }).tries_bonus).toBe(0)
    expect(compTickTries({ tries: 2, tries_bonus: null }).tries_bonus).toBe(0)
    expect(compTickTries({ tries: 2 }).tries_bonus).toBe(0)
  })
  it('zones stay null until entered, then are at least 1', () => {
    expect(compTickTries({ tries: 2, attempts_low_zone: null, attempts_high_zone: NaN })).toMatchObject({ attempts_low_zone: null, attempts_high_zone: null })
    expect(compTickTries({ tries: 2, attempts_low_zone: 0, attempts_high_zone: 3 })).toMatchObject({ attempts_low_zone: 1, attempts_high_zone: 3 })
  })
})
