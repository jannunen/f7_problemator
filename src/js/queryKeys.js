import { computed, unref } from 'vue'
import api from '@js/api'
import { isAuthenticated } from './authToken.js'

/**
 * Every server query the app makes, in one place.
 *
 * A query has two halves that must agree: the key it caches under and the
 * call it makes. Spread across components they drift, and the drift is
 * invisible — two screens quietly cache the same request under different
 * keys, or worse, different requests under the same one. Both had already
 * happened here:
 *
 *   - Two components asked for badges under the key ['badges'] and called
 *     api.getBadges() with no gym. The endpoint answers with nothing
 *     without one, and the key had no gym in it either, so switching gyms
 *     would not have refetched.
 *
 *   - Four screens share the key ['upcomingCompetitions'] and the call
 *     api.getUpcomingCompetitions(). That one is correct — the endpoint
 *     returns { upcoming, ongoing, past } in a single payload, so one
 *     request genuinely serves all three — but nothing in the name said so,
 *     and the next person to "fix" the past page would have split it.
 *
 * Each factory accepts refs or plain values, so a component can pass its
 * reactive gym id straight in and the key tracks it.
 *
 * Changing an endpoint means changing it here, once.
 */

// Keys are built as a computed so a ref passed in stays reactive: when the
// gym changes the key changes, and Query refetches on its own.
const key = (...parts) => computed(() => parts.map((p) => unref(p)))

// Some queries are meaningless until something is chosen. Guarding here
// rather than in each component keeps "this needs a gym" next to the call
// that needs it.
const needs = (...vals) => computed(() => vals.every((v) => !!unref(v)))

/**
 * For lists that are effectively static within a session.
 *
 * Note this survives navigation and remounting, not a genuine reload —
 * TanStack's cache lives in memory, so restarting the app starts it empty.
 * Persisting across reloads needs a storage persister, which is a separate
 * decision with its own trade-offs about stale data on first paint.
 */
const A_DAY = 24 * 60 * 60 * 1000

export const queries = {
  /**
   * Every gym, for the picker. Not gym-scoped — but not ungated either.
   *
   * GET /gym is behind auth:api. Firing it before sign-in gets a 401 the
   * interceptor cannot recover (there is no token to refresh), and after
   * three retries the query settles in error with nothing to refetch it —
   * the empty gym list. Gating on the token means TanStack starts it itself
   * the moment sign-in lands, so the order the two happen in stops mattering.
   */
  gyms: () => ({
    queryKey: key('gyms'),
    queryFn: () => api.getGyms(),
    enabled: isAuthenticated,

    // A day. The list of gyms changes when a gym opens or closes, which is
    // not something a climber needs to see within thirty seconds — and the
    // 30s default meant every return to a screen holding the picker re-asked
    // for a list that had not moved.
    staleTime: A_DAY,

    // If you give another query a staleTime like this one's, check what its
    // callers pass. A caller using initialData hands TanStack a value cached
    // AS the answer — so an empty placeholder counts as a fresh, correct
    // result and the query never runs. That is exactly what happened here:
    // the gym picker sat on "Loading gyms..." forever. Callers of this one
    // use placeholderData, which is only what to show while finding out.
    //
    // gcTime must not be shorter than staleTime, or the point is lost: an
    // unused query is evicted after the default five minutes, and the next
    // mount refetches however fresh the data was considered. Keeping the
    // entry for the same day is what actually stops the request.
    gcTime: A_DAY,
  }),

  /** This climber's badges, and every badge the gym defines. */
  badges: (gymid) => ({
    queryKey: key('badges', gymid),
    queryFn: () => api.getBadges(unref(gymid)),
    enabled: needs(gymid),
  }),

  /** Competitions: one payload holding upcoming, ongoing and past. */
  competitions: () => ({
    queryKey: key('competitions'),
    queryFn: () => api.getUpcomingCompetitions(),
    // Behind auth:api, like the gym list — same gate, same reason.
    enabled: isAuthenticated,
  }),

  /** Latest climbs from the people this climber follows. */
  feed: () => ({
    queryKey: key('feed'),
    queryFn: () => api.getFeed(),
    enabled: isAuthenticated,
  }),

  /** The newest routes set in a gym. */
  newProblems: (gymid) => ({
    queryKey: key('new-problems', gymid),
    queryFn: () => api.newProblems(unref(gymid)),
    enabled: needs(gymid),
  }),

  /** Public ascents of one route. */
  publicAscents: (problemId) => ({
    queryKey: key('public-ascents', problemId),
    queryFn: () => api.getPublicAscents(unref(problemId)),
    enabled: needs(problemId),
  }),

  /** A ranking's top ten, per climber and country. */
  rankingTop10: (climberId, rankingId, country) => ({
    queryKey: key('ranking-top10', climberId, rankingId, country),
    queryFn: () =>
      api.rankingtop10({
        climber_id: unref(climberId),
        ranking_id: unref(rankingId),
        country: unref(country),
      }),
    // Both call sites are meaningless without a climber; one guarded for it
    // and the other did not.
    enabled: needs(climberId, rankingId),
  }),

  /** Spray walls in a gym. */
  sprayWalls: (gymid) => ({
    queryKey: key('spray-walls', gymid),
    queryFn: () => api.getSprayWalls(unref(gymid)),
    enabled: needs(gymid),
  }),

  /** Problems on one spray wall, for a given filter/sort. */
  sprayWallProblems: (wallId, query) => ({
    queryKey: key('spray-wall-problems', wallId, query),
    queryFn: () => api.getSprayWallProblems(unref(wallId), unref(query)),
    enabled: needs(wallId),
  }),

  /** The photo a spray wall's holds are marked on. */
  sprayWallImage: (wallId) => ({
    queryKey: key('spray-wall-image', wallId),
    queryFn: () => api.getSprayWallImage(unref(wallId)),
    enabled: needs(wallId),
  }),

  /** One spray wall problem. */
  sprayWallProblem: (problemId) => ({
    queryKey: key('spray-wall-problem', problemId),
    queryFn: () => api.getSprayWallProblem(unref(problemId)),
    enabled: needs(problemId),
  }),

  /**
   * Ada, the virtual coach: hired state, trial status and pricing.
   *
   * Not gym-scoped — coaching is a relationship between two climbers, and
   * Ada does not vary by which gym is currently selected. Behind auth:api,
   * like the gym list, so the same isAuthenticated gate applies: an
   * unauthenticated call gets a 401 the interceptor cannot recover, and
   * would otherwise settle in error with nothing left to refetch it.
   */
  virtualCoach: () => ({
    queryKey: key('virtual-coach'),
    queryFn: () => api.getVirtualCoach(),
    enabled: isAuthenticated,
  }),
}

export { invalidate } from '@js/queryKeyNames'
