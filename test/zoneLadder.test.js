import { describe, it, expect } from 'vitest'
import { zoneLadderFromTick, zoneLadderToTick, ZONES } from '../src/js/helpers/zoneLadder.js'
import { addTry, markReached, top } from '../src/js/helpers/ladder.js'

describe('zoneLadderFromTick', () => {
  it('builds an empty, untouched ladder from no tick at all', () => {
    const s = zoneLadderFromTick()
    expect(s).toMatchObject({ zones: ZONES, attempts: 0, reached: {}, topped: false, active: 1 })
  })

  it('derives checkpoint from which zone fields are set', () => {
    expect(zoneLadderFromTick({ attempts_low_zone: 2, attempts_high_zone: null, tries: 2 }).reached).toEqual({ 1: 2 })
    expect(zoneLadderFromTick({ attempts_low_zone: 2, attempts_high_zone: 4, tries: 4 }).reached).toEqual({ 1: 2, 2: 4 })
  })

  it('a topped tick marks every zone reached and sets topTries', () => {
    const s = zoneLadderFromTick({ attempts_low_zone: 1, attempts_high_zone: 3, tries: 5, topped: true })
    expect(s.topped).toBe(true)
    expect(s.topTries).toBe(5)
    expect(s.reached).toEqual({ 1: 1, 2: 3 })
  })
})

describe('zoneLadderToTick', () => {
  it('round-trips an in-progress ladder back to the tick fields', () => {
    let s = zoneLadderFromTick()
    s = addTry(s) // attempts 1
    s = markReached(s) // zone 1 reached at 1, active -> zone 2
    s = addTry(s) // attempts 2 on zone 2
    const write = zoneLadderToTick(s)
    expect(write).toEqual({ attempts_low_zone: 1, attempts_high_zone: null, topTries: null })
  })

  it('a topped ladder reports topTries', () => {
    let s = zoneLadderFromTick()
    s = addTry(s)
    s = markReached(s) // zone 1
    s = markReached(s) // zone 2
    s = top(s)
    const write = zoneLadderToTick(s)
    expect(write.topTries).toBe(s.topTries)
    expect(write.attempts_low_zone).toBe(1)
    expect(write.attempts_high_zone).toBe(1)
  })

  it('round-trip through fromServer recovers the same ladder', () => {
    let s = zoneLadderFromTick()
    s = addTry(s)
    s = addTry(s)
    s = markReached(s)
    const write = zoneLadderToTick(s)
    const rebuilt = zoneLadderFromTick({ ...write, tries: 2 })
    expect(rebuilt.reached).toEqual(s.reached)
  })
})
