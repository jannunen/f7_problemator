import { describe, it, expect } from 'vitest'
import { isBoulderingCompType, isSportCompType } from '../src/js/helpers/compKind.js'

describe('comp kind from tyyppi', () => {
  it.each(['checkpoint_points', 'fixed_points_best_n'])('%s is bouldering and not sport', (t) => {
    expect(isBoulderingCompType(t)).toBe(true)
    expect(isSportCompType(t)).toBe(false)
  })
  it('keeps existing types as they were', () => {
    expect(isBoulderingCompType('variable_points')).toBe(true)
    expect(isBoulderingCompType('ifsc_2018_bouldering')).toBe(true)
    expect(isSportCompType('ifsc_2018_bouldering')).toBe(false)
    expect(isSportCompType('sport')).toBe(true)
    expect(isBoulderingCompType('sport')).toBe(false)
    expect(isSportCompType('sportbonus')).toBe(true)
  })
  it('is false for a missing type', () => {
    expect(isBoulderingCompType(null)).toBe(false)
    expect(isSportCompType(undefined)).toBe(false)
  })
})
