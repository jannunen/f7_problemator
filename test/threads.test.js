import { describe, it, expect } from 'vitest'
import { unreadTotal, threadTitle } from '../src/js/helpers/threads.js'

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
