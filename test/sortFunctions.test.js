import { describe, it, expect } from 'vitest'
import { sortFunction, problemStyleFilter } from '../src/components/ui/problemlist/sortFunctions.js'

// A problem as the API actually returns it. Fields the sorters reach into are
// deliberately present here and deliberately absent in the "sparse" cases
// below, because sparse rows are normal: a spray wall problem can be ungraded,
// and a problem can outlive the routesetter who set it.
const problem = (over = {}) => ({
  id: 1,
  added: '2026-08-01 10:00:00',
  routetype: 'boulder',
  ascents_count: 3,
  c_like: 2,
  soontoberemoved: 0,
  grade: { score: 500, name: '6a' },
  wall: { wallchar: 'B' },
  author: { etunimi: 'Bea' },
  ...over,
})

const sorted = (list, by) => [...list].sort((a, b) => sortFunction(a, b, by))

describe('sortFunction', () => {
  it('orders hardest first and easiest first', () => {
    const easy = problem({ id: 1, grade: { score: 100, name: '4' } })
    const hard = problem({ id: 2, grade: { score: 900, name: '7c' } })
    expect(sorted([easy, hard], 'hardest').map((p) => p.id)).toEqual([2, 1])
    expect(sorted([hard, easy], 'easiest').map((p) => p.id)).toEqual([1, 2])
  })

  it('orders by wall character', () => {
    const a = problem({ id: 1, wall: { wallchar: 'A' } })
    const c = problem({ id: 2, wall: { wallchar: 'C' } })
    expect(sorted([c, a], 'sector_asc').map((p) => p.id)).toEqual([1, 2])
  })

  it('orders newest and oldest by added date', () => {
    const old = problem({ id: 1, added: '2020-01-01 00:00:00' })
    const recent = problem({ id: 2, added: '2026-08-01 00:00:00' })
    expect(sorted([old, recent], 'newest').map((p) => p.id)).toEqual([2, 1])
    expect(sorted([recent, old], 'oldest').map((p) => p.id)).toEqual([1, 2])
  })

  it('orders by ascent count', () => {
    const few = problem({ id: 1, ascents_count: 1 })
    const many = problem({ id: 2, ascents_count: 50 })
    expect(sorted([few, many], 'most_ticks').map((p) => p.id)).toEqual([2, 1])
  })

  // The cases that used to throw. A single bad row took down the whole sort,
  // so the list rendered empty rather than mis-ordered.
  it('survives a problem with no grade', () => {
    const ungraded = problem({ id: 2, grade: null })
    expect(() => sorted([problem(), ungraded], 'hardest')).not.toThrow()
  })

  it('survives a problem with no author', () => {
    const orphan = problem({ id: 2, author: null })
    expect(() => sorted([problem(), orphan], 'routesetter_asc')).not.toThrow()
  })

  it('survives an unknown sort key instead of crashing', () => {
    expect(() => sorted([problem(), problem({ id: 2 })], 'no_such_sort')).not.toThrow()
  })
})

describe('problemStyleFilter', () => {
  it('keeps everything for "all"', () => {
    expect(problemStyleFilter(problem(), 'all')).toBe(true)
  })

  it('matches boulders and routes by type', () => {
    expect(problemStyleFilter(problem({ routetype: 'boulder' }), 'boulders')).toBe(true)
    expect(problemStyleFilter(problem({ routetype: 'sport' }), 'boulders')).toBe(false)
    expect(problemStyleFilter(problem({ routetype: 'sport' }), 'routes')).toBe(true)
  })

  it('treats a problem added within the week as new', () => {
    const today = new Date().toISOString().slice(0, 10) + ' 08:00:00'
    expect(problemStyleFilter(problem({ added: today }), 'new')).toBe(true)
    expect(problemStyleFilter(problem({ added: '2020-01-01 08:00:00' }), 'new')).toBe(false)
  })

  it('finds projects and ticks only when the arrays have entries', () => {
    expect(problemStyleFilter(problem({ myProjects: [{}] }), 'projects')).toBe(true)
    expect(problemStyleFilter(problem({ myProjects: [] }), 'projects')).toBe(false)
    expect(problemStyleFilter(problem({ myProjects: null }), 'projects')).toBe(false)
    expect(problemStyleFilter(problem({ myTicks: [{}] }), 'ticked')).toBe(true)
  })

  it('flags expiring problems', () => {
    expect(problemStyleFilter(problem({ soontoberemoved: 1 }), 'expiring')).toBe(true)
    expect(problemStyleFilter(problem({ soontoberemoved: 0 }), 'expiring')).toBe(false)
  })

  // An unknown style returned undefined, which Array.filter treats as false —
  // so a typo silently emptied the list rather than failing loudly.
  it('does not silently hide every problem on an unknown style', () => {
    expect(problemStyleFilter(problem(), 'not_a_style')).toBe(true)
  })
})
