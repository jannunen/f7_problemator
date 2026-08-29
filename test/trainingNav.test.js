import { describe, it, expect } from 'vitest'
import {
  trainingCardTarget,
  shouldOfferList,
  filterAssignments,
  DEFAULT_FILTER,
} from '../src/js/helpers/trainingNav.js'

const a = (id, status) => ({ id, status })

describe('trainingCardTarget', () => {
  /**
   * The bug this replaces: the card showed one programme and then navigated
   * to a list, so you picked the thing you had just been looking at.
   */
  it('goes straight into the programme the card is showing', () => {
    expect(trainingCardTarget(a(7, 'active'))).toBe('/training/7')
  })

  it('falls back to the list when there is no programme to open', () => {
    expect(trainingCardTarget(null)).toBe('/training')
    expect(trainingCardTarget(undefined)).toBe('/training')
    expect(trainingCardTarget({})).toBe('/training')
  })
})

describe('shouldOfferList', () => {
  it('offers nothing when only one programme is being trained', () => {
    expect(shouldOfferList([a(1, 'active')])).toBe(false)
  })

  it('offers the list when several are', () => {
    expect(shouldOfferList([a(1, 'active'), a(2, 'active')])).toBe(true)
  })

  /**
   * Finished blocks do not count. A climber with one active block and four
   * completed ones is not choosing between five things.
   */
  it('does not count finished programmes', () => {
    expect(shouldOfferList([a(1, 'active'), a(2, 'completed'), a(3, 'completed')])).toBe(false)
  })

  it('survives an empty or missing list', () => {
    expect(shouldOfferList([])).toBe(false)
    expect(shouldOfferList(null)).toBe(false)
    expect(shouldOfferList(undefined)).toBe(false)
  })
})

describe('filterAssignments', () => {
  const all = [a(1, 'active'), a(2, 'completed'), a(3, 'active')]

  it('defaults to active, which is what the page opens on', () => {
    expect(DEFAULT_FILTER).toBe('active')
    expect(filterAssignments(all, DEFAULT_FILTER).map((x) => x.id)).toEqual([1, 3])
  })

  it('shows the finished ones under inactive', () => {
    expect(filterAssignments(all, 'inactive').map((x) => x.id)).toEqual([2])
  })

  it('shows everything under all', () => {
    expect(filterAssignments(all, 'all').map((x) => x.id)).toEqual([1, 2, 3])
  })

  // The API already drops cancelled ones, so anything not active is finished
  // as far as this page is concerned.
  it('treats any non-active status as inactive', () => {
    expect(filterAssignments([a(9, 'something_new')], 'inactive').map((x) => x.id)).toEqual([9])
    expect(filterAssignments([a(9, 'something_new')], 'active')).toEqual([])
  })

  it('does not hand back the caller its own array', () => {
    const source = [a(1, 'active')]
    expect(filterAssignments(source, 'all')).not.toBe(source)
  })

  it('survives an empty or missing list', () => {
    expect(filterAssignments([], 'active')).toEqual([])
    expect(filterAssignments(null, 'all')).toEqual([])
  })
})
