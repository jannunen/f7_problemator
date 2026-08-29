/**
 * Where the home screen's training card goes, and what the programme list
 * shows.
 *
 * Kept out of the components because both answers are decisions rather than
 * markup, and because the card's destination used to disagree with what the
 * card displayed: it showed one programme and then navigated to a list.
 */

export const ACTIVE = 'active'

/** Programmes still being trained. `cancelled` never reaches the client. */
export const activeOnes = (assignments) =>
  (assignments ?? []).filter((a) => a?.status === ACTIVE)

/**
 * Where tapping the card should land.
 *
 * Straight into the programme the card is showing. Sending someone to a list
 * to pick the thing they were just looking at is a step that exists only
 * because it was easier to build.
 */
export function trainingCardTarget(active) {
  return active?.id != null ? `/training/${active.id}` : '/training'
}

/**
 * Whether to offer a way to the full list.
 *
 * Only when more than one programme is actually being trained. A climber
 * with one active block and four finished ones is not choosing between
 * five things, and a link implying they are is noise on the home screen.
 */
export function shouldOfferList(assignments) {
  return activeOnes(assignments).length > 1
}

/** The three filters the programme list offers. */
export const FILTERS = ['active', 'inactive', 'all']

/**
 * Active first, because it is what a climber opens the page to find. The
 * others stay reachable — a finished block is worth looking back at, and
 * hiding it entirely would be worse than one extra tap.
 */
export const DEFAULT_FILTER = 'active'

export function filterAssignments(assignments, filter) {
  const all = assignments ?? []

  if (filter === 'active') return all.filter((a) => a?.status === ACTIVE)
  if (filter === 'inactive') return all.filter((a) => a?.status !== ACTIVE)

  return [...all]
}
