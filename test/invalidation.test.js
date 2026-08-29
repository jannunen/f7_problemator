import { describe, it, expect } from 'vitest'
import { INVALIDATES, keysInvalidatedBy } from '@js/invalidation'

describe('keysInvalidatedBy', () => {
  it('dirties everything a send touches', () => {
    const keys = keysInvalidatedBy('saveTick').map((k) => k[0])
    expect(keys).toContain('feed')
    expect(keys).toContain('new-problems')
    expect(keys).toContain('badges')
    expect(keys).toContain('ranking-top10')
    expect(keys).toContain('public-ascents')
  })

  it('undoes the same set when a send is removed', () => {
    const save = JSON.stringify(keysInvalidatedBy('saveTick'))
    expect(JSON.stringify(keysInvalidatedBy('deleteTick'))).toBe(save)
    expect(JSON.stringify(keysInvalidatedBy('deleteTickByProblem'))).toBe(save)
  })

  // Dropping a project climbs nothing, so no badge is earned and no ranking
  // moves. Over-invalidating here would refetch rankings on every tidy-up.
  it('does not touch badges or rankings when a project is dropped', () => {
    const keys = keysInvalidatedBy('deleteProject').map((k) => k[0])
    expect(keys).toEqual(['new-problems'])
  })

  it('treats likes as public but unscored', () => {
    for (const action of ['likeProblem', 'dislikeProblem']) {
      const keys = keysInvalidatedBy(action).map((k) => k[0])
      expect(keys).toContain('public-ascents')
      expect(keys).not.toContain('ranking-top10')
      expect(keys).not.toContain('badges')
    }
  })

  // Gym-scoped keys carry the gym id, so the key change alone refetches.
  // A broad invalidation here would discard every other gym's cache.
  it('invalidates nothing when the gym changes', () => {
    expect(keysInvalidatedBy('changeGym')).toEqual([])
  })

  it('returns nothing for a write that has no mapping', () => {
    expect(keysInvalidatedBy('somethingNobodyMapped')).toEqual([])
    expect(keysInvalidatedBy(undefined)).toEqual([])
  })

  it('de-duplicates repeated keys', () => {
    const keys = keysInvalidatedBy('saveTick')
    expect(new Set(keys.map((k) => JSON.stringify(k))).size).toBe(keys.length)
  })

  it('returns prefix arrays, so partial matching works', () => {
    for (const action of Object.keys(INVALIDATES)) {
      for (const key of keysInvalidatedBy(action)) {
        expect(Array.isArray(key)).toBe(true)
        expect(key.length).toBeGreaterThan(0)
        expect(typeof key[0]).toBe('string')
      }
    }
  })
})
