import { describe, it, expect } from 'vitest'
import { unreadTotal, threadTitle, coachesToStartWith } from '../src/js/helpers/threads.js'

describe('unreadTotal', () => {
  it('adds up what is waiting across threads', () => {
    expect(unreadTotal([{ unread_count: 2 }, { unread_count: 3 }])).toBe(5)
  })

  it('is zero when nothing is waiting', () => {
    expect(unreadTotal([{ unread_count: 0 }])).toBe(0)
  })

  // Relations and counts arrive absent rather than null from this API, and an
  // unguarded read here would put NaN on the home screen badge.
  it('survives threads with no count, and no threads at all', () => {
    expect(unreadTotal([{}, { unread_count: 1 }])).toBe(1)
    expect(unreadTotal([])).toBe(0)
    expect(unreadTotal(null)).toBe(0)
    expect(unreadTotal(undefined)).toBe(0)
  })
})

describe('threadTitle', () => {
  const thread = {
    participants: [
      { climber_id: 1, name: 'Aino K' },
      { climber_id: 2, name: 'Coach Ville' },
    ],
  }

  it('names the other person, not you', () => {
    expect(threadTitle(thread, 1)).toBe('Coach Ville')
    expect(threadTitle(thread, 2)).toBe('Aino K')
  })

  it('falls back rather than rendering nothing', () => {
    expect(threadTitle({ participants: [] }, 1)).toBe('')
    expect(threadTitle({}, 1)).toBe('')
    expect(threadTitle(null, 1)).toBe('')
  })

  // Phase 2 adds group threads with several other participants. Naming them
  // all is the sane default until that phase decides otherwise.
  it('joins several other participants', () => {
    const group = {
      participants: [
        { climber_id: 1, name: 'Aino K' },
        { climber_id: 2, name: 'Coach Ville' },
        { climber_id: 3, name: 'Sanna R' },
      ],
    }
    expect(threadTitle(group, 1)).toBe('Coach Ville, Sanna R')
  })

  // Called with store.state.climber?.id, which is undefined before the
  // climber has loaded. "!== undefined" excludes nobody, so without a guard
  // the reader's own name would print right alongside everyone else's.
  it('does not include everyone when the reader\'s own id is not known yet', () => {
    expect(threadTitle(thread, undefined)).toBe('')
    expect(threadTitle(thread, null)).toBe('')
  })
})

describe('coachesToStartWith', () => {
  const rel = (coachId, first, last) => ({
    coach_climber_id: coachId,
    coach: { id: coachId, etunimi: first, sukunimi: last },
  })

  it('offers a coach the climber has no thread with yet', () => {
    expect(coachesToStartWith([rel(9, 'Ville', 'K')], [])).toEqual([
      { climberId: 9, name: 'Ville K' },
    ])
  })

  /**
   * The whole point of the filter: a second "Message Ville" button beside an
   * existing Ville thread invites a duplicate the server would hand straight
   * back anyway.
   */
  it('does not offer a coach there is already a thread with', () => {
    expect(coachesToStartWith([rel(9, 'Ville', 'K')], [{ coach_climber_id: 9 }])).toEqual([])
  })

  it('offers the second coach while hiding the first', () => {
    const out = coachesToStartWith(
      [rel(9, 'Ville', 'K'), rel(12, 'Sanna', 'R')],
      [{ coach_climber_id: 9 }]
    )
    expect(out).toEqual([{ climberId: 12, name: 'Sanna R' }])
  })

  // Relations arrive absent rather than null from this API, and an unguarded
  // read here would break the one screen that offers a way in.
  it('survives absent coaches, absent threads, and missing name parts', () => {
    expect(coachesToStartWith(null, null)).toEqual([])
    expect(coachesToStartWith([], [])).toEqual([])
    expect(coachesToStartWith([{}], [])).toEqual([])
    expect(coachesToStartWith([{ coach_climber_id: 4, coach: { id: 4, etunimi: 'Aino' } }], []))
      .toEqual([{ climberId: 4, name: 'Aino' }])
  })

  it('ignores a thread row with no coach id rather than dropping everyone', () => {
    expect(coachesToStartWith([rel(9, 'Ville', 'K')], [{}, { coach_climber_id: null }]))
      .toEqual([{ climberId: 9, name: 'Ville K' }])
  })
})
