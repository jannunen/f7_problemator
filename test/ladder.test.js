import { describe, it, expect } from 'vitest'
import {
  fromServer, selectRung, addTry, markReached, top, undo, canUndo, toWrite,
  adoptServer, rungView, hasUnknownCounts, tallyGroups, firstUnreached, highestReached, isEmpty, sameData,
} from '../src/js/helpers/ladder.js'

const fresh = (zones = 2) => fromServer({ zones })
const apply = (state, ...fns) => fns.reduce((s, f) => f(s), state)

describe('fromServer', () => {
  it('starts empty with the first zone active', () => {
    const s = fresh(3)
    expect(s).toMatchObject({ zones: 3, attempts: 0, reached: {}, topped: false, topTries: null, active: 1 })
    expect(isEmpty(s)).toBe(true)
  })
  it('makes the Top the active rung when a route has no zones', () => {
    expect(fresh(0).active).toBe(1)
    expect(rungView(fresh(0))).toEqual([{ rung: 1, isTop: true, status: 'active', count: null }])
  })
  it('loads attempts and zone tries, with string keys and values', () => {
    const s = fromServer({ zones: 3, checkpoint: 2, tries: { attempts: '5', zone_tries: { 1: '2', '2': 4 } } })
    expect(s.attempts).toBe(5)
    expect(s.reached).toEqual({ 1: 2, 2: 4 })
    expect(s.active).toBe(3)
  })
  it('shows old data (checkpoint known, no tries) as reached rungs without counts', () => {
    const s = fromServer({ zones: 3, checkpoint: 2, tries: { attempts: 0, zone_tries: null } })
    expect(s.reached).toEqual({ 1: null, 2: null })
    expect(s.attempts).toBe(0)
    expect(rungView(s).map((r) => [r.status, r.count])).toEqual([
      ['reached', null], ['reached', null], ['active', null], ['idle', null],
    ])
    // and with no tries object at all
    expect(fromServer({ zones: 2, checkpoint: '1' }).reached).toEqual({ 1: null })
  })
  it('accepts a PHP empty array for zone_tries', () => {
    expect(fromServer({ zones: 2, checkpoint: 0, tries: { attempts: 3, zone_tries: [] } }).reached).toEqual({})
  })
  it('ignores zone_tries rungs that the route does not have and caps checkpoint', () => {
    const s = fromServer({ zones: 1, checkpoint: 4, tries: { attempts: 3, zone_tries: { 1: 1, 5: 3 } } })
    expect(s.reached).toEqual({ 1: 1 })
  })
  it('treats a top tick as reaching every zone and takes its tries', () => {
    const s = fromServer({ zones: 2, checkpoint: 1, tries: { attempts: 3, zone_tries: { 1: 2 } }, topTick: { tries: '6' } })
    expect(s).toMatchObject({ topped: true, topTries: 6, attempts: 6, active: null })
    expect(s.reached).toEqual({ 1: 2, 2: null })
  })
  it('keeps the top tick tries even with no checkpoint row at all', () => {
    const s = fromServer({ zones: 2, topTick: { tries: 1 } })
    expect(s.attempts).toBe(1)
    expect(rungView(s)[2]).toEqual({ rung: 3, isTop: true, status: 'reached', count: 1 })
  })
})

describe('addTry', () => {
  it('counts attempts on the active rung', () => {
    const s = apply(fresh(), addTry, addTry, addTry)
    expect(s.attempts).toBe(3)
    expect(s.reached).toEqual({})
    expect(s.active).toBe(1)
  })
  it('choosing a later rung and adding a try stamps the earlier zone at the current tally (the user\'s rule)', () => {
    let s = apply(fresh(), addTry, addTry) // two tries on zone A
    s = selectRung(s, 2)
    s = addTry(s)
    expect(s.reached).toEqual({ 1: 2 })
    expect(s.attempts).toBe(3)
    expect(s.active).toBe(2)
  })
  it('one tap is one try: with no tries, choosing B and + try gives A in 1, attempts 1', () => {
    const s = addTry(selectRung(fresh(2), 2))
    expect(s.reached).toEqual({ 1: 1 })
    expect(s.attempts).toBe(1)
    const s3 = addTry(selectRung(fresh(3), 3))
    expect(s3.reached).toEqual({ 1: 1, 2: 1 })
    expect(s3.attempts).toBe(1)
  })
  it('caps an unknown count at the next higher known count (stored {2:3}, attempts 5)', () => {
    const stored = { zones: 3, checkpoint: 2, tries: { attempts: 5, zone_tries: { 2: 3 } } }
    // ✓ on rung 3: {1:3, 2:3, 3:5}
    const r = markReached(fromServer(stored))
    expect(r.reached).toEqual({ 1: 3, 2: 3, 3: 5 })
    expect(r.attempts).toBe(5)
    // + try on rung 3: rung 1 capped at 3, one more try
    const t = addTry(fromServer(stored))
    expect(t.reached).toEqual({ 1: 3, 2: 3 })
    expect(t.attempts).toBe(6)
    // + try on the Top with rung 3 unknown too (stored cp3, {2:3}): {1:3, 2:3, 3:5}, attempts 6
    const top3 = addTry(fromServer({ zones: 3, checkpoint: 3, tries: { attempts: 5, zone_tries: { 2: 3 } } }))
    expect(top3.reached).toEqual({ 1: 3, 2: 3, 3: 5 })
    expect(top3.attempts).toBe(6)
  })
  it('stamps unknown counts from old rows at the current tally (stored cp3, {1:2}, attempts 4)', () => {
    const s = addTry(fromServer({ zones: 4, checkpoint: 3, tries: { attempts: 4, zone_tries: { 1: 2 } } }))
    expect(s.reached).toEqual({ 1: 2, 2: 4, 3: 4 })
    expect(s.attempts).toBe(5)
    expect(toWrite(s)).toEqual({ checkpoint: 3, attempts: 5, zone_tries: { 1: 2, 2: 4, 3: 4 } })
  })
  it('a try on the Top stamps every unreached zone', () => {
    let s = apply(fresh(2), addTry)
    s = addTry(selectRung(s, 3))
    expect(s.reached).toEqual({ 1: 1, 2: 1 })
    expect(s.attempts).toBe(2) // one try on A, then one on the Top
    expect(s.topped).toBe(false)
  })
  it('does nothing once topped', () => {
    const s = top(fresh())
    expect(addTry(s)).toBe(s)
  })
})

describe('markReached', () => {
  it('a ✓ with no tries is a flash (reached in 1)', () => {
    const s = markReached(fresh())
    expect(s.reached).toEqual({ 1: 1 })
    expect(s.attempts).toBe(1)
    expect(s.active).toBe(2)
  })
  it('normal progress: zone 1 in 2, zone 2 in 4, top in 7', () => {
    let s = apply(fresh(2), addTry, addTry, markReached)
    expect(s.reached).toEqual({ 1: 2 })
    s = apply(s, addTry, addTry, markReached)
    expect(s.reached).toEqual({ 1: 2, 2: 4 })
    expect(s.active).toBe(3)
    s = apply(s, addTry, addTry, addTry, markReached)
    expect(s).toMatchObject({ topped: true, topTries: 7, attempts: 7, active: null })
    expect(toWrite(s)).toEqual({ checkpoint: 2, attempts: 7, zone_tries: { 1: 2, 2: 4 } })
  })
  it('✓ on a later rung stamps the earlier ones at the same tally', () => {
    let s = apply(fresh(3), addTry, addTry, addTry)
    s = markReached(selectRung(s, 2))
    expect(s.reached).toEqual({ 1: 3, 2: 3 })
    expect(s.active).toBe(3)
  })
  it('moves the active rung to the next unreached one, past already reached rungs', () => {
    let s = markReached(selectRung(fresh(3), 2)) // 1 and 2 at 1
    expect(s.active).toBe(3)
    s = markReached(s)
    expect(s.active).toBe(4) // the Top
  })
  it('fills in unknown counts from old data at the current tally', () => {
    let s = fromServer({ zones: 3, checkpoint: 1 })
    s = addTry(s) // a try on zone 2 means zone 1 was done: its unknown count becomes 1
    expect(s.reached).toEqual({ 1: 1 })
    expect(s.attempts).toBe(1)
    s = markReached(s)
    expect(s.reached).toEqual({ 1: 1, 2: 1 })
    // ✓ straight away on old data stamps the unknown count too
    expect(markReached(fromServer({ zones: 3, checkpoint: 1 })).reached).toEqual({ 1: 1, 2: 1 })
  })
})

describe('top', () => {
  it('stamps unreached zones at the top tally and records top tries', () => {
    let s = apply(fresh(3), addTry, markReached, addTry, addTry)
    s = top(s)
    expect(s.reached).toEqual({ 1: 1, 2: 3, 3: 3 })
    expect(s).toMatchObject({ topped: true, topTries: 3, attempts: 3, active: null })
  })
  it('a flash top is 1 try and flashes every zone', () => {
    const s = top(fresh(2))
    expect(s).toMatchObject({ topTries: 1, attempts: 1, reached: { 1: 1, 2: 1 } })
  })
  it('the ladder is read-only after topping (except undo)', () => {
    const s = top(fresh())
    expect(markReached(s)).toBe(s)
    expect(top(s)).toBe(s)
    expect(selectRung(s, 1)).toBe(s)
    expect(canUndo(s)).toBe(true)
  })
})

describe('selectRung', () => {
  it('ignores reached rungs, out of range values and the current rung', () => {
    const s = markReached(fresh(2))
    expect(selectRung(s, 1)).toBe(s)
    expect(selectRung(s, 0)).toBe(s)
    expect(selectRung(s, 9)).toBe(s)
    expect(selectRung(s, 2)).toBe(s)
    expect(selectRung(s, 3).active).toBe(3)
  })
  it('is not an undoable action', () => {
    expect(canUndo(selectRung(fresh(2), 2))).toBe(false)
  })
})

describe('undo', () => {
  it('reverts a try', () => {
    const s = apply(fresh(), addTry, addTry)
    const { state, undone } = undo(s)
    expect(undone).toBe('try')
    expect(state.attempts).toBe(1)
    expect(state.history).toHaveLength(1)
  })
  it('reverts a try that stamped earlier zones, including the active rung', () => {
    const before = selectRung(apply(fresh(), addTry, addTry), 2)
    const { state } = undo(addTry(before))
    expect(state.reached).toEqual({})
    expect(state.attempts).toBe(2)
    expect(state.active).toBe(2)
  })
  it('reverts a ✓ reached', () => {
    const { state, undone } = undo(markReached(addTry(fresh())))
    expect(undone).toBe('reached')
    expect(state).toMatchObject({ attempts: 1, reached: {}, active: 1 })
  })
  it('reverts a top and says so, so the caller removes the top tick', () => {
    const before = apply(fresh(2), addTry, markReached)
    const { state, undone } = undo(top(before))
    expect(undone).toBe('top')
    expect(state).toMatchObject({ topped: false, topTries: null, reached: { 1: 1 }, attempts: 1, active: 2 })
  })
  it('walks back step by step to the loaded state and then stops', () => {
    let s = apply(fresh(), addTry, markReached, addTry)
    s = undo(s).state
    s = undo(s).state
    s = undo(s).state
    expect(isEmpty(s)).toBe(true)
    expect(canUndo(s)).toBe(false)
    expect(undo(s)).toEqual({ state: s, undone: null })
  })
  it('restores old data without counts', () => {
    const loaded = fromServer({ zones: 2, checkpoint: 1 })
    const { state } = undo(markReached(loaded))
    expect(state.reached).toEqual({ 1: null })
    expect(hasUnknownCounts(state)).toBe(true)
    expect(toWrite(state)).toEqual({ checkpoint: 1, attempts: 0, zone_tries: {} })
  })
})

describe('toWrite', () => {
  it('sends checkpoint 0 for attempts with no zone yet', () => {
    expect(toWrite(apply(fresh(), addTry))).toEqual({ checkpoint: 0, attempts: 1, zone_tries: {} })
    expect(hasUnknownCounts(apply(fresh(), addTry))).toBe(false)
  })
  it('meets the server invariants: values ≥ 1, ≤ attempts, non-decreasing, checkpoint = max rung', () => {
    const states = [
      apply(fresh(3), addTry, (s) => selectRung(s, 3), addTry),
      apply(fresh(3), markReached, addTry, top),
      apply(fresh(3), (s) => selectRung(s, 2), markReached, addTry, addTry, markReached),
    ]
    for (const s of states) {
      const w = toWrite(s)
      const rungs = Object.keys(w.zone_tries).map(Number).sort((a, b) => a - b)
      const values = rungs.map((r) => w.zone_tries[r])
      expect(Math.min(...values)).toBeGreaterThanOrEqual(1)
      expect(Math.max(...values)).toBeLessThanOrEqual(w.attempts)
      expect([...values].sort((a, b) => a - b)).toEqual(values)
      expect(w.checkpoint).toBe(Math.max(...rungs))
      expect(highestReached(s)).toBe(w.checkpoint)
    }
  })
})

describe('adoptServer', () => {
  it('takes the server numbers but keeps the active rung and the undo stack', () => {
    const local = selectRung(apply(fresh(3), addTry, addTry), 3)
    const adopted = adoptServer(local, { ok: true, checkpoint: 1, attempts: 2, zone_tries: { 1: 2 } })
    expect(adopted.reached).toEqual({ 1: 2 })
    expect(adopted.active).toBe(3)
    expect(adopted.history).toHaveLength(2)
  })
  it('moves the active rung up when the server says it was reached', () => {
    const adopted = adoptServer(fresh(2), { checkpoint: 1, attempts: 1, zone_tries: { 1: 1 } })
    expect(adopted.active).toBe(2)
  })
  it('adopts an empty server state (row deleted) and the PHP {} / [] forms', () => {
    const adopted = adoptServer(apply(fresh(2), addTry), { ok: true, applied: true, checkpoint: 0, attempts: 0, zone_tries: [] })
    expect(isEmpty(adopted)).toBe(true)
    expect(adopted.active).toBe(1)
  })
  it('keeps a topped route topped', () => {
    const t = top(fresh(1))
    const adopted = adoptServer(t, { checkpoint: 1, attempts: 1, zone_tries: { 1: 1 } })
    expect(adopted).toMatchObject({ topped: true, topTries: 1, active: null })
    expect(sameData(adopted, t)).toBe(true)
  })
})

describe('rungView, tallyGroups, firstUnreached', () => {
  it('describes each rung in climbing order, Top last', () => {
    const s = selectRung(apply(fresh(2), addTry, markReached), 3)
    expect(rungView(s)).toEqual([
      { rung: 1, isTop: false, status: 'reached', count: 1 },
      { rung: 2, isTop: false, status: 'idle', count: null },
      { rung: 3, isTop: true, status: 'active', count: null },
    ])
  })
  it('groups tallies by five', () => {
    expect(tallyGroups(0)).toEqual([])
    expect(tallyGroups(3)).toEqual([3])
    expect(tallyGroups(5)).toEqual([5])
    expect(tallyGroups(12)).toEqual([5, 5, 2])
  })
  it('finds the first unreached rung', () => {
    expect(firstUnreached(fromServer({ zones: 2, checkpoint: 2 }))).toBe(3)
  })
})
