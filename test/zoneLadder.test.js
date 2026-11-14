import { describe, it, expect } from 'vitest'
import { zoneLadderFromTick, zoneLadderToTick, applyZoneLadderAction, ZONES } from '../src/js/helpers/zoneLadder.js'
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

describe('applyZoneLadderAction', () => {
  const run = (state, ...events) => events.reduce((s, [action, arg]) => applyZoneLadderAction(s, action, arg), state)

  it('drives the ladder exactly like the state machine does', () => {
    const s = run(zoneLadderFromTick(), ['try'], ['try'], ['reached'], ['select', 3], ['try'])
    expect(s).toMatchObject({ attempts: 3, reached: { 1: 2, 2: 2 }, active: 3, topped: false })
    expect(run(s, ['undo'])).toMatchObject({ attempts: 2, reached: { 1: 2 }, active: 3 })
    expect(run(s, ['top'])).toMatchObject({ topped: true, topTries: 3 })
    expect(run(s, ['clear'])).toMatchObject({ attempts: 0, reached: {}, active: 1 })
  })

  it('after ✓ the next zone is the active one, and again when rebuilt from the saved tick', () => {
    const low = run(zoneLadderFromTick(), ['try'], ['reached'])
    expect(low.active).toBe(2)
    const high = run(low, ['try'], ['reached'])
    expect(high.active).toBe(3)
    // a tick is only written with a top, so a reload shows the top reached
    const saved = zoneLadderToTick(run(high, ['top']))
    expect(zoneLadderFromTick({ ...saved, tries: saved.topTries, topped: true })).toMatchObject({ topped: true, active: null, reached: { 1: 1, 2: 2 } })
  })

  it('edit corrects a zone count and the tick fields follow', () => {
    const s = run(zoneLadderFromTick(), ['try'], ['try'], ['reached'], ['try'], ['try'], ['reached'])
    expect(zoneLadderToTick(s)).toEqual({ attempts_low_zone: 2, attempts_high_zone: 4, topTries: null })
    const edited = run(s, ['edit', { rung: 1, count: 3 }], ['edit', { rung: 2, count: 3 }])
    expect(zoneLadderToTick(edited)).toEqual({ attempts_low_zone: 3, attempts_high_zone: 3, topTries: null })
    expect(edited.active).toBe(3)
    // low <= high always holds (the backend's ZoneOrderClamp would otherwise change what was entered)
    const clamped = zoneLadderToTick(run(s, ['edit', { rung: 1, count: 9 }]))
    expect(clamped.attempts_low_zone).toBe(4)
    expect(clamped.attempts_high_zone).toBe(4)
  })

  it('edit on a saved top: zones stay at or below the top, the top at or above the zones', () => {
    const saved = zoneLadderFromTick({ attempts_low_zone: 2, attempts_high_zone: 3, tries: 5, topped: true })
    expect(zoneLadderToTick(run(saved, ['edit', { rung: 2, count: 9 }]))).toEqual({ attempts_low_zone: 2, attempts_high_zone: 5, topTries: 5 })
    expect(zoneLadderToTick(run(saved, ['edit', { rung: 3, count: 1 }]))).toEqual({ attempts_low_zone: 2, attempts_high_zone: 3, topTries: 3 })
    expect(zoneLadderToTick(run(saved, ['edit', { rung: 3, count: 7 }]))).toEqual({ attempts_low_zone: 2, attempts_high_zone: 3, topTries: 7 })
  })

  it('edit on a top saved without zone counts fills them in order', () => {
    const saved = zoneLadderFromTick({ tries: 4, topped: true })
    expect(saved.reached).toEqual({ 1: null, 2: null })
    expect(zoneLadderToTick(run(saved, ['edit', { rung: 1, count: 2 }]))).toEqual({ attempts_low_zone: 2, attempts_high_zone: 4, topTries: 4 })
  })

  it('unreach removes just the high zone, or the low zone and everything above it', () => {
    const s = run(zoneLadderFromTick(), ['try'], ['reached'], ['try'], ['reached'])
    const noHigh = run(s, ['unreach', 2])
    expect(zoneLadderToTick(noHigh)).toEqual({ attempts_low_zone: 1, attempts_high_zone: null, topTries: null })
    expect(noHigh).toMatchObject({ active: 2, attempts: 2 })
    const none = run(s, ['unreach', 1])
    expect(zoneLadderToTick(none)).toEqual({ attempts_low_zone: null, attempts_high_zone: null, topTries: null })
    expect(none.active).toBe(1)
    expect(zoneLadderToTick(run(none, ['undo']))).toEqual({ attempts_low_zone: 1, attempts_high_zone: 2, topTries: null })
  })

  it('unreach on the Top rung takes only the top away', () => {
    const topped = run(zoneLadderFromTick(), ['try'], ['reached'], ['reached'], ['try'], ['top'])
    const s = run(topped, ['unreach', 3])
    expect(s).toMatchObject({ topped: false, active: 3, attempts: 2 })
    expect(zoneLadderToTick(s)).toEqual({ attempts_low_zone: 1, attempts_high_zone: 1, topTries: null })
  })

  it('returns the same state for events that change nothing', () => {
    const s = zoneLadderFromTick()
    expect(applyZoneLadderAction(s, 'unreach', 1)).toBe(s)
    expect(applyZoneLadderAction(s, 'edit', { rung: 1, count: 2 })).toBe(s)
    expect(applyZoneLadderAction(s, 'edit')).toBe(s)
    expect(applyZoneLadderAction(s, 'retry')).toBe(s)
    expect(applyZoneLadderAction(s, 'undo')).toBe(s)
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
