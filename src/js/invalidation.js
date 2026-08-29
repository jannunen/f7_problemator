import { invalidate } from '@js/queryKeyNames'

/**
 * Which cached reads a write makes stale.
 *
 * queryKeys.js already exported an `invalidate` map — "keys only, for
 * invalidation after a mutation" — and nothing in the app ever called it.
 * Every write went through a Vuex action, updated Vuex state, and told Query
 * nothing. The app still felt responsive only because VueQueryPlugin was
 * installed bare: with staleTime 0 and refetch-on-focus, everything was stale
 * the moment it arrived and any tab switch re-asked for all of it. That is
 * brute force standing in for invalidation, and it is why a tick could appear
 * to take effect only after leaving the screen and coming back.
 *
 * This table is the missing half. It is deliberately a plain data map rather
 * than invalidation scattered through the store: what a write dirties is a
 * fact about the domain, and facts belong somewhere you can read them all at
 * once and test them.
 *
 * A key here is a PREFIX. Invalidating ['badges'] clears every gym's badges,
 * which is what you want after earning one — you do not know which gym's set
 * it belonged to.
 */
export const INVALIDATES = {
  /**
   * Logging a send changes more than the route. The feed shows it to
   * followers, the new-problems list marks it climbed, badges may be earned
   * by it, and the rankings it counts towards move.
   */
  saveTick: () => [
    invalidate.feed(),
    invalidate.newProblems(),
    invalidate.badges(),
    invalidate.rankings(),
    invalidate.publicAscents(),
  ],

  /** Removing a send undoes all of the above. */
  deleteTick: () => [
    invalidate.feed(),
    invalidate.newProblems(),
    invalidate.badges(),
    invalidate.rankings(),
    invalidate.publicAscents(),
  ],

  /** Same, when removed by route rather than by tick id. */
  deleteTickByProblem: () => [
    invalidate.feed(),
    invalidate.newProblems(),
    invalidate.badges(),
    invalidate.rankings(),
    invalidate.publicAscents(),
  ],

  /**
   * A project is a route marked as being worked on. Dropping it changes the
   * new-problems list, which shows project state, but earns no badge and
   * moves no ranking — nothing was climbed.
   */
  deleteProject: () => [invalidate.newProblems()],

  /** Liking is public and visible on the route, but scores nothing. */
  likeProblem: () => [invalidate.publicAscents(), invalidate.newProblems()],
  dislikeProblem: () => [invalidate.publicAscents(), invalidate.newProblems()],

  /**
   * Switching gyms does not dirty anything by itself: every gym-scoped key
   * carries the gym id, so Query refetches on the key change alone. Listed
   * explicitly so the next person does not add a broad invalidation here and
   * throw away every other gym's cache on each switch.
   */
  changeGym: () => [],
}

/**
 * The keys a write dirties, flattened and de-duplicated.
 *
 * Unknown writes return [] rather than throwing: a store action that has not
 * been mapped yet should behave exactly as it did before this file existed,
 * not break.
 */
export function keysInvalidatedBy(action) {
  const entry = INVALIDATES[action]
  if (!entry) return []

  const seen = new Set()
  const out = []
  for (const key of entry()) {
    const id = JSON.stringify(key)
    if (seen.has(id)) continue
    seen.add(id)
    out.push(key)
  }
  return out
}
