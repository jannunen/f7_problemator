# Vuex → Pinia + TanStack Query Migration — Design

## Intent & why

The mobile app's state layer is currently split across two mechanisms doing
overlapping jobs. Vuex (`src/js/store.js`, 770 lines, 43 async actions, plus
two modules) holds both genuine client/session state (dark mode, filters,
search UI, auth step) *and* a hand-rolled cache of server data (competition
results, profile, problems). TanStack Query is already installed and
partially adopted — `src/js/queryClient.js` has a deliberately-tuned
`QueryClient` with precise invalidation (`src/js/invalidation.js` +
`src/js/queryKeyNames.js`), and `src/js/queryKeys.js` already exports the
centralized `queries` factory the team wants more of. 19 files already read
through it via `useQuery`. But **zero** files use `useMutation` — every write
still goes through a Vuex action that calls `api.js` directly and then
manually calls `invalidateAfter('actionName')` to tell the query cache a
write happened. That indirection exists only because this migration hadn't
happened yet.

The team has already agreed to consolidate: Pinia for genuine client/session
state, TanStack Query (reads *and* writes) for everything that is a server
resource, with `queryKeys.js` remaining the single place that maps "what
varies" to "which endpoint."

## Goals

- Every one of the ~60 files currently calling `useStore()` from `'vuex'` is
  converted to either a Pinia store or a TanStack query/mutation.
- `vuex` is removed from `package.json` once nothing imports it; `src/js/store.js`
  and its modules are deleted.
- Every server read goes through `queryKeys.js`'s `queries` factory +
  `useQuery`; every server write goes through a parallel `mutations` factory
  + `useMutation`, with invalidation co-located in the mutation definition.
- Each consumer file is touched exactly once (no file gets a Pinia pass and
  then a separate TanStack pass later).
- The existing Vitest suite (569 tests) stays green throughout; each domain
  lands with test coverage for its new store/query/mutation code, matching
  the existing `test/store.checkpoint.test.js` / `test/api.checkpoint.test.js`
  pattern.
- The stale-cross-competition-response fix just shipped (`getCompResults`/
  `publicGetCompResults` discarding a response for a comp the climber has
  navigated away from) and the `initialData`-vs-`placeholderData` lesson
  (documented in `queryKeys.js`'s `gyms` entry) are both preserved, not
  reintroduced, by whatever replaces these call sites.

## Non-goals

- No change to backend API endpoints or contracts — this is a frontend
  state-layer refactor only.
- No visible change to any screen's behavior or UX.
- The routesetter dashboard's own separate Vuex store is out of scope; this
  covers the mobile PWA (`f7_problemator`) only.

## Anti-goals

- A single unreviewable "big bang" PR.
- A domain left half-migrated indefinitely (some of its state in Vuex, some
  in Pinia/TanStack) — each domain's task lands complete or not at all.
- Reintroducing the `initialData`/`placeholderData` bug class or the
  stale-cross-request bug class while porting these call sites.

## Constraints

- Vue 3 + Composition API throughout already — no Options API, no
  `$store`/`mapState`/`mapActions`/`mapGetters`/`mapMutations` usage exists
  anywhere in the app. Nothing to untangle on that front.
- `@tanstack/vue-query` v5.92.9, `queryClient.js`, `queryKeys.js`,
  `invalidation.js`, `queryKeyNames.js` already exist and are the foundation
  to build on, not replace.
- Pinia is not yet installed; add it to `package.json`.
- `src/js/store.js` (770 lines, 43 actions) + `src/js/store/home.store.js`
  (dead — zero usages found anywhere in the app) + `src/js/store/climber.store.js`
  (small: 2 actions, used by `FollowersData.vue` and `ClimberProfilePage.vue`).
- The app must keep working correctly throughout — migration proceeds
  domain-by-domain; Vuex and Pinia/TanStack coexist until the last domain
  lands, at which point Vuex is deleted outright.

## Approaches considered

1. **Domain-by-domain, one pass per file — CHOSEN.** For each logical slice
   of `store.js` (auth, profile/bootstrap, problems/ticks, competitions,
   rankings, badges, archive, misc UI state, climber-social), convert its
   server reads to `useQuery`, server writes to `useMutation`, and remaining
   client state to a Pinia store, updating that slice's consumer files in
   the same pass. Remove the slice from `store.js` as it lands.
2. **Pinia first, then TanStack** — mechanically port all of Vuex to Pinia
   1:1, then a second project converts data-fetching to TanStack. Rejected:
   touches every one of the ~60 consumer files twice.
3. **Big bang single branch** — rejected: unreviewable diff, worst fit for
   an app currently used during live competitions, no incremental rollback
   point if something breaks.

## Decided design

### Pinia store shape

Composition-API "setup stores" (function style), matching this app's
existing composable conventions (e.g. `useCheckpointLadders.js`) — not
Options-style `defineStore({state, actions})`. One store per domain, under a
new `src/js/stores/` directory (plural — deliberately distinct from the
legacy `src/js/store/`, a singular Vuex directory, so the two can coexist
without path collisions during the migration). Exported as `useXStore()`.
`src/js/store/` and its two modules are deleted once the last domain lands.

### The TanStack-vs-Pinia dividing line

A server interaction becomes a TanStack `useQuery` (read) or `useMutation`
(write) when its purpose is to fetch or change data that some `useQuery`
elsewhere reads — i.e. it is a cacheable, invalidatable server resource.

It stays a Pinia store action when its purpose **is** to directly change
cross-cutting session/app state rather than to invalidate a cache. The auth
flow is the clearest case: `login`/`verifyOtp`/`socialLogin`/`logout` write
`isAuthenticated`/`access_token`/`authStep`, which dozens of unrelated
places read synchronously (route guards, the axios 401 interceptor in
`app.js`). Modeling these as "a mutation with nothing to invalidate" would
be a fiction; they become Pinia store actions that call `api.js` directly,
same as today, just living in `useAuthStore` instead of `store.js`.

`getProfile`'s single bootstrap payload (gym + climber + styles/grades/walls
+ ranking target + problems, all from one API call) becomes **one** TanStack
query (`queries.profile(gymid)`). Each domain reads its own slice via that
query's `select` option, rather than the backend's one combined endpoint
being fictionally split into several queries it doesn't actually offer.

### Mutations factory

New `src/js/mutations.js`, mirroring `queryKeys.js`'s shape:

```js
export const mutations = {
  saveTick: () => ({
    mutationFn: (payload) => api.saveTick(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ... })
    },
  }),
  // ...
}
```

Consumers call `useMutation(mutations.saveTick())`.

The existing `invalidateAfter(name)` / `keysInvalidatedBy` indirection
(`invalidation.js`/`queryKeyNames.js`) stays alive **only** for Vuex actions
not yet converted in the current domain pass. Once a domain's actions become
`useMutation`s, their invalidation moves inline into that mutation's own
`onSuccess`, and their entries are deleted from `keysInvalidatedBy`. The
indirection table and `invalidateAfter` itself are deleted entirely once the
last Vuex action is gone — this was always meant as a bridge, not a
permanent layer.

A write that does meaningful local synchronous work beyond "call the API"
(e.g. `saveTick` today also dispatches `rankings` and commits 2-3 other
mutations) keeps that logic inside the mutation's own `mutationFn`/
`onSuccess`, not scattered across call sites — each call site still gets one
`useMutation(mutations.saveTick())` and nothing else.

### Domain breakdown

A builder-check review of this design surfaced that `saveTick`/`deleteTick`/
`publicSaveTick` (naturally "Problems/ticks") also dispatch into Rankings
(`dispatch('rankings', ...)`) and commit directly into Competitions'
`state.competition` (`addTickToCompetition`/`removeTickFromCompetition`/
`updatePointsPerRoute`), and that `getProfile` seeds `rankingTarget`, which
Rankings also owns. That's real, tight coupling, not an artifact of how the
table below is drawn — resolved as follows:

**Problems/ticks, Rankings, and Competitions are migrated together, as one
combined domain group** (likely its own plan with several internal tasks,
given its size — it's a superset of what the recent comp-type-saving-
consistency work already touched). This avoids any temporary bridge between
old Vuex and new Pinia/TanStack for the app's single most central, most
exercised write path. The other six domains below are small and genuinely
independent of each other and of this group, and may migrate in any order
(smallest/lowest-risk first is sensible: Misc UI/session, Archive, Badges,
Climber-social, then Auth, then Profile/bootstrap — Profile/bootstrap last
among these because it seeds values the combined group reads).

**`rankingTarget` ownership (previously split across two rows below):** the
combined group's Rankings slice owns it as the single source of truth.
Profile/bootstrap's query supplies only the *initial* value (the climber's
home country, from `gym.country`) the first time the Rankings store
initializes; after that, Rankings' own state is authoritative and nothing
re-syncs it from the profile query.

**General cross-domain file policy** (for the 6 independent domains, where
incidental fan-out is cheap rather than central): a file is edited by
whichever domain it primarily belongs to. If it also reads a second,
not-yet-migrated domain's data, it keeps that domain's existing `useStore()`
call alongside its new Pinia/TanStack code until that second domain's own
task lands — at which point a small, bounded follow-up edit (updating that
one remaining call, not a full re-pass of the file) finishes it. This is the
one deliberate, acknowledged exception to "touched exactly once."

For the plan-writing stage to assign into tasks (one or more plans):

| Domain | Current state/actions (store.js unless noted) |
|---|---|
| **Activity (combined): Problems/ticks + Rankings + Competitions** | `problems`, `alltime`, `ticksLoaded`, `competition`, `compResults`, all `my_checkpoint*` state, `rankings`, `rankingTarget`; `updateProblem`; `likeProblem`, `dislikeProblem`, `commentProblem`, `reportProblem`, `getProblemDetails`, `deleteProject`, `saveTick`, `deleteTick`, `deleteTickByProblem`, `loadAllTimeTicks`, `rankings`, `getCompetition`, `getCompResults`, `getPointsPerRoute`, `registerToComp`, `unRegisterToComp`, `removeCompAscent`, `saveCheckpoint`, `deleteCheckpoint`, `addTopJudging`, `addCheckpointJudging`, plus the public-key variants (`getClimberByKey`, `publicGetPointsPerRoute`, `publicGetCompResults`, `publicSaveTick`, `publicDeleteTickByProblem`, `publicGetCompetition`, `publicSaveCheckpoint`, `publicDeleteCheckpoint`) |
| Auth/session | `isAuthenticated`, `access_token`, `authStep`, `debugOtp`, `authEmail`, `authType`, `authError`, `user`, `expires_in`; `requestOtp`, `verifyOtp`, `socialLogin`, `completeSocialLogin`, `logout`, `setUser`, `login`. `socialLogin`/`completeSocialLogin` are dead-but-wired (the backend's Supabase exchange route was removed 2026-08-30 — see memory `supabase-social-auth-parked`) — port faithfully, no behavior change, not this migration's place to resume or delete the feature. |
| Profile/bootstrap | `profile`, `profileLoaded`, `gymid`, `gym`, `styles`, `grades`, `walls`; `getProfile`, `changeGym`, `saveSettings`, `saveGymSettings` |
| Badges | `badges`; `loadBadges` (already shaped almost exactly like a gym-scoped TanStack query with a manual staleness check) |
| Archive | `archive`; `fetchArchiveDate`, `getTickDates` |
| Climber-social | `src/js/store/climber.store.js`'s `profile`/`climberprofile`; `profile`, `followUnFollow` actions — used by `FollowersData.vue`, `ClimberProfilePage.vue` |
| Misc UI/session | `settings.darkMode`, `searchQuery`, `searchState`, `searchResults`, `sidePanelOpen`, `selectedLeftPanelItem`, `backlog`, `wishlist` (localStorage-backed), `tipShowStatus`, `initializing`, `ready`, `routetypes`, `filters`/`filtersInitial`/`resetFilters`, `version`/`server_version` |

### Delete outright, no port needed

`src/js/store/home.store.js` — empty stub, zero usages anywhere in the app.

### Test coverage

Each domain's task adds or updates Vitest coverage for its new Pinia
store and/or query/mutation definitions, following the existing
`test/store.checkpoint.test.js` and `test/api.checkpoint.test.js` pattern.

## Review focus

1. **Object-identity/watch assumptions.** Vuex mutates state in place in
   several spots (e.g. `state.competition.my_checkpoints = mine` replaces a
   sub-object but the parent `competition` object keeps its identity).
   Confirm no `watch(() => store.state.competition)` (non-deep) relies on
   that same-reference behavior in a way a TanStack-cached object wouldn't
   preserve.
2. **The stale-cross-competition-response guard.** The just-shipped manual
   check (`ret?.comp?.id == state.competition.id`) in `getCompResults`/
   `publicGetCompResults` exists only because `compResults` was a single
   un-scoped key. Once `compid` is part of the TanStack query key itself,
   this race likely can't happen at all (a stale response can only ever
   resolve into its own key's cache entry) — confirm this during the
   Competitions domain's task rather than just porting the manual check
   verbatim into a `useQuery`.
3. **`commitSavedCheckpoint`'s branching** (sport score vs. zone tries vs.
   removal-on-empty) must survive intact in whichever form the Competitions
   domain's `saveCheckpoint`/`publicSaveCheckpoint` mutations take.
4. **LocalStorage-backed state** (`backlog`, `wishlist`, `tipShowStatus`,
   `gymid`) needs equivalent persistence in Pinia (a plugin, or an explicit
   `watch` + `localStorage.setItem`) — don't silently drop persistence when
   porting the Misc UI/session domain.
5. **Calling a store from outside a component.** `app.js` currently calls
   `store.dispatch('logout')` and `store.commit('setToken', ...)` directly
   on the Vuex store instance (module scope, not inside a component's
   `setup()`), for the axios 401 interceptor and the token-refresh handler.
   Pinia stores normally must be used via `useXStore()` inside an active
   Pinia context; the Auth domain's task must find and use the correct
   pattern for calling a Pinia store from plain module-scope code (e.g.
   importing the `pinia` instance directly rather than relying on
   component-context injection).

## What's left to the builder

- Exact task boundaries and count per plan (and whether this becomes one
  plan or several — the domains above are reasonably independent of each
  other, which argues for splitting, but this is a plan-writing decision,
  not a design decision).
- Exact Pinia store file names per domain.
- Whether Badges/Archive/Climber-social are each their own task or folded
  into a neighboring domain's task.
- The exact shape of each new `queryKeys.js` entry and `mutations.js` entry
  per domain (signatures, key structure) — determined per-task against this
  design's dividing line and existing `queryKeys.js` conventions.
