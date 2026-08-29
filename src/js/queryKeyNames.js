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
}
