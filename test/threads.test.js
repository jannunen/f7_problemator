import { describe, it, expect } from 'vitest'
import {
  unreadTotal,
  threadTitle,
  coachesToStartWith,
  isCoach,
  normalizeSendResult,
  buildOptimisticMessage,
  reconcileOptimisticMessage,
  isAdaThread,
} from '../src/js/helpers/threads.js'

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

describe('isCoach', () => {
  const thread = { coach_climber_id: 9 }

  it('recognises the coach', () => {
    expect(isCoach(9, thread)).toBe(true)
  })

  it('does not label a climber a coach', () => {
    expect(isCoach(4, thread)).toBe(false)
  })

  // The ids cross a JSON boundary and arrive as either, so a string 9 and a
  // number 9 are the same person.
  it('does not care whether the ids are strings or numbers', () => {
    expect(isCoach('9', thread)).toBe(true)
    expect(isCoach(9, { coach_climber_id: '9' })).toBe(true)
  })

  /**
   * Both guards matter. An absent coach_climber_id would otherwise make
   * everyone a coach, and two absent ids would match each other.
   */
  it('labels nobody when either id is missing', () => {
    expect(isCoach(9, {})).toBe(false)
    expect(isCoach(9, null)).toBe(false)
    expect(isCoach(null, thread)).toBe(false)
    expect(isCoach(undefined, { coach_climber_id: undefined })).toBe(false)
  })
})

describe('normalizeSendResult', () => {
  it('splits the envelope into the sent message and Ada\'s reply', () => {
    const envelope = {
      message: { id: 123, body: 'hi', sender_climber_id: 42 },
      coach_reply: { id: 124, body: 'hello back', sender_climber_id: 990001 },
      coach_failed: false,
    }
    expect(normalizeSendResult(envelope)).toEqual({
      message: { id: 123, body: 'hi', sender_climber_id: 42 },
      coachReply: { id: 124, body: 'hello back', sender_climber_id: 990001 },
      coachFailed: false,
    })
  })

  // The common case for a human-coached thread: Ada never runs, so there is
  // no reply to show and nothing failed.
  it('reads a null coach_reply as no reply', () => {
    const envelope = { message: { id: 1, body: 'hi' }, coach_reply: null, coach_failed: false }
    expect(normalizeSendResult(envelope)).toEqual({
      message: { id: 1, body: 'hi' },
      coachReply: null,
      coachFailed: false,
    })
  })

  it('surfaces coach_failed so the caller can tell the climber Ada could not answer', () => {
    const envelope = { message: { id: 1, body: 'hi' }, coach_reply: null, coach_failed: true }
    expect(normalizeSendResult(envelope).coachFailed).toBe(true)
  })

  // An older backend, or any other caller of the same endpoint, may still
  // hand back the bare row this endpoint used to return. Without this the
  // page would push an object with no body/sender_climber_id and render a
  // broken bubble.
  it('treats a response with no message key as an old-style bare row', () => {
    const bareRow = { id: 1, body: 'hi', sender_climber_id: 42 }
    expect(normalizeSendResult(bareRow)).toEqual({
      message: { id: 1, body: 'hi', sender_climber_id: 42 },
      coachReply: null,
      coachFailed: false,
    })
  })

  it('survives a missing response rather than throwing', () => {
    expect(normalizeSendResult(null)).toEqual({ message: null, coachReply: null, coachFailed: false })
    expect(normalizeSendResult(undefined)).toEqual({ message: null, coachReply: null, coachFailed: false })
  })
})

describe('buildOptimisticMessage', () => {
  it('shapes a bubble that looks like any other message', () => {
    const msg = buildOptimisticMessage('hi coach', 42, 'optimistic-1')
    expect(msg.id).toBe('optimistic-1')
    expect(msg.body).toBe('hi coach')
    expect(msg.sender_climber_id).toBe(42)
    expect(msg.pending).toBe(true)
    expect(typeof msg.created_at).toBe('string')
  })

  // A component that never passes its own id still gets one, and two calls
  // in a row do not collide — sending twice quickly must not reconcile the
  // wrong bubble.
  it('mints its own id when none is given', () => {
    const a = buildOptimisticMessage('one', 1)
    const b = buildOptimisticMessage('two', 1)
    expect(a.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })
})

describe('reconcileOptimisticMessage', () => {
  const pending = { id: 'optimistic-1', body: 'hi', sender_climber_id: 1, pending: true }
  const confirmed = { id: 501, body: 'hi', sender_climber_id: 1, created_at: '2026-01-01T00:00:00Z' }

  it('swaps the pending bubble for the confirmed row, in place', () => {
    const before = [{ id: 1, body: 'earlier' }, pending]
    const after = reconcileOptimisticMessage(before, 'optimistic-1', confirmed)
    expect(after).toEqual([{ id: 1, body: 'earlier' }, confirmed])
  })

  // The request failed — nothing to swap in, so the pending bubble is just
  // dropped rather than left looking sent.
  it('removes the pending bubble when there is no server message', () => {
    const before = [{ id: 1, body: 'earlier' }, pending]
    expect(reconcileOptimisticMessage(before, 'optimistic-1', null)).toEqual([{ id: 1, body: 'earlier' }])
  })

  // Should not happen in practice, but a reconcile must never silently drop
  // the climber's message just because its bubble was not found.
  it('appends rather than dropping the message when the pending id is gone', () => {
    const before = [{ id: 1, body: 'earlier' }]
    expect(reconcileOptimisticMessage(before, 'optimistic-1', confirmed)).toEqual([
      { id: 1, body: 'earlier' },
      confirmed,
    ])
  })

  it('survives an empty or missing message list', () => {
    expect(reconcileOptimisticMessage([], 'optimistic-1', confirmed)).toEqual([confirmed])
    expect(reconcileOptimisticMessage(null, 'optimistic-1', confirmed)).toEqual([confirmed])
    expect(reconcileOptimisticMessage(null, 'optimistic-1', null)).toEqual([])
  })
})

describe('isAdaThread', () => {
  it('recognises the thread that matches the virtual coach thread_id', () => {
    expect(isAdaThread({ id: 77 }, 77)).toBe(true)
  })

  it('does not match a different thread', () => {
    expect(isAdaThread({ id: 77 }, 78)).toBe(false)
  })

  // The ids cross a JSON boundary and arrive as either, same as isCoach.
  it('does not care whether the ids are strings or numbers', () => {
    expect(isAdaThread({ id: '77' }, 77)).toBe(true)
    expect(isAdaThread({ id: 77 }, '77')).toBe(true)
  })

  /**
   * Both guards matter. Ada not being hired means adaThreadId is null, and
   * an unguarded compare would otherwise need every open thread's id to
   * also be null to fail safely — a coincidence better not to rely on.
   */
  it('labels no thread Ada\'s when either id is missing', () => {
    expect(isAdaThread({ id: 77 }, null)).toBe(false)
    expect(isAdaThread({}, 77)).toBe(false)
    expect(isAdaThread(null, 77)).toBe(false)
    expect(isAdaThread(null, null)).toBe(false)
  })
})

