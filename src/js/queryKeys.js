import { computed, unref, toValue } from 'vue'
import api from '@js/api'
import { isAuthenticated } from './authToken.js'
import { useClimberStore } from './stores/climber.store.js'
import { useRankingsStore } from './stores/rankings.store.js'
import { pinia } from './stores/index.js'
import { asCompId } from './queryKeyNames.js'

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
//
// toValue, not unref: every existing caller passes a ref, a computed, or a
// plain value, for which the two behave identically — but toValue also
// resolves a plain getter function (`() => props.x`), which unref leaves
// untouched (it only ever unwraps a Ref). Using toValue here means a
// factory added later that gets called with that getter pattern (as this
// task's own competition/compResults factories below were) builds a
// correct key without needing to know the difference.
const key = (...parts) => computed(() => parts.map((p) => toValue(p)))

// Some queries are meaningless until something is chosen. Guarding here
// rather than in each component keeps "this needs a gym" next to the call
// that needs it.
const needs = (...vals) => computed(() => vals.every((v) => !!toValue(v)))

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
  rankingTop10: (climberId, rankingId, country, gym = null) => ({
    // The gym id is part of the key: a climber's ten at one gym must never
    // be served for another gym (or for the country list).
    queryKey: key('ranking-top10', climberId, rankingId, country, gym),
    queryFn: () =>
      api.rankingtop10({
        climber_id: unref(climberId),
        ranking_id: unref(rankingId),
        country: unref(country),
        gym: unref(gym),
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

  /**
   * One competition's full detail payload: problems, registrations, user
   * ticks, and this climber's checkpoint state (`my_checkpoints`,
   * `my_checkpoint_tries`, `my_checkpoint_scores`) — all nested in the same
   * object the backend already returns in one call. There is nothing left
   * for `my_checkpoint*` to live in on its own: it arrives here and is
   * patched here (see mutations.saveCheckpoint/deleteCheckpoint).
   *
   * Also gated on isAuthenticated, unlike badges/newProblems/sprayWalls
   * above (which only need a gym): JudgingComponent.vue can mount on a deep
   * link before the JWT is restored into axios's headers, and the old
   * action only re-dispatched on an isAuthenticated CHANGE — which never
   * fires for a climber who was already signed in when the page mounted, so
   * `comp` stayed null forever there. The other two call sites
   * (SingleCompetitionPage.vue, SimpleEntryPage.vue) are only reachable once
   * already signed in, so this changes nothing for them.
   *
   * Built with asCompId (queryKeyNames.js), not key()/unref: `compid` here
   * is a Framework7 route param read off a component prop, always a
   * string, while mutations.js patches this same cache entry keyed
   * by an already-fetched competition's numeric `.id`. asCompId normalizes
   * both to the same Number so they address the same entry — see its own
   * doc comment for the full story (a real bug this task shipped and a
   * review caught).
   */
  competition: (compid) => ({
    queryKey: computed(() => ['competition', asCompId(compid)]),
    queryFn: () => api.getCompetition({ compid: asCompId(compid) }),
    enabled: computed(() => !!asCompId(compid) && isAuthenticated.value),
  }),

  /**
   * Same payload, fetched through the public comp-key route (the standalone
   * point-entry flow opened from an emailed link, no sign-in). A key of its
   * own rather than a shared one with `competition` above: the signed-in and
   * anonymous views of the same competition id are two different fetches
   * (different auth, different query params) that must not overwrite each
   * other's cache entry.
   *
   * Not gated on isAuthenticated — the whole point of this route is that it
   * works without one.
   */
  publicCompetition: (compid, pointEntryKey) => ({
    queryKey: computed(() => ['public-competition', asCompId(compid)]),
    queryFn: () => api.getCompetition({ compid: asCompId(compid), point_entry_key: toValue(pointEntryKey) }, '/compkey'),
    enabled: computed(() => !!asCompId(compid)),
  }),

  /** One competition's results table. */
  compResults: (compid) => ({
    queryKey: computed(() => ['comp-results', asCompId(compid)]),
    queryFn: () => api.getCompResults({ compid: asCompId(compid) }),
    enabled: computed(() => !!asCompId(compid) && isAuthenticated.value),
  }),

  /** Same, through the public comp-key route — see publicCompetition above. */
  publicCompResults: (compid, pointEntryKey) => ({
    queryKey: computed(() => ['public-comp-results', asCompId(compid)]),
    queryFn: () => api.getCompResults({ compid: asCompId(compid), point_entry_key: toValue(pointEntryKey) }, '/compkey'),
    enabled: computed(() => !!asCompId(compid)),
  }),

  /**
   * Every tick and try this climber has ever logged, across every gym —
   * `loadAllTimeTicks`, moved here from store.js's `actions` block (Task 5 of
   * the Activity-group migration plan). It never wrote anything of its own;
   * it only fetched and committed, which makes it a read, not a write,
   * despite having lived among the write actions until now.
   *
   * Behind auth:api, like gyms/competitions/feed/virtualCoach — same gate,
   * same reason (a call before sign-in gets an unrecoverable 401).
   *
   * Fetched once per sign-in, like the old action it replaces (which only
   * ever dispatched once, guarded on both arrays still being empty).
   * mutations.js's saveTick/deleteTick/deleteTickByProblem (and their
   * public-key siblings) patch this cache directly via setQueryData rather
   * than invalidating it — the same "patches, not refetches" precedent
   * queries.profile above already set, for the same reason: nothing here
   * needs a round trip to the server to know what a write it just made did.
   */
  allTimeTicks: () => ({
    queryKey: key('alltime-ticks'),
    queryFn: () => api.loadAllTimeTicks(),
    enabled: isAuthenticated,
    staleTime: Infinity,
  }),

  /** Every date this climber has a tick on record, for the calendar highlight. */
  archiveDates: () => ({
    queryKey: key('archive-dates'),
    queryFn: () => api.getTickDates(),
  }),

  /** One calendar span's ticks and tries, fetched separately and merged. */
  archiveDay: (span) => ({
    queryKey: key('archive-day', span),
    queryFn: () =>
      Promise.all([
        api.getArchiveDay({ span: unref(span), type: 'ticks' }),
        api.getArchiveDay({ span: unref(span), type: 'tries' }),
      ]).then(([ticks, tries]) => ({ ticks, tries })),
    enabled: needs(span),
  }),

  /** A climber's public profile: stats, follow state, latest ascents. */
  climberProfile: (id) => ({
    queryKey: key('climber-profile', id),
    queryFn: () => api.climber.profile(unref(id)),
    enabled: needs(id),
  }),

  /**
   * This climber's bootstrap payload: their own settings, the selected
   * gym (which carries styles/grades/walls... — see each call site's
   * `select`), and country for the ranking they see by default.
   *
   * Gated on isAuthenticated rather than needing a gym the way badges/
   * newProblems/sprayWalls are: GET /profile already answers for a climber
   * with no gym chosen yet (it is the local gym id, not the API call, that
   * decides whether Home.vue's "no gym selected" prompt shows). Gating this
   * on a gym the way the others are would starve that prompt, and the
   * climber bridge below, of the one call that feeds them both.
   *
   * `gym.problems` (this task's own domain — see useProfileSlice.js's
   * `useProfileProblems` and mutations.js's `likeProblem`/`dislikeProblem`/
   * `commentProblem`/`reportProblem`/`getProblemDetails`/`deleteProject`) is
   * left here exactly as the backend returns it: an ARRAY, untouched. The
   * old `store.commit('problems', ...)` bridge that used to reshape it into
   * an id-keyed object right here is gone — that reshape now happens in
   * `useProfileProblems`'s `select`, which runs fresh on every render, so a
   * mutation's patch to this array needs no separate id-keyed copy kept in
   * sync.
   *
   * climber is written into that Pinia store directly here (and from
   * mutations.saveSettings's onSuccess) rather than through Vuex, same
   * "whichever source ran most recently wins" overload the old
   * `commit('climber', ...)` mutation had, just living inside the queryFn
   * rather than an onSuccess callback: TanStack Query v5 dropped useQuery's
   * onSuccess, so the queryFn's own body — the one place guaranteed to run
   * exactly once per fetch, before the result is handed back — is what the
   * old getProfile action's success path becomes now.
   *
   * `rankingTarget` goes through `seedFromProfile`, not a direct set: per
   * the rankings store's seed-once rule, only the FIRST successful profile
   * fetch (or an explicit `setRankingTarget` call) gets to choose it. Later
   * refetches of this same query — a gym switch, saveSettings's
   * invalidation — must not silently override a climber's already-seeded
   * or explicitly-chosen ranking scope.
   */
  profile: (gymid) => ({
    queryKey: key('profile', gymid),
    queryFn: async () => {
      const ret = await api.getProfile(unref(gymid))
      if (ret != null && ret.profile != null) {
        if (ret.gym != null) {
          useRankingsStore(pinia).seedFromProfile(ret.gym?.country)
        }
        useClimberStore(pinia).setFromProfile(ret.climber)
      }
      return ret
    },
    enabled: isAuthenticated,

    // Fetched once per sign-in and per gym, like the getProfile action it
    // replaces — not every 30s. ~30 components observe this query, so under
    // the global default any navigation past 30s re-downloaded the whole
    // bootstrap and could overwrite a tick patched into the cached
    // gym.problems locally mid-session. A gym change is a new key and
    // fetches on its own; saveSettings invalidates ['profile'] explicitly. app.vue keeps an observer mounted all session, so gcTime
    // never evicts it.
    staleTime: Infinity,
  }),
}

export { invalidate } from '@js/queryKeyNames'
