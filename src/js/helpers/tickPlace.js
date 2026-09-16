/**
 * Where a tick happened, for a list that has to show both gym routes and
 * board or personal sends.
 *
 * A board or personal send has `gymid` NULL on purpose — it is the climber's
 * own send, not a route in a gym's catalogue — so `problem.gym` comes back
 * null on every one of them. The archive rendered `tick.problem.gym.name`
 * unguarded, which throws on the first such tick and takes the whole day's
 * list down with it: the symptom was not "my board ticks are missing" but
 * "the archive is empty".
 *
 * Returns a descriptor rather than a string because the board names are
 * translated and the component owns i18n.
 */
export function tickPlace(problem) {
  const gym = problem?.gym?.name
  if (gym) return { type: 'gym', name: gym }

  const board = problem?.board_type
  if (board) {
    return {
      type: 'board',
      board,
      // Null is not zero here. "Everything else" has no angle at all, while
      // 0° is a real setting — a vertical board — so they must not render
      // the same way.
      angle: problem.board_angle ?? null
    }
  }

  return null
}

/**
 * The grade's name, or null when the problem has none.
 *
 * Ungraded problems exist (gradeid 0 arrives as an absent relation, not a
 * null one), and the archive groups by `problem.grade.name` — so one of them
 * empties the same list for the same reason.
 */
export function tickGradeName(problem) {
  return problem?.grade?.name ?? null
}
