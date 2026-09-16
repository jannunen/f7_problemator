import { describe, it, expect } from 'vitest'
import { tickPlace, tickGradeName } from '../src/js/helpers/tickPlace.js'

describe('tickPlace', () => {
  it('names the gym for an ordinary gym tick', () => {
    expect(tickPlace({ gymid: 3, gym: { id: 3, name: 'Salmisaari' } }))
      .toEqual({ type: 'gym', name: 'Salmisaari' })
  })

  // The crash: a board send has gym null, and the template read gym.name.
  it('describes a board send instead of reaching into a null gym', () => {
    expect(tickPlace({ gymid: null, gym: null, board_type: 'kilter', board_angle: 40 }))
      .toEqual({ type: 'board', board: 'kilter', angle: 40 })
  })

  // "Everything else" has no angle; 0 is a real setting (a vertical board).
  it('keeps a missing angle distinct from an angle of zero', () => {
    expect(tickPlace({ gym: null, board_type: 'other', board_angle: null }).angle).toBeNull()
    expect(tickPlace({ gym: null, board_type: 'kilter', board_angle: 0 }).angle).toBe(0)
  })

  it('returns nothing rather than throwing when there is neither', () => {
    expect(tickPlace({ gym: null })).toBeNull()
    expect(tickPlace(null)).toBeNull()
    expect(tickPlace(undefined)).toBeNull()
    expect(tickPlace({})).toBeNull()
  })

  // A gym that is present but nameless must not render as "@undefined".
  it('falls through when the gym exists but has no name', () => {
    expect(tickPlace({ gym: { id: 3 }, board_type: 'moon', board_angle: 40 }).type).toBe('board')
    expect(tickPlace({ gym: { id: 3 } })).toBeNull()
  })
})

describe('tickGradeName', () => {
  it('reads the grade when there is one', () => {
    expect(tickGradeName({ grade: { name: '6B' } })).toBe('6B')
  })

  it('returns null for an ungraded problem instead of throwing', () => {
    expect(tickGradeName({ grade: null })).toBeNull()
    expect(tickGradeName({})).toBeNull()
    expect(tickGradeName(null)).toBeNull()
  })
})
