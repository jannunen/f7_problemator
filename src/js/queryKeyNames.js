/**
 * Query key prefixes, with no dependencies.
 *
 * Split out of queryKeys.js because that file imports the api module, and
 * api.js assigns `window.api` at load — which is fine in a browser and fatal
 * anywhere else. The key names are pure data and nothing about them needs the
 * api, so invalidation (and its tests) can reach them without dragging a
 * browser global along.
 *
 * queryKeys.js re-exports this, so existing importers are unaffected.
 */
import { toValue } from 'vue'

/**
 * compid, consistently typed. It arrives as two different types depending
 * on where it's read: a Framework7 route param (always a string — routers
 * never coerce: `node_modules/framework7/.../router-class.js` decodes the
 * URL segment straight into `route.params`, and framework7-vue spreads
 * `route.params` into component props untouched) when a page first asks
 * for a competition, versus an already-fetched competition object's own
 * numeric `.id` field (from the JSON response) when a mutation or the
 * saveTick/deleteTickByProblem bridge (store.js) writes back into the same
 * cache entry. TanStack's cache key hashing (`hashKey` in
 * @tanstack/query-core) is a plain `JSON.stringify` with no type coercion,
 * so `['competition', '7']` and `['competition', 7]` hash to two different
 * cache entries for the one competition. Every place a compid enters one
 * of the competition/compResults query keys — reading in queryKeys.js,
 * writing in mutations.js/store.js — goes through this first, so a
 * route-param string and a fetched object's numeric id always land in the
 * same entry.
 *
 * `toValue`, not a bare value or `unref`: a caller may pass a plain value,
 * a ref/computed, OR a plain getter function (`() => props.compid`, the
 * pattern SingleCompetitionPage.vue/CompetitionEntry.vue/etc. use) — unref
 * only resolves the first two (it never calls a function), so a raw getter
 * passed straight to `Number(...)` would coerce the function itself, not
 * its value. `toValue` (Vue 3.3+) resolves all three before this coerces.
 */
export const asCompId = (compid) => {
  const resolved = toValue(compid)
  return resolved == null ? resolved : Number(resolved)
}

/**
 * Keys only, for invalidation after a mutation.
 *
 * Partial keys match by prefix, so invalidating ['badges'] clears every
 * gym's badges — which is what you want after earning one, since you do not
 * know which gym's set it belonged to.
 */
export const invalidate = {
  gyms: () => ['gyms'],
  badges: () => ['badges'],
  competitions: () => ['competitions'],
  feed: () => ['feed'],
  newProblems: () => ['new-problems'],
  publicAscents: (problemId) => (problemId ? ['public-ascents', problemId] : ['public-ascents']),
  rankings: () => ['ranking-top10'],
  sprayWalls: () => ['spray-walls'],
  sprayWallProblems: () => ['spray-wall-problems'],
  virtualCoach: () => ['virtual-coach'],
}
