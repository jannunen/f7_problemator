/**
 * How much of a gym's current set a climber has climbed, grade by grade.
 *
 * Pure: takes the already-loaded profile payload (grade scale, the gym's
 * problems) and the climber's ticks/tries, and returns everything the gym
 * completion page shows. No Vue, no fetching.
 */

/** The grade scale ends in a pseudo-grade for unfinished problems. */
const PROJECT_GRADE = 'project'

const idSet = (rows) => new Set((rows ?? []).map((row) => String(row.problemid)))

const byWallThenTag = (a, b) =>
  String(a.wall?.wallchar ?? '').localeCompare(String(b.wall?.wallchar ?? ''), undefined, { numeric: true }) ||
  String(a.tag ?? '').localeCompare(String(b.tag ?? ''), undefined, { numeric: true })

/**
 * A whole-number share that never rounds a partial result into a finished or
 * an untouched one: 299 of 300 is 99%, not 100%, and 1 of 300 is 1%, not 0%.
 */
export function completionPercent(done, total) {
  if (!total || done <= 0) return 0
  if (done >= total) return 100
  return Math.min(99, Math.max(1, Math.round((done / total) * 100)))
}

/** Boulder grades are written in capitals, sport grades in lower case. */
export function formatGradeName(name, routeType) {
  if (name == null) return ''
  if (name === PROJECT_GRADE) return 'proj'
  return routeType === 'boulder' ? name.toUpperCase() : name
}

/**
 * The grade to point the climber at next.
 *
 * Within the grades they already climb, that is the one with the fewest
 * problems left: the closest to being cleared. Counting grades above their
 * hardest send would recommend the single 8a in the gym to someone climbing
 * 6a. With nothing left at or below their level, or nothing climbed yet, it
 * is the easiest grade that still has something to climb.
 */
function pickNext(rated) {
  const open = rated.filter((row) => row.left > 0)
  if (open.length === 0) return null

  const hardestIndex = rated.reduce((last, row, index) => (row.done > 0 ? index : last), -1)
  const withinReach = open.filter((row) => rated.indexOf(row) <= hardestIndex)
  if (withinReach.length === 0) return { kind: 'start', row: open[0] }

  // Strict less-than keeps the easier grade on a tie.
  const closest = withinReach.reduce((best, row) => (row.left < best.left ? row : best))
  return { kind: 'clear', row: closest }
}

/**
 * @param {object}   input
 * @param {object[]} input.grades    the gym's grade scale, easiest first
 * @param {object[]} input.problems  the gym's active problems
 * @param {object[]} input.ticks     the climber's sends (`problemid`)
 * @param {object[]} input.tries     the climber's logged attempts (`problemid`)
 * @param {string}   input.routeType 'all', 'boulder' or 'sport'
 */
export function buildGymCompletion({ grades = [], problems = [], ticks = [], tries = [], routeType = 'all' } = {}) {
  const ticked = idSet(ticks)
  const tried = idSet(tries)

  const newRow = (key, grade) => ({
    key,
    gradeId: grade?.id ?? null,
    name: grade?.name ?? null,
    // Counts toward "grades cleared" and "hardest": a real grade, not the
    // project pseudo-grade and not the ungraded bucket.
    rated: grade != null && grade.name !== PROJECT_GRADE,
    total: 0,
    done: 0,
    left: 0,
    remaining: [],
  })

  const gradeRows = new Map(grades.map((grade) => [String(grade.id), newRow(String(grade.id), grade)]))
  const ungraded = newRow('ungraded', null)

  for (const problem of problems) {
    if (problem == null) continue
    if (routeType !== 'all' && problem.routetype !== routeType) continue

    // Bucketed by the PROBLEM's grade, never the tick's: a tick carries its
    // own gradeid, which differs once a climber has given a grade opinion.
    // An ungraded problem, or one whose grade is missing from the scale,
    // still counts, so the rows always add up to the headline.
    const row = (problem.grade != null && gradeRows.get(String(problem.grade.id))) || ungraded
    row.total += 1
    if (ticked.has(String(problem.id))) {
      row.done += 1
    } else {
      row.remaining.push({ problem, tried: tried.has(String(problem.id)) })
    }
  }

  const all = [...gradeRows.values(), ungraded]
  for (const row of all) {
    row.left = row.total - row.done
    // Attempted problems first: they are the ones closest to being sent.
    row.remaining.sort((a, b) => Number(b.tried) - Number(a.tried) || byWallThenTag(a.problem, b.problem))
  }

  // The scale runs 4 to 9a for every gym. Drop the unset grades off both
  // ends, but keep the gaps in between so the scale still reads as a scale.
  const scale = all.filter((row) => row.rated)
  const first = scale.findIndex((row) => row.total > 0)
  const last = scale.length - 1 - [...scale].reverse().findIndex((row) => row.total > 0)
  const rated = first === -1 ? [] : scale.slice(first, last + 1)
  const rows = [...rated, ...all.filter((row) => !row.rated && row.total > 0)]

  const total = rows.reduce((sum, row) => sum + row.total, 0)
  const done = rows.reduce((sum, row) => sum + row.done, 0)
  const set = rated.filter((row) => row.total > 0)

  return {
    rows,
    total,
    done,
    left: total - done,
    percent: completionPercent(done, total),
    maxTotal: rows.reduce((max, row) => Math.max(max, row.total), 0),
    gradeCount: set.length,
    cleared: set.filter((row) => row.left === 0).length,
    hardest: [...rated].reverse().find((row) => row.done > 0) ?? null,
    next: pickNext(rated),
  }
}
