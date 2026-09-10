/**
 * The decisions behind logging a board or personal session, kept out of the
 * component so they can be tested on their own.
 *
 * The session is a flat list of ascents rather than counts per grade,
 * because tries belong to a single climb: one try is a flash, more is a
 * redpoint, and that distinction is the whole of what a climber records. A
 * grouped shape cannot say "three flashes and two redpoints at 6B".
 */

/** Boards where the angle is a real, single number worth recording. */
export const BOARDS_WITH_ANGLE = ['kilter', 'tension', 'moon', 'grasshopper', 'decoy']

/**
 * `other` last and deliberately not called "none": it covers an unlisted
 * board, a home wall, and no board at all, and one bucket is enough because
 * the only thing the distinction would change is the angle — which it does
 * not ask for anyway.
 */
export const BOARDS = [...BOARDS_WITH_ANGLE, 'other']

export function needsAngle(board) {
  return BOARDS_WITH_ANGLE.includes(board)
}

/**
 * What the server is sent. Omits the angle entirely when the board has none,
 * rather than sending null — the endpoint ignores it there, and not sending
 * a field we do not mean is clearer than sending an empty one.
 */
export function buildPayload({ board, angle, gymId, date, ascents }) {
  const payload = {
    board,
    ascents: ascents.map((a) => ({
      gradeid: a.gradeid,
      tries: a.tries,
      ticktype: a.ticktype
    }))
  }

  if (needsAngle(board)) payload.angle = angle
  if (gymId) payload.board_gymid = gymId
  if (date) payload.date = date

  return payload
}

/**
 * The running totals shown while logging: how many sends, how many still
 * projects, and the hardest thing actually sent.
 *
 * Projects are counted apart and never considered for the hardest — a
 * climber who fell off a 7A twenty times has not done a 7A, and showing it
 * as their top grade for the session would be the one lie this screen could
 * tell.
 */
export function summarise(ascents, grades) {
  const sends = ascents.filter((a) => a.ticktype === 'tick')
  const projects = ascents.filter((a) => a.ticktype === 'pretick')

  let hardest = null
  let best = -1

  for (const a of sends) {
    const grade = grades?.[a.gradeid]
    const score = Number(grade?.score ?? -1)
    if (score > best) {
      best = score
      hardest = grade?.name ?? null
    }
  }

  return { sends: sends.length, projects: projects.length, hardest }
}

/**
 * Per-grade counts for the little histogram, in the order the grades
 * themselves are listed rather than the order they were logged.
 */
export function byGrade(ascents, gradeOrder) {
  const counts = {}
  for (const a of ascents) counts[a.gradeid] = (counts[a.gradeid] ?? 0) + 1

  return gradeOrder
    .filter((g) => counts[g.id])
    .map((g) => ({ gradeid: g.id, name: g.name, count: counts[g.id] }))
}

/**
 * What this session is worth, by the same rule the server uses: the sum of
 * problemator_grade.score over what was sent.
 *
 * Projects score nothing. A pretick is not a send, and counting one would
 * let a climber run their score up by falling off something hard over and
 * over — the same reason getDayScore() excludes them server-side. Tries do
 * not change it either; the grade is the grade.
 */
export function sessionScore(ascents, grades) {
  return ascents
    .filter((a) => a.ticktype === 'tick')
    .reduce((total, a) => total + Number(grades?.[a.gradeid]?.score ?? 0), 0)
}
