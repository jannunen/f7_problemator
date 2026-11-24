import { describe, it, expect } from 'vitest'
import { buildGymCompletion, completionPercent, formatGradeName } from '../src/js/gymCompletion.js'

// The scale as the API returns it: one list for every gym, easiest first,
// ending in the "project" pseudo-grade (whose score is 0, which is why
// nothing here sorts by score).
const grades = [
  { id: 1, name: '4', score: 200 },
  { id: 2, name: '4+', score: 250 },
  { id: 3, name: '5', score: 300 },
  { id: 4, name: '5+', score: 350 },
  { id: 5, name: '6a', score: 400 },
  { id: 6, name: '6a+', score: 450 },
  { id: 30, name: 'project', score: 0 },
]

let nextId = 1
const problem = (gradeId, over = {}) => ({
  id: nextId++,
  routetype: 'boulder',
  tag: 'B' + nextId,
  wall: { wallchar: 'A' },
  grade: gradeId == null ? null : grades.find((g) => g.id === gradeId),
  ...over,
})
const tick = (p) => ({ id: 9000 + p.id, problemid: p.id })
const names = (result) => result.rows.map((row) => row.name)

describe('completionPercent', () => {
  it('is zero with nothing set or nothing climbed', () => {
    expect(completionPercent(0, 0)).toBe(0)
    expect(completionPercent(0, 40)).toBe(0)
  })

  it('never rounds a partial result to 0 or 100', () => {
    expect(completionPercent(1, 400)).toBe(1)
    expect(completionPercent(399, 400)).toBe(99)
    expect(completionPercent(400, 400)).toBe(100)
  })

  it('rounds in between', () => {
    expect(completionPercent(112, 301)).toBe(37)
  })
})

describe('formatGradeName', () => {
  it('capitalises boulder grades and leaves the rest as the scale has them', () => {
    expect(formatGradeName('6a+', 'boulder')).toBe('6A+')
    expect(formatGradeName('6a+', 'sport')).toBe('6a+')
    expect(formatGradeName('6a+', 'all')).toBe('6a+')
  })

  it('shortens the project pseudo-grade and survives a missing name', () => {
    expect(formatGradeName('project', 'boulder')).toBe('proj')
    expect(formatGradeName(null, 'boulder')).toBe('')
  })
})

describe('buildGymCompletion', () => {
  it('returns an empty result before anything has loaded', () => {
    const result = buildGymCompletion()
    expect(result.rows).toEqual([])
    expect(result).toMatchObject({ total: 0, done: 0, left: 0, percent: 0, cleared: 0, gradeCount: 0, hardest: null, next: null })
  })

  it('counts set and climbed problems per grade', () => {
    const a = problem(3)
    const b = problem(3)
    const c = problem(4)
    const result = buildGymCompletion({ grades, problems: [a, b, c], ticks: [tick(a)] })

    expect(result.rows.map((r) => [r.name, r.done, r.total, r.left])).toEqual([
      ['5', 1, 2, 1],
      ['5+', 0, 1, 1],
    ])
    expect(result).toMatchObject({ total: 3, done: 1, left: 2, percent: 33, maxTotal: 2 })
  })

  it('matches ticks on problemid, whatever type the id arrives as', () => {
    const a = problem(3)
    // The tick's own id equalling another problem's id must not count.
    const b = problem(3)
    const result = buildGymCompletion({
      grades,
      problems: [a, b],
      ticks: [{ id: b.id, problemid: String(a.id) }],
    })
    expect(result.done).toBe(1)
    expect(result.rows[0].remaining.map((r) => r.problem.id)).toEqual([b.id])
  })

  it('counts a problem climbed several times once', () => {
    const a = problem(3)
    const result = buildGymCompletion({ grades, problems: [a], ticks: [tick(a), tick(a), tick(a)] })
    expect(result).toMatchObject({ done: 1, total: 1, percent: 100 })
  })

  it('buckets by the problem grade, not the grade on the tick', () => {
    const a = problem(3)
    const result = buildGymCompletion({ grades, problems: [a], ticks: [{ problemid: a.id, gradeid: 5 }] })
    expect(result.rows.map((r) => [r.name, r.done])).toEqual([['5', 1]])
  })

  it('drops unset grades off both ends but keeps gaps inside the scale', () => {
    const result = buildGymCompletion({ grades, problems: [problem(2), problem(5)] })
    expect(names(result)).toEqual(['4+', '5', '5+', '6a'])
    expect(result.rows.map((r) => r.total)).toEqual([1, 0, 0, 1])
  })

  it('applies the route type filter to the grade range as well as the counts', () => {
    const problems = [
      problem(1, { routetype: 'sport' }),
      problem(3, { routetype: 'boulder' }),
      problem(4, { routetype: 'boulder' }),
      problem(6, { routetype: 'sport' }),
    ]
    expect(names(buildGymCompletion({ grades, problems, routeType: 'all' }))).toEqual(['4', '4+', '5', '5+', '6a', '6a+'])
    expect(names(buildGymCompletion({ grades, problems, routeType: 'boulder' }))).toEqual(['5', '5+'])
    expect(buildGymCompletion({ grades, problems, routeType: 'sport' }).total).toBe(2)
  })

  it('keeps ungraded and project problems in the totals, outside the grade stats', () => {
    const sent = problem(3)
    const proj = problem(30)
    const nograde = problem(null)
    const unknown = problem(3, { grade: { id: 999, name: '?' } })
    const result = buildGymCompletion({
      grades,
      problems: [sent, proj, nograde, unknown],
      ticks: [tick(sent), tick(proj)],
    })

    expect(result.rows.map((r) => [r.key, r.total, r.rated])).toEqual([
      ['3', 1, true],
      ['30', 1, false],
      ['ungraded', 2, false],
    ])
    expect(result).toMatchObject({ total: 4, done: 2, gradeCount: 1, cleared: 1 })
    // A sent project is not anyone's hardest grade.
    expect(result.hardest.name).toBe('5')
  })

  it('reports cleared grades and the hardest grade climbed', () => {
    const a = problem(1)
    const b = problem(2)
    const c = problem(4)
    const d = problem(4)
    const result = buildGymCompletion({ grades, problems: [a, b, c, d, problem(6)], ticks: [tick(a), tick(b), tick(c)] })
    expect(result).toMatchObject({ gradeCount: 4, cleared: 2 })
    expect(result.hardest.name).toBe('5+')
  })

  it('lists what is left with attempted problems first, then by wall and tag', () => {
    const sent = problem(3)
    const wallB = problem(3, { tag: 'X1', wall: { wallchar: 'B' } })
    const wallA10 = problem(3, { tag: 'X10', wall: { wallchar: 'A' } })
    const wallA2 = problem(3, { tag: 'X2', wall: { wallchar: 'A' } })
    const attempted = problem(3, { tag: 'X9', wall: { wallchar: 'Z' } })
    const result = buildGymCompletion({
      grades,
      problems: [sent, wallB, wallA10, wallA2, attempted],
      ticks: [tick(sent)],
      tries: [{ problemid: attempted.id }],
    })
    const row = result.rows[0]
    expect(row.remaining.map((r) => r.problem.id)).toEqual([attempted.id, wallA2.id, wallA10.id, wallB.id])
    expect(row.remaining.map((r) => r.tried)).toEqual([true, false, false, false])
  })

  describe('next', () => {
    it('is the grade closest to cleared among the grades already climbed', () => {
      const five = [problem(3), problem(3), problem(3)]
      const fivePlus = [problem(4), problem(4), problem(4), problem(4)]
      const sixA = [problem(5), problem(5)]
      const result = buildGymCompletion({
        grades,
        problems: [...five, ...fivePlus, ...sixA, problem(6)],
        // 5: one left. 5+: three left. 6a: one left, same as 5.
        ticks: [tick(five[0]), tick(five[1]), tick(fivePlus[0]), tick(sixA[0])],
      })
      expect(result.next.kind).toBe('clear')
      // A tie goes to the easier grade.
      expect(result.next.row.name).toBe('5')
      expect(result.next.row.left).toBe(1)
    })

    it('ignores grades above the hardest one climbed', () => {
      const five = [problem(3), problem(3), problem(3)]
      const result = buildGymCompletion({
        grades,
        problems: [...five, problem(6)],
        ticks: [tick(five[0])],
      })
      // 6a+ has only one problem left, but nothing at that grade is climbed.
      expect(result.next).toMatchObject({ kind: 'clear', row: { name: '5', left: 2 } })
    })

    it('counts an untouched easier grade as within reach', () => {
      const sixA = [problem(5), problem(5), problem(5)]
      const result = buildGymCompletion({ grades, problems: [problem(1), ...sixA], ticks: [tick(sixA[0])] })
      // 4 has one problem left and 6a has two, so 4 is the closer one.
      expect(result.next).toMatchObject({ kind: 'clear', row: { name: '4', left: 1 } })
    })

    it('points at the easiest open grade when nothing is climbed yet', () => {
      const result = buildGymCompletion({ grades, problems: [problem(2), problem(4), problem(4)] })
      expect(result.next).toMatchObject({ kind: 'start', row: { name: '4+', left: 1 } })
    })

    it('points at the next grade up once everything within reach is cleared', () => {
      const a = problem(1)
      const result = buildGymCompletion({ grades, problems: [a, problem(3), problem(3)], ticks: [tick(a)] })
      expect(result.next).toMatchObject({ kind: 'start', row: { name: '5', left: 2 } })
    })

    it('is null once every graded problem is climbed', () => {
      const a = problem(1)
      const b = problem(2)
      const result = buildGymCompletion({ grades, problems: [a, b], ticks: [tick(a), tick(b)] })
      expect(result.next).toBeNull()
      expect(result).toMatchObject({ left: 0, percent: 100, cleared: 2, gradeCount: 2 })
    })
  })
})
