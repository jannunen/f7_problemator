import { describe, it, expect } from 'vitest'
import {
  fromServer, selectRung, addTry, markReached, top, undo, canUndo, toWrite,
  adoptServer, rungView, hasUnknownCounts, tallyGroups, firstUnreached, highestReached, isEmpty, sameData,
  canEdit, countBounds, setReachedCount, unreach, marksAbove, MAX_TRIES,
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

// zone 1 in 2, zone 2 in 4, three zones, 5 tries so far, trying zone 3
const midRoute = () => fromServer({ zones: 3, checkpoint: 2, tries: { attempts: 5, zone_tries: { 1: 2, 2: 4 } } })
const toppedRoute = () => fromServer({ zones: 2, checkpoint: 2, tries: { attempts: 6, zone_tries: { 1: 2, 2: 4 } }, topTick: { tries: 6 } })
// What the server accepts as a full-state write (CheckpointRecorder::validateState).
const expectWritable = (s) => {
  expect(hasUnknownCounts(s)).toBe(false)
  const w = toWrite(s)
  const rungs = Object.keys(w.zone_tries).map(Number).sort((a, b) => a - b)
  const values = rungs.map((r) => w.zone_tries[r])
  for (const v of values) {
    expect(v).toBeGreaterThanOrEqual(1)
    expect(v).toBeLessThanOrEqual(w.attempts)
  }
  expect([...values].sort((a, b) => a - b)).toEqual(values)
  expect(w.checkpoint).toBe(rungs.length ? Math.max(...rungs) : 0)
  if (s.topped) expect(s.topTries).toBeGreaterThanOrEqual(values.length ? Math.max(...values) : 1)
}

describe('canEdit, countBounds', () => {
  it('only reached zones and the top of a topped route can be edited', () => {
    const s = midRoute()
    expect([1, 2, 3, 4, 0, 9, null].map((r) => canEdit(s, r))).toEqual([true, true, false, false, false, false, false])
    expect(countBounds(s, 3)).toBeNull()
    expect(canEdit(toppedRoute(), 3)).toBe(true)
    expect(canEdit(toppedRoute(), '1')).toBe(true)
  })
  it('holds a zone between the counts below and above it', () => {
    const s = midRoute()
    expect(countBounds(s, 1)).toEqual({ min: 1, max: 4 })
    expect(countBounds(s, 2)).toEqual({ min: 2, max: MAX_TRIES }) // the last mark: nothing above it
  })
  it('the top caps the last zone, and the zones are the floor of the top', () => {
    const s = toppedRoute()
    expect(countBounds(s, 2)).toEqual({ min: 2, max: 6 })
    expect(countBounds(s, 3)).toEqual({ min: 4, max: MAX_TRIES })
  })
  it('skips unknown counts when looking for a neighbour', () => {
    const s = fromServer({ zones: 3, checkpoint: 3, tries: { attempts: 6, zone_tries: { 1: 2, 3: 5 } } })
    expect(s.reached).toEqual({ 1: 2, 2: null, 3: 5 })
    expect(countBounds(s, 2)).toEqual({ min: 2, max: 5 })
    expect(countBounds(s, 3)).toEqual({ min: 2, max: MAX_TRIES })
  })
  it('never returns an empty range, even for data that is out of order', () => {
    const s = { ...midRoute(), reached: { 1: 5, 2: 3, 3: 2 } }
    expect(countBounds(s, 2)).toEqual({ min: 5, max: 5 })
  })
})

describe('setReachedCount', () => {
  it('corrects a zone count and leaves everything else alone', () => {
    const s = setReachedCount(midRoute(), 1, 3)
    expect(s.reached).toEqual({ 1: 3, 2: 4 })
    expect(s).toMatchObject({ attempts: 5, active: 3, topped: false })
    expectWritable(s)
  })
  it('clamps to the neighbours instead of breaking the order', () => {
    expect(setReachedCount(midRoute(), 1, 9).reached).toEqual({ 1: 4, 2: 4 })
    expect(setReachedCount(midRoute(), 2, 1).reached).toEqual({ 1: 2, 2: 2 })
    expect(setReachedCount(midRoute(), 1, 0).reached).toEqual({ 1: 1, 2: 4 })
    expect(setReachedCount(midRoute(), 1, -3).reached[1]).toBe(1)
    expect(setReachedCount(midRoute(), 2, 5000).reached[2]).toBe(MAX_TRIES)
  })
  it('raising the last mark past the running total takes the total with it', () => {
    const s = setReachedCount(midRoute(), 2, 7)
    expect(s.reached).toEqual({ 1: 2, 2: 7 })
    expect(s.attempts).toBe(7)
    expectWritable(s)
  })
  it('lowering the last mark keeps tries made since then', () => {
    const s = setReachedCount(midRoute(), 2, 3) // reached in 4, now 5: one try since
    expect(s.reached).toEqual({ 1: 2, 2: 3 })
    expect(s.attempts).toBe(5)
  })
  it('with no tries since the mark, the running total moves with it, down and back up', () => {
    const marked = apply(fresh(2), addTry, addTry, addTry, markReached) // zone 1 in 3, total 3
    const down = setReachedCount(marked, 1, 2)
    expect(down).toMatchObject({ attempts: 2, reached: { 1: 2 }, active: 2 })
    const up = setReachedCount(down, 1, 3)
    expect(up).toMatchObject({ attempts: 3, reached: { 1: 3 } })
    expectWritable(down)
  })
  it('a lower zone never moves the running total down', () => {
    const s = apply(fresh(3), addTry, addTry, markReached, markReached) // {1:2, 2:2}, total 2
    expect(setReachedCount(s, 1, 1)).toMatchObject({ attempts: 2, reached: { 1: 1, 2: 2 } })
  })
  it('corrects the tries of the top; the zones are its floor', () => {
    const s = setReachedCount(toppedRoute(), 3, 8)
    expect(s).toMatchObject({ topped: true, topTries: 8, attempts: 8, active: null })
    expect(s.reached).toEqual({ 1: 2, 2: 4 })
    expect(setReachedCount(toppedRoute(), 3, 1)).toMatchObject({ topTries: 4, attempts: 4 })
    expectWritable(setReachedCount(toppedRoute(), 3, 1))
  })
  it('a zone of a topped route cannot pass the top', () => {
    const s = setReachedCount(toppedRoute(), 2, 50)
    expect(s.reached).toEqual({ 1: 2, 2: 6 })
    expect(s).toMatchObject({ topped: true, topTries: 6, attempts: 6 })
    expectWritable(s)
  })
  it('stamps unknown counts so the result can be written as a full state', () => {
    // old data: zones 1 and 2 reached, no counts, no tries
    const old = setReachedCount(fromServer({ zones: 3, checkpoint: 2 }), 2, 3)
    expect(old.reached).toEqual({ 1: 3, 2: 3 })
    expect(old.attempts).toBe(3)
    expectWritable(old)
    // a top tick with no zone counts at all (e.g. an ifsc tick saved without zones)
    const ticked = setReachedCount(fromServer({ zones: 2, topTick: { tries: 4 } }), 1, 2)
    expect(ticked.reached).toEqual({ 1: 2, 2: 4 })
    expect(ticked).toMatchObject({ topped: true, topTries: 4, attempts: 4 })
    expectWritable(ticked)
    // an unknown zone between two known ones stays between them
    const gap = setReachedCount(fromServer({ zones: 3, checkpoint: 3, tries: { attempts: 6, zone_tries: { 1: 2, 3: 5 } } }), 1, 1)
    expect(gap.reached).toEqual({ 1: 1, 2: 5, 3: 5 })
    expectWritable(gap)
  })
  it('ignores unreached rungs, the same value and junk', () => {
    const s = midRoute()
    expect(setReachedCount(s, 3, 2)).toBe(s)
    expect(setReachedCount(s, 4, 2)).toBe(s) // the top of a route that is not topped
    expect(setReachedCount(s, 1, 2)).toBe(s)
    expect(setReachedCount(s, 1, 'x')).toBe(s)
    expect(setReachedCount(s, 1, null)).toBe(s)
    const t = toppedRoute()
    expect(setReachedCount(t, 3, 6)).toBe(t)
  })
  it('accepts strings and can be undone', () => {
    const before = midRoute()
    const s = setReachedCount(before, '1', '3')
    expect(s.reached[1]).toBe(3)
    const { state, undone } = undo(s)
    expect(undone).toBe('edit')
    expect(state.reached).toEqual({ 1: 2, 2: 4 })
    expect(sameData(state, before)).toBe(true)
  })
  it('stays writable through any sequence of corrections', () => {
    let s = apply(fresh(3), addTry, markReached, addTry, addTry, markReached, addTry)
    for (const [rung, n] of [[1, 5], [2, 1], [1, 3], [2, 9], [1, 1], [2, 2], [1, 2]]) {
      s = setReachedCount(s, rung, n)
      expectWritable(s)
    }
    s = top(s)
    for (const [rung, n] of [[4, 1], [3, 9], [1, 9], [4, 12], [2, 11], [3, 1]]) {
      s = setReachedCount(s, rung, n)
      expectWritable(s)
    }
  })
})

describe('unreach', () => {
  it('removes the highest mark and keeps the ones below', () => {
    const s = unreach(midRoute(), 2)
    expect(s.reached).toEqual({ 1: 2 })
    expect(s).toMatchObject({ attempts: 5, active: 2, topped: false })
    expect(toWrite(s)).toEqual({ checkpoint: 1, attempts: 5, zone_tries: { 1: 2 } })
    expect(rungView(s).map((r) => r.status)).toEqual(['reached', 'active', 'idle', 'idle'])
  })
  it('takes the marks above with it: zones are reached in order', () => {
    const s = unreach(midRoute(), 1)
    expect(s.reached).toEqual({})
    expect(s).toMatchObject({ attempts: 5, active: 1 })
    expect(toWrite(s)).toEqual({ checkpoint: 0, attempts: 5, zone_tries: {} })
    expect(marksAbove(midRoute(), 1)).toBe(1)
    expect(marksAbove(midRoute(), 2)).toBe(0)
  })
  it('on the Top rung removes only the top', () => {
    const s = unreach(toppedRoute(), 3)
    expect(s).toMatchObject({ topped: false, topTries: null, attempts: 6, active: 3 })
    expect(s.reached).toEqual({ 1: 2, 2: 4 })
    expect(marksAbove(toppedRoute(), 3)).toBe(0)
  })
  it('a zone of a topped route takes the top with it', () => {
    const s = unreach(toppedRoute(), 2)
    expect(s).toMatchObject({ topped: false, topTries: null, active: 2 })
    expect(s.reached).toEqual({ 1: 2 })
    expect(marksAbove(toppedRoute(), 2)).toBe(1)
    expect(marksAbove(toppedRoute(), 1)).toBe(2)
  })
  it('the removed rung becomes the one being attempted, and ✓ marks it again', () => {
    let s = selectRung(midRoute(), 4) // trying the top
    s = unreach(s, 2)
    expect(s.active).toBe(2)
    s = markReached(s)
    expect(s.reached).toEqual({ 1: 2, 2: 5 })
    expect(s.active).toBe(3)
  })
  it('ignores rungs that are not reached', () => {
    const s = midRoute()
    expect(unreach(s, 3)).toBe(s)
    expect(unreach(s, 4)).toBe(s)
    expect(unreach(s, 'x')).toBe(s)
    expect(marksAbove(s, 3)).toBe(0)
  })
  it('can be undone, the top included', () => {
    const before = toppedRoute()
    const { state, undone } = undo(unreach(before, 1))
    expect(undone).toBe('unreach')
    expect(state).toMatchObject({ topped: true, topTries: 6, active: null })
    expect(state.reached).toEqual({ 1: 2, 2: 4 })
  })
  it('keeps unknown counts below unknown (nothing is made up)', () => {
    const s = unreach(fromServer({ zones: 3, checkpoint: 3 }), 3)
    expect(s.reached).toEqual({ 1: null, 2: null })
    expect(s.active).toBe(3)
  })
})

describe('the active rung always lands on the lowest unreached rung', () => {
  const reload = (s) => {
    const w = toWrite(s)
    return fromServer({ zones: s.zones, checkpoint: w.checkpoint, tries: w })
  }
  it('after ✓, and the same again when rebuilt from what was written', () => {
    let s = fresh(3)
    for (const expected of [2, 3, 4]) {
      s = markReached(addTry(s))
      expect(s.active).toBe(expected)
      expect(reload(s).active).toBe(expected)
    }
  })
  it('after ✓ on a rung chosen further up', () => {
    const s = markReached(selectRung(addTry(fresh(3)), 3))
    expect(s.active).toBe(4)
    expect(firstUnreached(s)).toBe(4)
  })
  it('after undo, a correction and a removal, live and after a reload', () => {
    let s = apply(fresh(3), addTry, markReached, addTry, markReached) // 1 and 2 reached
    expect(s.active).toBe(3)
    s = undo(s).state // zone 2 not reached after all
    expect(s.active).toBe(2)
    expect(reload(s).active).toBe(2)
    s = markReached(s)
    s = setReachedCount(s, 1, 2)
    expect(s.active).toBe(3)
    expect(reload(s).active).toBe(3)
    s = unreach(s, 2)
    expect(s.active).toBe(2)
    expect(reload(s).active).toBe(2)
    s = undo(s).state // the removal undone: zone 2 is back
    expect(s.active).toBe(3)
    s = unreach(s, 1)
    expect(s.active).toBe(1)
    expect(reload(s).active).toBe(1)
  })
  it('adopting the server answer after a removal keeps the removed rung active', () => {
    const s = unreach(midRoute(), 2)
    const adopted = adoptServer(s, { checkpoint: 1, attempts: 5, zone_tries: { 1: 2 } })
    expect(adopted.active).toBe(2)
    expect(adopted.reached).toEqual({ 1: 2 })
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
