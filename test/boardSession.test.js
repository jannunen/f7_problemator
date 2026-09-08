import { describe, it, expect } from 'vitest'
import {
  BOARDS,
  needsAngle,
  buildPayload,
  summarise,
  byGrade,
  sessionScore
} from '../src/js/helpers/boardSession.js'

const GRADES = {
  1: { id: 1, name: '6A', score: 600 },
  2: { id: 2, name: '6B', score: 650 },
  3: { id: 3, name: '7A', score: 900 }
}
const ORDER = [GRADES[1], GRADES[2], GRADES[3]]

describe('needsAngle', () => {
  it('is true for the real boards', () => {
    expect(needsAngle('kilter')).toBe(true)
    expect(needsAngle('grasshopper')).toBe(true)
  })

  // "Everything else" is a home wall or no board at all — there is no single
  // angle to give, so asking for one would be asking for a made-up number.
  it('is false for everything else', () => {
    expect(needsAngle('other')).toBe(false)
  })

  it('offers everything else last', () => {
    expect(BOARDS[BOARDS.length - 1]).toBe('other')
  })
})

describe('buildPayload', () => {
  const ascents = [{ gradeid: 2, tries: 1, ticktype: 'tick' }]

  it('sends the angle for a real board', () => {
    const p = buildPayload({ board: 'kilter', angle: 40, ascents })
    expect(p.angle).toBe(40)
  })

  // Not null — the endpoint ignores it there, and not sending a field we do
  // not mean is clearer than sending an empty one.
  it('omits the angle entirely for everything else', () => {
    const p = buildPayload({ board: 'other', angle: 40, ascents })
    expect('angle' in p).toBe(false)
  })

  it('sends the gym as board_gymid, never as gymid', () => {
    const p = buildPayload({ board: 'other', gymId: 7, ascents })
    expect(p.board_gymid).toBe(7)
    expect('gymid' in p).toBe(false)
  })

  it('omits the gym when there is none', () => {
    const p = buildPayload({ board: 'other', gymId: null, ascents })
    expect('board_gymid' in p).toBe(false)
  })

  // One entry per climb, tries and all — the whole reason for this shape.
  it('keeps tries per ascent rather than grouping them', () => {
    const p = buildPayload({
      board: 'moon',
      angle: 40,
      ascents: [
        { gradeid: 2, tries: 1, ticktype: 'tick' },
        { gradeid: 2, tries: 1, ticktype: 'tick' },
        { gradeid: 2, tries: 8, ticktype: 'tick' }
      ]
    })
    expect(p.ascents).toHaveLength(3)
    expect(p.ascents.map((a) => a.tries)).toEqual([1, 1, 8])
  })
})

describe('summarise', () => {
  it('counts sends and projects apart', () => {
    const s = summarise(
      [
        { gradeid: 2, tries: 1, ticktype: 'tick' },
        { gradeid: 3, tries: 20, ticktype: 'pretick' }
      ],
      GRADES
    )
    expect(s.sends).toBe(1)
    expect(s.projects).toBe(1)
  })

  // A climber who fell off a 7A twenty times has not done a 7A. Showing it
  // as their top grade is the one lie this screen could tell.
  it('never counts a project as the hardest', () => {
    const s = summarise(
      [
        { gradeid: 2, tries: 1, ticktype: 'tick' },
        { gradeid: 3, tries: 20, ticktype: 'pretick' }
      ],
      GRADES
    )
    expect(s.hardest).toBe('6B')
  })

  it('has no hardest when nothing has been sent', () => {
    expect(summarise([], GRADES).hardest).toBeNull()
    expect(summarise([{ gradeid: 3, tries: 9, ticktype: 'pretick' }], GRADES).hardest).toBeNull()
  })

  it('survives a grade the store does not know', () => {
    const s = summarise([{ gradeid: 99, tries: 1, ticktype: 'tick' }], GRADES)
    expect(s.sends).toBe(1)
    expect(s.hardest).toBeNull()
  })
})

describe('byGrade', () => {
  it('counts per grade in grade order, not logging order', () => {
    const h = byGrade(
      [
        { gradeid: 3, tries: 1, ticktype: 'tick' },
        { gradeid: 1, tries: 1, ticktype: 'tick' },
        { gradeid: 1, tries: 1, ticktype: 'tick' }
      ],
      ORDER
    )
    expect(h.map((x) => x.name)).toEqual(['6A', '7A'])
    expect(h[0].count).toBe(2)
  })

  it('leaves out grades with nothing logged', () => {
    const h = byGrade([{ gradeid: 2, tries: 1, ticktype: 'tick' }], ORDER)
    expect(h).toHaveLength(1)
    expect(h[0].name).toBe('6B')
  })
})

describe('sessionScore', () => {
  it('sums grade.score over what was sent', () => {
    const s = sessionScore(
      [
        { gradeid: 1, tries: 1, ticktype: 'tick' },
        { gradeid: 2, tries: 1, ticktype: 'tick' }
      ],
      GRADES
    )
    expect(s).toBe(1250)
  })

  // Same rule the server applies: counting a project would let a climber run
  // their score up by falling off something hard over and over.
  it('scores a project as nothing', () => {
    const s = sessionScore([{ gradeid: 3, tries: 20, ticktype: 'pretick' }], GRADES)
    expect(s).toBe(0)
  })

  it('does not let tries change the score', () => {
    const once = sessionScore([{ gradeid: 2, tries: 1, ticktype: 'tick' }], GRADES)
    const hard = sessionScore([{ gradeid: 2, tries: 14, ticktype: 'tick' }], GRADES)
    expect(hard).toBe(once)
  })

  it('treats an unknown grade as worth nothing rather than NaN', () => {
    expect(sessionScore([{ gradeid: 99, tries: 1, ticktype: 'tick' }], GRADES)).toBe(0)
  })
})
