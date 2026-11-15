# Vuex → Pinia + TanStack Query Migration — Foundational Domains Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Pinia and migrate the six domains of `src/js/store.js` that are independent of the "Activity" group (Problems/ticks + Rankings + Competitions, which is NOT in scope here — it gets its own plan later) to either a Pinia store or TanStack Query, per the approved design.

**Architecture:** Each task ports one domain's state/actions, updates that domain's consumer files in the same pass, and removes the ported code from `store.js`. Server reads/writes become `queryKeys.js`/`mutations.js` entries consumed via `useQuery`/`useMutation`; genuine client/session state becomes a Pinia "setup store" under `src/js/stores/`. `store.js` keeps shrinking across this plan's tasks but is NOT deleted at the end of it — the Activity group's own (future) plan removes it once that group lands too.

**Tech Stack:** Vue 3 Composition API, Pinia (new dependency), `@tanstack/vue-query` v5.92.9 (already installed), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-vuex-to-pinia-tanstack-migration-design.md`

## Global Constraints

- Composition-API Pinia "setup stores" only (function style, matching `useCheckpointLadders.js`'s existing composable convention) — never Options-style `defineStore({state, actions})`. One store per domain, under `src/js/stores/` (new, plural — distinct from the legacy singular `src/js/store/`).
- A server interaction is a TanStack `useQuery`/`useMutation` when its purpose is to read/change a cacheable, invalidatable server resource. It is a Pinia store action instead only when its purpose is to directly change cross-cutting session/app state that many unrelated places read synchronously (the clearest case: Auth).
- New `src/js/mutations.js` mirrors `queryKeys.js`'s shape: `export const mutations = { name: () => ({ mutationFn, onSuccess }) }`, consumed as `useMutation(mutations.name())`.
- The existing `invalidateAfter(name)` / `keysInvalidatedBy` indirection (`invalidation.js`/`queryKeyNames.js`) is a bridge for Vuex actions not yet converted. A domain converted in this plan that has a current `invalidateAfter('x')` call removes that call and that entry from `INVALIDATES`, moving the invalidation inline into the new mutation's own `onSuccess`. (None of this plan's six domains currently call `invalidateAfter` — only `changeGym` has an `INVALIDATES` entry, and it is `[]`, i.e. "deliberately invalidates nothing." Preserve that: `mutations.changeGym()`'s `onSuccess` invalidates nothing either, and the `changeGym: () => []` entry in `invalidation.js` is deleted once `changeGym` is a mutation.)
- "Touched exactly once" per consumer file, with one acknowledged exception: if a file reads a second, not-yet-migrated domain's data, it keeps that domain's existing `useStore()` call untouched alongside its new code, to be swapped in a small bounded follow-up when that other domain's own task/plan lands.
- No visible behavior change on any screen. Dead code found during research (confirmed zero consumers by grep) is dropped rather than ported, but ONLY when it belongs to a domain in this plan's scope — dead code belonging to the out-of-scope Activity group is left untouched.
- `npm test` (Vitest) must stay green after every task; `npm run build` and `npx eslint <changed files>` must be clean.

### Confirmed by research — must be designed around, not rediscovered

- **`store.js`'s `searchQuery`, `searchState`, `searchResults`, `backlog`, `wishlist` state are dead** — zero consumers anywhere in the app. (`src/components/GymSelector.vue`'s `searchQuery` is an unrelated component-local `ref('')`, not the store's. `src/js/game-actions.js` references `backlog`/`wishlist` but dispatches actions — `getGameInLists`, `removeGameFromList`, `addGameToList` — that don't exist in `store.js` at all, and that file itself is never imported anywhere; it's leftover boilerplate from an unrelated template, out of scope to delete in this plan since it isn't a Vuex consumer, but do not treat its presence as evidence `backlog`/`wishlist` are live.) Drop these five fields when porting Misc UI/session (Task 2); do not create Pinia state for them.
- **`login` and `setUser` actions (Auth) and `saveGymSettings` action (Profile/bootstrap) are dead** — zero dispatch sites anywhere (climbers sign in via OTP only; see CLAUDE.md). Drop them in Tasks 6 and 7 respectively rather than porting.
- **`state.climber`, the `climber` mutation, and the `getClimber`/`getClimberByKey` actions are OUT OF SCOPE for this entire plan**, even though `getProfile` (Profile/bootstrap, Task 7) and `logout` (Auth, Task 6) both currently write `state.climber` too. `getClimberByKey` is a public/unauthenticated point-entry-key flow that conceptually belongs with the Activity group (it's used from `PublicSingleCompetitionPage.vue` alongside other compkey actions already assigned to Activity), and reconciling "signed-in climber's own profile" vs. "public point-entry climber identity" sharing one state slot needs to happen in one place, not split across two plans. Concretely:
  - Task 6 (Auth): `logout`'s `commit('climber', null)` line stays exactly as-is (still calling into the live `store.js`), even though the rest of `logout` moves to Pinia.
  - Task 7 (Profile/bootstrap): `getProfile`'s equivalent (the new `queries.profile` query's success path) must still do `store.commit('climber', data.climber)` against the still-live Vuex store instance (import `store` from `./store.js` directly) so the 17 existing consumer files reading `state.climber` keep working unchanged. This is a deliberate, temporary bridge in the opposite direction from the usual one (new code writing into old Vuex, not old Vuex calling new code) — it is removed when the Activity plan takes ownership of `climber` properly.
  - None of the 17 files currently reading `state.climber` (e.g. `ClimberProfilePage.vue`, `CompetitionEntry.vue`, `SettingsPage.vue`, etc.) are touched by this plan for that read. `ClimberProfilePage.vue` and `FollowersData.vue` DO get touched by Task 5 (Climber-social), but only for their `climbers/profile` and `climbers/followUnFollow` dispatches — their separate `store.state.climber` reads are left alone.
  - `getClimber` itself has zero dispatch sites anywhere (dead) but is left in `store.js` untouched — it's not this plan's domain to prune.

## Review Focus

1. **LocalStorage persistence surviving the port.** `tipShowStatus` and (if still real after Task 7 folds `gymid` in) `gymid` are read from/written to `localStorage` today (`tipShowStatus` via `localStorage.setItem` in the Vuex action; `gymid` via `localStorage.setItem('gymid', gymid)` in `changeGym` and read back in `getProfile`). The Pinia port must keep both persisted exactly as before — a climber relaunching the app must still land on their last-selected gym and not see dismissed tips again.
2. **Calling a Pinia store from outside any component.** `src/js/app.js`'s axios 401 interceptor (`setLogoutHandler`) and token-refresh handler (`setTokenRefreshHandler`) call `store.dispatch('logout')` / `store.commit('setToken', ...)` directly on the module-scope Vuex instance — there is no active component `setup()` there. Task 1 and Task 6 together must produce a working equivalent (e.g. exporting the `pinia` instance from `src/js/stores/index.js` and calling `useAuthStore(pinia)` explicitly, passing the instance, rather than relying on `useAuthStore()`'s implicit active-instance injection, which does not exist at module scope). Verify this specific path with a test or a manual check, not just "it compiles."
3. **`profileLoaded` must not become a half-removed field.** It looks fully redundant with `queries.profile(gymid)`'s own `isSuccess`/`isFetched` status. Task 7 must either (a) eliminate it entirely and update `Home.vue` (its only consumer) to read the query's own status, or (b) explicitly justify keeping it and port it faithfully — not leave some reads converted and others still hitting the deleted Vuex field.
4. **The `home.store.js` / `climber.store.js` deletions (Task 5) must be grep-verified immediately before deletion, not just trusted from this plan's research.** Confirm zero remaining references to `./store/home.store.js` and `./store/climber.store.js` (including the `import home from`/`import climbers from` lines and the `modules: { home, climbers }` block in `store.js` itself) before removing the files.
5. **The `state.climber` boundary (see Global Constraints above) is the easiest thing in this plan to get subtly wrong.** A task 7 implementer who (reasonably) tries to "finish the job" by also porting `climber` and deleting it from `store.js` will silently break `getClimberByKey`'s public point-entry flow (Activity group, not yet migrated, no test coverage in THIS plan to catch it). The task-level review for Task 7 must specifically check that `state.climber`/`commit('climber', ...)` still exist in `store.js` unchanged after the task, and that the bridge-commit described above is present in the new query's success path.

---

### Task 1: Pinia scaffolding

**Files:**
- Modify: `package.json` (add `pinia` dependency)
- Create: `src/js/stores/index.js`
- Modify: `src/js/app.js:16,54-62` (add `app.use(pinia)`)
- Test: `test/stores/index.test.js`

**Interfaces:**
- Produces: `pinia` (the Pinia instance, a named export of `src/js/stores/index.js`) — every later task's Pinia store and `app.js`'s module-scope code import this, never `createPinia()` again elsewhere.

- [ ] **Step 1: Add the dependency**

Run: `npm install pinia`
Expect: `pinia` appears under `dependencies` in `package.json`, lockfile updated. Use whatever current 2.x version `npm install` resolves (Vue 3.2+-compatible) — do not hand-pin an old version.

- [ ] **Step 2: Write the failing test**

```js
// test/stores/index.test.js
import { describe, it, expect } from 'vitest'
import { pinia } from '../../src/js/stores/index.js'

describe('pinia instance', () => {
  it('exports a usable Pinia instance', () => {
    expect(pinia).toBeTruthy()
    expect(typeof pinia.use).toBe('function')
  })
})
```

- [ ] **Step 2b: Run test to verify it fails**

Run: `npx vitest run test/stores/index.test.js`
Expected: FAIL — `src/js/stores/index.js` does not exist.

- [ ] **Step 3: Create `src/js/stores/index.js`**

```js
import { createPinia } from 'pinia'

export const pinia = createPinia()
```

- [ ] **Step 4: Wire it into `app.js`**

Add `import { pinia } from './stores/index.js'` near the existing `import store from "./store.js"` (app.js:16), and `app.use(pinia)` immediately after `app.use(store)` (app.js:58). Do not remove `app.use(store)` — Vuex stays live until every domain, including the future Activity plan, has migrated.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run test/stores/index.test.js`
Expected: PASS

- [ ] **Step 6: Full-suite and build check**

Run: `npm test && npm run build`
Expected: all existing tests still pass; build succeeds with the new dependency.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/js/stores/index.js src/js/app.js test/stores/index.test.js
git commit -m "feat: add Pinia alongside Vuex"
```

---

### Task 2: Misc UI/session domain → Pinia

**Files:**
- Create: `src/js/stores/ui.store.js`
- Test: `test/stores/ui.store.test.js`
- Modify (remove the ported state/mutations/actions from): `src/js/store.js` (state keys `settings`, `searchQuery`, `searchState`, `searchResults`, `sidePanelOpen`, `selectedLeftPanelItem`, `backlog`, `wishlist`, `tipShowStatus`, `initializing`, `ready`, `routetypes`, `filters`, `version`, `server_version`, the exported `filtersInitial`; mutations `setSelectedLeftPanelItem`, `setTipShowStatus`, `setSidePanel`, `setDarkMode`, `setFilterRoutetype`, `setFilterProblems`, `setFilterStyles`, `setFilterGradeMin`, `setFilterGradeMax`, `setNameFilter`, `setFilterWalls`, `setFilterSort`, `resetFilters`, `setInitializing`, `setReady`, `setVersion`, `serverVersion`; actions `tipShowStatus`, `version`)
- Modify consumers (each file's specific lines only — see per-field list below): `src/app.vue`, `src/components/home/LeftSidepanel.vue`, `src/components/home/ShowTickHelp.vue`, `src/pages/ProblemList.vue`, `src/pages/Home.vue`, `src/components/home/RouteFilterButtons.vue`, `src/pages/SprayWallPage.vue`, `src/components/home/PersonalTickStatus.vue`, `src/pages/ClimberProfilePage.vue`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `useUiStore()` from `src/js/stores/ui.store.js`, a setup store exposing refs `darkMode`, `sidePanelOpen`, `selectedLeftPanelItem`, `tipShowStatus`, `initializing`, `ready`, `routetypes` (constant `['boulder','sport']`), `filters`, `version`, `serverVersion`; actions `setDarkMode(v)`, `setSidePanel(v)`, `setSelectedLeftPanelItem(v)`, `setTipShowStatus(v)` (also writes `localStorage.tipShowStatus`), `setInitializing(v)`, `setReady(v)`, `setFilterRoutetype(v)`, `setFilterProblems(v)`, `setFilterStyles(v)`, `setFilterGradeMin(v)`, `setFilterGradeMax(v)`, `setNameFilter(v)`, `setFilterWalls(v)`, `setFilterSort(v)`, `resetFilters()`, `setVersion(v)`, `setServerVersion(v)`, `fetchVersion()` (the former `version` dispatch — calls `api.version()` directly, same as today; this stays a plain store action per the TanStack-vs-Pinia line, since it's a one-off app-version check with nothing to invalidate).
- Keep `filtersInitial` exported from `ui.store.js` (moved from `store.js`) since `resetFilters` needs it; nothing outside this store imports `filtersInitial` today (confirmed by grep), so no other file needs updating for the move.

**Per-field consumer map (exact, from grep — do not re-derive):**
- `darkMode`: `src/components/home/LeftSidepanel.vue` (reads `store.state.settings.darkMode`, calls `store.commit('setDarkMode', v)`)
- `sidePanelOpen` / `setSidePanel`: `src/app.vue` (commits), `src/components/home/LeftSidepanel.vue` (reads + commits), `src/pages/ClimberProfilePage.vue` (commits)
- `selectedLeftPanelItem` / `setSelectedLeftPanelItem`: `src/components/home/LeftSidepanel.vue`, `src/pages/ClimberProfilePage.vue`
- `tipShowStatus`: `src/app.vue` (dispatches `tipShowStatus`), `src/components/home/ShowTickHelp.vue`, `src/pages/ProblemList.vue` (dispatches)
- `initializing` / `setInitializing`: `src/app.vue` only
- `ready`: `src/pages/Home.vue` reads `state.ready`; `src/app.vue` commits `setReady`
- `routetypes`: `src/pages/ProblemList.vue` reads `state.routetypes`
- `filters` / filter mutations: `src/pages/ProblemList.vue` (all filter mutations), `src/components/home/RouteFilterButtons.vue` (`state.filters`, `setFilterProblems`), `src/components/home/PersonalTickStatus.vue` (`setFilterProblems`), `src/pages/SprayWallPage.vue` (`resetFilters`)
- `version`/`setVersion`: `src/app.vue` (commits, dispatches `version`), `src/components/home/LeftSidepanel.vue` (reads `state.version`, dispatches `version`)
- `serverVersion`/`server_version`: `src/components/home/LeftSidepanel.vue`, `src/pages/Home.vue` (both read only — the write side also comes from `getProfile`, Task 7; `fetchVersion()`'s own write and Task 7's bootstrap write both target this same store field, which is intentional, not a bug — note it for Task 7, don't resolve it here)

- [ ] **Step 1: Write the failing tests** for `ui.store.js` covering: initial `darkMode`/`filters` values, `setFilterSort` updating `filters.sort` only, `resetFilters` restoring `filtersInitial`, `setTipShowStatus` writing through to `localStorage.tipShowStatus` (mock `localStorage` as the existing `vi.hoisted(() => { globalThis.localStorage = {} })` pattern from `test/store.checkpoint.test.js` does), `fetchVersion()` calling a mocked `api.version()` and setting `serverVersion`.

- [ ] **Step 2: Run to verify failure.** `npx vitest run test/stores/ui.store.test.js` — FAIL (module doesn't exist).

- [ ] **Step 3: Implement `src/js/stores/ui.store.js`** as a Pinia setup store (`defineStore('ui', () => {...})`), using `ref`s for each field and the signatures above. Port `getFromLocalStorage` usage only for whatever of `tipShowStatus` genuinely reads from storage on init today (check `store.js`'s current initializers before assuming — `backlog`/`wishlist` used `getFromLocalStorage` too but are dead, don't port that helper's calls for them).

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update each consumer file** per the per-field map above: replace `useStore()` + `store.state.X`/`store.commit('Y', ...)`/`store.dispatch('tipShowStatus'|'version', ...)` with `useUiStore()` + the new refs/actions. A file in this list that ALSO reads a field from a different, not-yet-migrated domain (e.g. `app.vue` reads `state.alltime`/`state.profile`/`state.isAuthenticated` too) keeps its `useStore()` import for those other reads — only the Misc-UI-owned lines change.

- [ ] **Step 6: Remove the ported state/mutations/actions from `store.js`**, including the five dead fields (`searchQuery`, `searchState`, `searchResults`, `backlog`, `wishlist`) — grep for each one more time immediately before deleting to confirm still-zero consumers (a file could have changed between this plan's research and execution).

- [ ] **Step 7: Full suite, lint, build.**

Run: `npm test && npx eslint src/js/stores/ui.store.js src/app.vue src/components/home/LeftSidepanel.vue src/components/home/ShowTickHelp.vue src/pages/ProblemList.vue src/pages/Home.vue src/components/home/RouteFilterButtons.vue src/pages/SprayWallPage.vue src/components/home/PersonalTickStatus.vue src/pages/ClimberProfilePage.vue src/js/store.js && npm run build`

- [ ] **Step 8: Commit**

```bash
git add src/js/stores/ui.store.js test/stores/ui.store.test.js src/js/store.js src/app.vue src/components/home/LeftSidepanel.vue src/components/home/ShowTickHelp.vue src/pages/ProblemList.vue src/pages/Home.vue src/components/home/RouteFilterButtons.vue src/pages/SprayWallPage.vue src/components/home/PersonalTickStatus.vue src/pages/ClimberProfilePage.vue
git commit -m "feat: migrate misc UI/session state from Vuex to Pinia"
```

---

### Task 3: Archive domain → TanStack Query

**Files:**
- Modify: `src/js/queryKeys.js` (add `archiveDates`, `archiveDay` entries), `src/js/queryKeyNames.js` (no new invalidation targets needed — see below)
- Modify: `src/pages/ArchivePage.vue` (sole consumer — lines 201, 268-270, 318, 360 per grep)
- Modify (remove): `src/js/store.js` (state `archive`; actions `fetchArchiveDate`, `getTickDates`)
- Test: `test/queryKeys.archive.test.js`

**Interfaces:**
- Produces: `queries.archiveDates()` → `{ queryKey: ['archive-dates'], queryFn: () => api.getTickDates() }` (no `payload` — the current Vuex dispatch passes none and `api.getTickDates(payload)`'s second `axios.get` argument is always `undefined` today; preserve that, do not invent parameters). `queries.archiveDay(span)` → `{ queryKey: ['archive-day', span], queryFn: () => Promise.all([api.getArchiveDay({span, type:'ticks'}), api.getArchiveDay({span, type:'tries'})]).then(([ticks,tries]) => ({ticks,tries})), enabled: needs(span) }`.
- `ArchivePage.vue` replaces `store.state.archive.dates` with `useQuery(queries.archiveDates())`'s `data`, and its three `fetchArchiveDate` dispatches with reading `useQuery(queries.archiveDay(selectedSpan))` (switching `selectedSpan` naturally refetches via the key — TanStack subsumes the manual re-dispatch-on-click pattern).

- [ ] **Step 1: Write the failing test** in `test/queryKeys.archive.test.js` asserting `queries.archiveDates().queryFn` calls the mocked `api.getTickDates` with no arguments, and `queries.archiveDay('2026-01').queryFn` calls `api.getArchiveDay` twice with `{span:'2026-01', type:'ticks'}` and `{span:'2026-01', type:'tries'}` and merges the results into `{ticks, tries}`.

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Add the two entries to `queryKeys.js`**, following the existing `key()`/`needs()` helper conventions already in that file.

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update `ArchivePage.vue`**: replace the Vuex reads/dispatches at the lines above with the two `useQuery` calls; remove its `useStore()` import only if nothing else in that file still needs it (check — grep the file for other `store.` usage before removing the import).

- [ ] **Step 6: Remove `archive` state and `fetchArchiveDate`/`getTickDates` actions from `store.js`.**

- [ ] **Step 7: Full suite, lint, build.**

- [ ] **Step 8: Commit**

```bash
git add src/js/queryKeys.js test/queryKeys.archive.test.js src/pages/ArchivePage.vue src/js/store.js
git commit -m "feat: migrate archive data from Vuex to TanStack Query"
```

---

### Task 4: Badges domain → TanStack Query

**Files:**
- Modify: `src/js/queryKeys.js` (add `gymBadges` entry — note `badges` as a name is already taken by the existing, unrelated `virtualCoach`-adjacent... actually check: `queryKeys.js` has no existing `badges` key despite `invalidate.badges()` existing in `queryKeyNames.js`; name the new entry `queries.badges(gymid)`, matching `invalidate.badges()`'s existing prefix `['badges']` so future invalidation after a climb (already wired in `INVALIDATES.saveTick`/`deleteTick`, Activity's domain) continues to match once this query exists)
- Modify consumers: `src/components/badges/BadgeSection.vue`, `src/pages/BadgesPage.vue`
- Modify (remove): `src/js/store.js` (state `badges`; mutation `setBadges`; action `loadBadges`)
- Test: `test/queryKeys.badges.test.js`

**Interfaces:**
- Produces: `queries.badges(gymid) => ({ queryKey: key('badges', gymid), queryFn: () => api.getBadges(unref(gymid)), enabled: needs(gymid) })` — this REPLACES `loadBadges`'s manual `state.badges.gymid === gym && !state.badges.loading` staleness guard outright; TanStack's own per-key caching and default `staleTime`/`enabled` make that check redundant (confirm this call explicitly in the task's self-review, don't just port the manual check into the query).
- `BadgeSection.vue`/`BadgesPage.vue` replace `watch(gymid, (id) => id && store.dispatch('loadBadges', id), { immediate: true })` + `computed(() => store.state.badges)` with `useQuery(queries.badges(gymid))`'s `data`/`isLoading`. The response shape today is `{earned, definitions}` (the Vuex mutation reshapes it with a `gymid`/`loading` wrapper that no longer has a reason to exist once TanStack owns loading/error state) — components read `data.value?.earned ?? []` / `data.value?.definitions ?? []` directly.

- [ ] **Step 1: Write the failing test** asserting `queries.badges(42).queryFn` calls the mocked `api.getBadges(42)`, and `queries.badges(null).enabled` evaluates falsy (matching `needs()`'s existing convention for other gym-scoped queries like `newProblems`).

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Add the entry to `queryKeys.js`.**

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update `BadgeSection.vue` and `BadgesPage.vue`** per the interface above.

- [ ] **Step 6: Remove `badges` state, `setBadges` mutation, `loadBadges` action from `store.js`.**

- [ ] **Step 7: Full suite, lint, build.**

- [ ] **Step 8: Commit**

```bash
git add src/js/queryKeys.js test/queryKeys.badges.test.js src/components/badges/BadgeSection.vue src/pages/BadgesPage.vue src/js/store.js
git commit -m "feat: migrate badges from Vuex to TanStack Query"
```

---

### Task 5: Climber-social domain → TanStack Query; delete dead Vuex modules

**Files:**
- Modify: `src/js/queryKeys.js` (add `climberProfile` entry), `src/js/mutations.js` (create — this is the FIRST mutation, establishing the file; add `followUnFollow` entry)
- Modify consumers: `src/pages/ClimberProfilePage.vue` (lines ~163-179), `src/components/profile/FollowersData.vue` (lines ~37-39)
- Delete: `src/js/store/home.store.js`, `src/js/store/climber.store.js`
- Modify: `src/js/store.js` (remove `import home from "./store/home.store.js"`, `import climbers from './store/climber.store.js'`, and the `modules: { home, climbers }` block)
- Test: `test/queryKeys.climberProfile.test.js`, `test/mutations.followUnFollow.test.js`

**Interfaces:**
- Produces: `queries.climberProfile(id) => ({ queryKey: key('climber-profile', id), queryFn: () => api.climber.profile(unref(id)), enabled: needs(id) })`. First entry in new `src/js/mutations.js`: `mutations.followUnFollow = () => ({ mutationFn: (id) => api.climber.followUnFollow(id), onSuccess: (data, id) => queryClient.invalidateQueries({ queryKey: ['climber-profile', id] }) })` (invalidate-then-refetch, matching this codebase's general preference for invalidation over manual cache surgery — do NOT hand-merge the response into the cache).
- `ClimberProfilePage.vue`: replace `const profile = computed(() => store.state.climbers.profile)` + `store.dispatch('climbers/profile', props.id).then(...)` with `useQuery(queries.climberProfile(() => props.id))`; its `loading` ref becomes that query's own `isLoading`. Replace `followUnFollow`'s `store.dispatch('climbers/followUnFollow', id)` with `useMutation(mutations.followUnFollow()).mutate(id)`. This file's OTHER reads (`store.state.climber`, `store.state.grades`) are untouched per the Global Constraints' `state.climber` boundary and because `grades` belongs to Task 7 — leave its `useStore()` import in place for those.
- `FollowersData.vue`: same `followUnFollow` mutation swap; its `store.state.climber` read is untouched (same boundary).

- [ ] **Step 1: Write the failing tests** for `queries.climberProfile` (queryFn/enabled, matching other `needs()`-gated entries) and `mutations.followUnFollow` (mutationFn calls `api.climber.followUnFollow`, `onSuccess` invalidates `['climber-profile', id]`).

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement.** Create `src/js/mutations.js` (new file) with just `followUnFollow` for now — later tasks/plans add more entries to this same file. Add `climberProfile` to `queryKeys.js`.

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update `ClimberProfilePage.vue` and `FollowersData.vue`** per the interfaces above.

- [ ] **Step 6: Grep-verify before deleting** (per Review Focus item 4): confirm zero remaining matches for `store/home.store.js`, `store/climber.store.js`, `climbers/profile`, `climbers/followUnFollow`, `climberprofile` anywhere in `src/`.

- [ ] **Step 7: Delete `src/js/store/home.store.js` and `src/js/store/climber.store.js`**; remove their imports and the `modules: { home, climbers }` block from `store.js` (replace with no `modules` key at all, since both are now gone).

- [ ] **Step 8: Full suite, lint, build.**

- [ ] **Step 9: Commit**

```bash
git add src/js/queryKeys.js src/js/mutations.js test/queryKeys.climberProfile.test.js test/mutations.followUnFollow.test.js src/pages/ClimberProfilePage.vue src/components/profile/FollowersData.vue src/js/store.js
git rm src/js/store/home.store.js src/js/store/climber.store.js
git commit -m "feat: migrate climber-social to TanStack Query; delete dead Vuex modules"
```

---

### Task 6: Auth/session domain → Pinia

**Files:**
- Create: `src/js/stores/auth.store.js`
- Test: `test/stores/auth.store.test.js`
- Modify consumers: `src/app.vue`, `src/js/app.js` (the 401 interceptor and token-refresh handler), `src/components/home/ShowLoginInstructions.vue`, `src/components/home/ShowTickHelp.vue`, `src/components/home/LeftSidepanel.vue`, and the 8 files that read `state.isAuthenticated` (`src/components/Problem.vue`, `src/components/home/TrainingCard.vue`, `src/components/judging/JudgingComponent.vue`, `src/components/problem/LeftDetails.vue`, `src/pages/SprayWallProblemPage.vue`, `src/pages/Home.vue`, plus `app.vue`/`LeftSidepanel.vue` already listed) — note `src/components/comps/CompetitionRegisterInfo.vue`'s `state.user` read is this same Auth-owned `user` field, include it too
- Modify (remove): `src/js/store.js` (state `isAuthenticated`, `access_token`, `authStep`, `debugOtp`, `authEmail`, `authType`, `authError`, `user`, `expires_in`; mutations `setIsAuthenticated`, `setToken`, `setAuthStep`, `setAuthEmail`, `setAuthType`, `setAuthError`, `setDebugOtp`, `user`, `expires_in`; actions `requestOtp`, `verifyOtp`, `socialLogin`, `completeSocialLogin`, `logout`, `setUser`, `login`)

**Interfaces:**
- Consumes: `pinia` from `src/js/stores/index.js` (Task 1), for the module-scope usage in `app.js`.
- Produces: `useAuthStore(piniaInstance?)` from `src/js/stores/auth.store.js` exposing refs `isAuthenticated`, `accessToken`, `authStep`, `debugOtp`, `authEmail`, `authType`, `authError`, `user`, `expiresIn`; actions `requestOtp(payload)`, `verifyOtp(payload)`, `socialLogin(provider)`, `completeSocialLogin(token)`, `logout()`, `login(payload)` — bodies are faithful ports of the current Vuex actions (same `api.js` calls, same error handling, same `signInWith`/`clearSupabaseSession` imports from `@helpers/socialAuth.js`). `login`/`setUser` are confirmed dead (zero dispatch sites) — DO NOT port them.
- `logout()`'s body keeps the one line `store.commit('climber', null)` against the still-live Vuex `store` (imported from `../store.js`) — see Global Constraints' `state.climber` boundary. Everything else in `logout` (clearing `localStorage.gymid`, resetting auth fields, `clearSupabaseSession()`) moves into the Pinia action.
- `src/js/app.js`'s `setLogoutHandler`/`setTokenRefreshHandler` callbacks call `useAuthStore(pinia).logout()` / `useAuthStore(pinia).setToken(token)`-equivalent (add a `setToken(token)` action to the store purely for this module-scope path, mirroring the current `commit('setToken', token)`), passing the `pinia` instance from Task 1 explicitly since there is no active component context at module scope — this is Review Focus item 2; write it, run the app (or a test) and confirm a 401 actually logs out before considering this task done.

- [ ] **Step 1: Write the failing tests** in `test/stores/auth.store.test.js` covering: `requestOtp` calling the mocked `api.requestOtp` and setting `authStep`/`authEmail`/`debugOtp`; `verifyOtp` success setting `isAuthenticated`/`user`/`accessToken`; `verifyOtp` failure setting `authError` and reverting `authStep` to `'otp_sent'`; `logout` resetting fields AND calling the mocked `store.commit` for `climber` (mock `../store.js`'s default export per the existing `test/store.checkpoint.test.js` pattern); the module-scope usage, e.g. `useAuthStore(testPinia).logout()` called without any component/`setup()` context succeeding.

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement `src/js/stores/auth.store.js`**, porting each action's current body from `store.js:584-700` faithfully. Add a `setToken(token)` action (currently inline as part of the `setToken` mutation, used standalone by the token-refresh handler).

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update `src/js/app.js`**: the `setLogoutHandler`/`setTokenRefreshHandler` callbacks (lines 41-50) now call the Pinia store via the explicit-instance pattern from the Interfaces block above. Also update `app.vue`'s own auth-related lines (`isAuthenticated`, `access_token`, `completeSocialLogin`, `logout` dispatch) and `ShowLoginInstructions.vue` (entirely an Auth-domain file per research — every one of its `store.*` calls moves) and the remaining consumer files listed above, each only for their `isAuthenticated`/`user` reads.

- [ ] **Step 6: Remove the ported state/mutations/actions from `store.js`**, re-confirming `login`/`setUser` still have zero dispatch sites before dropping them.

- [ ] **Step 7: Full suite, lint, build. Manually verify (per Review Focus item 2) that triggering a 401 while signed in actually logs out** — e.g. via a quick manual run with a forced 401, or a targeted integration-style test that exercises `setLogoutHandler`'s real callback end-to-end against the real `pinia` instance (not just the store's `logout()` method in isolation).

- [ ] **Step 8: Commit**

```bash
git add src/js/stores/auth.store.js test/stores/auth.store.test.js src/js/app.js src/app.vue src/components/home/ShowLoginInstructions.vue src/components/home/ShowTickHelp.vue src/components/home/LeftSidepanel.vue src/components/Problem.vue src/components/home/TrainingCard.vue src/components/judging/JudgingComponent.vue src/components/problem/LeftDetails.vue src/pages/SprayWallProblemPage.vue src/components/comps/CompetitionRegisterInfo.vue src/js/store.js
git commit -m "feat: migrate auth/session state from Vuex to Pinia"
```

---

### Task 7: Profile/bootstrap domain → TanStack Query + thin Pinia

**Files:**
- Create: `src/js/stores/gym.store.js` (just `gymid`, unless Task 2's `ui.store.js` is judged the better home — see step 3)
- Modify: `src/js/queryKeys.js` (add `profile` entry), `src/js/mutations.js` (add `changeGym`, `saveSettings` entries)
- Test: `test/queryKeys.profile.test.js`, `test/mutations.profile.test.js`, `test/stores/gym.store.test.js`
- Modify consumers: `src/app.vue`, `src/pages/Home.vue`, `src/components/home/PersonalTickStatus.vue`, `src/components/GymSelector.vue`, `src/components/home/CompleteProfilePopup.vue`, `src/pages/SettingsPage.vue`, plus every file reading `state.gymid`/`state.gym`/`state.styles`/`state.grades`/`state.walls` enumerated below
- Modify (remove): `src/js/store.js` (state `profile`, `profileLoaded`, `gymid`, `gym`, `styles`, `grades`, `walls`; mutations `profile`, `profileLoaded`, `gymid`, `gym`, `styles`, `grades`, `walls`; actions `getProfile`, `changeGym`, `saveSettings`, `saveGymSettings`) — EXCEPT `state.climber`/`commit('climber', ...)`, which stay (see Global Constraints)

**Full consumer list for the gym/styles/grades/walls fields (from grep, exact — do not re-derive):**
- `gymid`: `GymMapSelector.vue`, `GymSelector.vue`, `ui/SprayWallBlock.vue`, `ui/problem/SearchProblemsSheet.vue`, `home/MyBadges.vue`, `training/SessionBody.vue`, `profile/ClimberBadges.vue`, `badges/BadgeSection.vue` (already touched by Task 4 for `badges`, now also for `gymid` — check it doesn't still need `useStore()` for anything else after both tasks), `pages/BadgesPage.vue` (same note), `pages/Home.vue`
- `gym`: `ui/FloorMapBlock.vue`, `home/Ranking.vue`, `home/BadgeGymStats.vue`, `home/LeftSidepanel.vue` (already touched by Task 2/6 — check remaining needs), `home/PersonalTickStatus.vue`, `training/SessionBody.vue`, `feed/NewProblems.vue`, `pages/GymMapPage.vue`, `pages/BadgesPage.vue`, `pages/ProblemList.vue` (already touched by Task 2), `pages/Home.vue`, `pages/BoardSessionPage.vue`
- `styles`: `home/AttributeRadar.vue`, `pages/ProblemList.vue`, `pages/GymMapPage.vue`
- `grades`: `home/ScoreToday.vue`, `home/ShowRanking.vue`, `home/GradePyramid.vue`, `home/MyLogs.vue`, `ranking/ShowClimberTop10.vue`, `problem/GradeOpinion.vue`, `problem/RightDetails.vue`, `problem/AddTick.vue`, `profile/ClimberBio.vue`, `pages/ClimberProfilePage.vue` (already touched by Task 5), `pages/ProblemList.vue`, `pages/GymCompletionPage.vue`, `pages/BoardSessionPage.vue`, `pages/SprayWallProblemPage.vue` (already touched by Task 6), `pages/SprayWallPage.vue` (already touched by Task 2), `pages/SprayWallCreatorPage.vue`
- `walls`: `ui/FloorMapBlock.vue`, `ui/problemlist/WallSelector.vue`, `pages/GymMapPage.vue`

**Interfaces:**
- Produces: `queries.profile(gymid) => ({ queryKey: key('profile', gymid), queryFn: () => api.getProfile(unref(gymid)), enabled: needs(gymid) })`. Each of `gym`, `styles`, `grades`, `walls` is read via `useQuery(queries.profile(gymid), { select: (data) => data.??? })` at each call site — match the exact reshaping `getProfile` currently does (`ret.gym`, `ret.styles`, `ret.grades`, `ret.gym.walls`; `problems` is reduced into an id-keyed object today — that reduction belongs to the Activity group, not this task, since `problems` itself is Activity-owned; leave `getProfile`'s problems-handling and the Activity-owned `rankingTarget`-seed as the one remaining Vuex-side-effect bridge inside the new query's success path for now, same bridge pattern as `climber`).
- `mutations.changeGym()`: `mutationFn: (gymid) => { localStorage.setItem('gymid', gymid); return Promise.resolve(gymid) }` (there is no API call in today's `changeGym` — it's local-only plus a `getProfile` re-dispatch, which the new query's own key-change-triggers-refetch behavior now handles for free), `onSuccess: () => {}` (matching today's `INVALIDATES.changeGym: () => []`, i.e. invalidates nothing — the gym id itself changing is what changes every gym-scoped key).
- `mutations.saveSettings()`: `mutationFn: (payload) => api.saveSettings(payload)`, `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] })` (the current action only updates `climber`, which per the Global Constraints boundary is out of scope — but `saveSettings` changing settings that could affect the profile payload is plausible; invalidate the profile query broadly rather than trying to hand-merge, and leave the still-needed `commit('climber', ret.climber)` bridge in its `onSuccess` too, same pattern as `queries.profile`).
- `gymid` itself: decide in Step 3 whether it lives in a new tiny `gym.store.js` or folds into Task 2's `ui.store.js`; either is acceptable, but `changeGym`'s mutation and every consumer above must agree on one answer. State the choice explicitly in the task's commit message and PR description once this plan executes.
- `profileLoaded`: eliminate it (see Review Focus item 3) — its sole consumer, `Home.vue`, switches to `useQuery(queries.profile(gymid))`'s own `isSuccess`.

- [ ] **Step 1: Write the failing tests** for `queries.profile` (queryFn/enabled/select-shape expectations matching the fields above), `mutations.changeGym` (writes `localStorage.gymid`, invalidates nothing), `mutations.saveSettings` (calls the mocked `api.saveSettings`, invalidates `['profile']`, still bridges `climber`), and the `gymid` store (wherever it lands).

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement.** Add `profile` to `queryKeys.js`, `changeGym`/`saveSettings` to `mutations.js`, and the `gymid` store (new file or folded into `ui.store.js` — your call, made once, stated plainly).

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update every consumer file in the lists above** for its specific field(s) only, using `select` for the four bootstrap-payload slices and the new `gymid` store for gym selection. `Home.vue` specifically: replace its `profileLoaded` read with the query's `isSuccess`.

- [ ] **Step 6: Remove the ported state/mutations/actions from `store.js`**, preserving `state.climber`/`commit('climber', ...)` exactly as `store.js` has it today (Global Constraints), and re-confirming `saveGymSettings` still has zero consumers before dropping it.

- [ ] **Step 7: Full suite, lint, build.**

- [ ] **Step 8: Commit**

```bash
git add src/js/queryKeys.js src/js/mutations.js src/js/stores/gym.store.js test/queryKeys.profile.test.js test/mutations.profile.test.js test/stores/gym.store.test.js src/app.vue src/pages/Home.vue src/js/store.js # plus every other touched consumer file
git commit -m "feat: migrate profile/bootstrap from Vuex to TanStack Query"
```

---

## After this plan ships

`src/js/store.js` still contains the Activity group (Problems/ticks, Rankings, Competitions, plus the `climber`/`getClimber`/`getClimberByKey`/`pointEntryKey` fields this plan deliberately left behind) and the `vuex` dependency is still required. A separate plan, written after this one lands and is verified, covers that group and finishes the migration (deleting `store.js`, `src/js/store/`, and the `vuex` dependency, and retiring `invalidateAfter`/`keysInvalidatedBy` entirely).
