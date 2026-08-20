/**
 * Turning a prescribed item into something a climber can read on a phone.
 *
 * The coach's own words carry the intent, so they lead. These are the numbers
 * underneath them.
 */

const DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const dayName = (day) => DAYS[day] ?? ''

/** The prescription, in the order a climber reads it. */
export function prescribed(item, t) {
  const bits = []

  if (item.sets && item.reps) bits.push(`${item.sets} × ${item.reps}`)
  else if (item.sets) bits.push(t('training.sets', { n: item.sets }))
  else if (item.reps) bits.push(t('training.reps', { n: item.reps }))

  if (item.load_kg) bits.push(`${Number(item.load_kg)} kg`)
  if (item.duration_seconds) bits.push(`${item.duration_seconds}s`)
  if (item.rest_seconds) bits.push(t('training.rest', { n: item.rest_seconds }))
  if (item.target_count) bits.push(`× ${item.target_count}`)

  if (item.target_grade) {
    bits.push(item.target_grade)
  } else if (item.target_grade_offset != null) {
    // Relative grades are the useful kind in a written programme, but they are
    // meaningless without saying what they are relative to.
    const sign = item.target_grade_offset > 0 ? '+' : ''
    bits.push(`${sign}${item.target_grade_offset} ${t('training.from_' + item.target_grade_basis)}`)
  }

  if (item.params?.circuit_name) bits.push(t('training.on_circuit', { name: item.params.circuit_name }))

  return bits.join(' · ')
}

/** What was actually done, when it differs from what was asked. */
export function actual(item, t) {
  const r = item.result
  if (!r) return ''
  if (r.skipped) return t('training.skipped')

  const bits = []
  if (r.actual_sets && r.actual_reps) bits.push(`${r.actual_sets} × ${r.actual_reps}`)
  else if (r.actual_sets) bits.push(t('training.sets', { n: r.actual_sets }))
  if (r.actual_load_kg) bits.push(`${Number(r.actual_load_kg)} kg`)
  if (r.actual_count) bits.push(`× ${r.actual_count}`)
  if (r.rpe) bits.push(`RPE ${r.rpe}`)

  return bits.join(' · ')
}

/**
 * Where a climber is in a programme.
 *
 * Counting sessions rather than weeks: a programme is done when the work is
 * done, and a week with three rest days is not a third of the effort of one
 * with three hard sessions.
 */
export function progress(assignment) {
  // Two shapes reach this. The list endpoints send counts, because a home
  // card needs two integers and not seventy session rows; the detail endpoint
  // sends the sessions themselves, because the page draws every one of them.
  // Reading only `sessions` meant every list view reported "0 of 0".
  if (assignment?.sessions_count != null) {
    return {
      done: assignment.completed_sessions_count ?? 0,
      total: assignment.sessions_count
    }
  }

  const sessions = assignment?.sessions ?? []
  const done = sessions.filter((s) => s.completed_at).length
  return { done, total: sessions.length }
}
