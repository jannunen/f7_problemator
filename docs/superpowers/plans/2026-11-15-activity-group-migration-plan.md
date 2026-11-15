# Vuex → Pinia + TanStack Query Migration — Activity Group Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Vuex→Pinia/TanStack migration by porting the "Activity" group (Problems/ticks, Rankings, Competitions) the first plan deliberately deferred, plus the `climber`/`pointEntryKey`/`getClimberByKey` fields that plan left bridged into the still-live Vuex store. When this plan ships, `src/js/store.js`, `src/js/store/`, the `vuex` dependency, and the `invalidateAfter`/`keysInvalidatedBy` indirection are all deleted outright.

**Architecture:** Each task ports one coupled slice, updates that slice's consumer files in the same pass, and removes the ported code from `store.js`. Tasks are sequenced so that by the time Ticks (the most central, highest-fan-in piece) is migrated, Rankings/Competitions/Problems/Climber already have their final homes — so Ticks's mutations write directly into those homes with **zero** new bridging, unlike the first plan's six smaller domains (which bridged into the still-live `store.js` because their coupled neighbors hadn't migrated yet). The three live bridges this plan inherits and must retire — `store.commit('rankingTarget', ...)`, `store.commit('problems', ...)`, and `store.commit('climber', ...)` inside `queries.profile`'s queryFn (`src/js/queryKeys.js`), plus `store.commit('climber', ...)` inside `mutations.saveSettings`'s `onSuccess` (`src/js/mutations.js`) — are each retired by the task that takes ownership of that field, not deferred further.

**Tech Stack:** Vue 3 Composition API, Pinia, `@tanstack/vue-query` v5.92.9, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-vuex-to-pinia-tanstack-migration-design.md`

## Global Constraints

- Composition-API Pinia "setup stores" only (function style) — never Options-style `defineStore({state, actions})`. One store per domain, under `src/js/stores/`, matching `src/js/stores/gym.store.js`/`auth.store.js`/`ui.store.js`'s existing shape. Every mutation goes through a named action (`ui.store.js`'s convention — e.g. `setDarkMode(v)`), not direct external ref assignment (`auth.store.js`'s older, now-deprecated convention for this migration; its own cleanup is out of scope here and already deferred to a follow-up).
- A server interaction is a TanStack `useQuery`/`useMutation` when its purpose is to read/change a cacheable, invalidatable server resource. It is a Pinia store action only when its purpose is to directly change cross-cutting state many unrelated places read synchronously.
- `src/js/queryKeys.js`'s `key()`/`needs()` helper conventions and `src/js/mutations.js`'s `{mutationFn, onSuccess}` shape are already established (both files have existing entries from the first plan) — new entries must match exactly, and must not collide with existing entry names (`gyms`, `badges`, `competitions`, `feed`, `newProblems`, `publicAscents`, `rankingTop10`, `sprayWalls`, `sprayWallProblems`, `sprayWallImage`, `sprayWallProblem`, `virtualCoach`, `archiveDates`, `archiveDay`, `climberProfile`, `profile` in `queryKeys.js`; `followUnFollow`, `changeGym`, `saveSettings` in `mutations.js`).
- "Touched exactly once" per consumer file — this plan has NO acknowledged exception left to use, since every domain it touches is migrated within this same plan (unlike the first plan, which had six independent domains landing at different times). If a task finds it would touch a file a later task in THIS plan also needs, that is a sequencing defect in this plan — surface it, do not silently bridge.
- No visible behavior change on any screen. Dead code confirmed by grep to have zero consumers may be dropped rather than ported.
- `npm test` (Vitest) must stay green after every task; `npm run build` and `npx eslint <changed files>` must be clean, with no new warnings.
- `useProfileSlice.js`'s existing helpers (`useProfileGym`, `useProfileWalls`, `useProfileGrades`, `useProfileStyles`) are the established pattern for reading a safe, always-defined slice of `queries.profile(gymid)` — follow the same pattern (`useProfileSlice(gymid, selector, fallback)`) for any new slice this plan needs (e.g. the climber task's `useProfileClimber`), rather than inventing a parallel helper.

### Confirmed by research — must be designed around, not rediscovered

- **`store.js`'s current full inventory** (re-verified against the live file, not just the design doc): state `rankings`, `rankingTarget`, `competition`, `compResults`, `ticksLoaded`, `alltime`, `climber`, `pointEntryKey`, `problems`; mutations `rankingTarget`, `rankings`, `ticksLoaded`, `compResults`, `updatePointsPerRoute`, `removeParticipation`, `updatecompparticipates`, `allTimeTicks`, `addTriesAllTime`, `addTicksAllTime`, `addTickToCompetition`, `setMyCheckpoint`, `removeMyCheckpoint`, `setMyCheckpointScore`, `setMyCheckpointTries`, `removeTickFromCompetition`, `removeTick`, `competition`, `updateProblem`, `isAbsolute` (dead, see below), `problems`, `climber`, `pointEntryKey`; actions `getClimberByKey`, `publicGetPointsPerRoute`, `publicGetCompResults`, `publicSaveTick`, `publicDeleteTickByProblem`, `publicGetCompetition`, `rankings`, `requestSync`, `loadAllTimeTicks`, `deleteProject`, `getCompResults`, `getPointsPerRoute`, `deleteTickByProblem`, `deleteTick`, `saveTick`, `saveCheckpoint`, `deleteCheckpoint`, `publicSaveCheckpoint`, `publicDeleteCheckpoint`, `addTopJudging`, `addCheckpointJudging`, `likeProblem`, `dislikeProblem`, `commentProblem`, `reportProblem`, `getProblemDetails`, `removeCompAscent`, `unRegisterToComp`, `registerToComp`, `getCompetition`, `getClimber`. This matches the design doc's "Activity (combined)" row plus `climber`/`pointEntryKey`/`getClimberByKey` (explicitly deferred here by the first plan's own ledger) plus two items the design doc never named:
  - **`isAbsolute` mutation is dead** — defined, never committed anywhere (`grep -rn "isAbsolute" src/` finds only its own definition). Drop it, don't port it (Task 6).
  - **`requestSync` action is LIVE** — dispatched from `src/components/home/ShowTickHelp.vue:71`. Not named in the design doc's Activity row; it belongs to Ticks (Task 5).
  - **`pointEntryKey` state is dead** — written by `getClimberByKey`'s `commit('pointEntryKey', payload.key)`, never read anywhere (`grep -rn "pointEntryKey" src/` outside `store.js` finds nothing). Drop it, don't port it (Task 1). Do not confuse this top-level field with `climber.point_entry_key`, a property ON the climber object that IS read by several public-key actions (Tasks 1, 5) — that one is live and must be preserved.
  - **`getClimber` action is dead** — zero dispatch sites (`grep -rn "dispatch(['\"]getClimber['\"]" src/` finds nothing). Drop it, don't port it (Task 1).
- **`state.climber` is overloaded today, serving two distinct concepts through one field**, and this plan preserves that overload exactly rather than redesigning it (a redesign is tempting but is a behavior-adjacent architecture change outside this migration's scope): (1) the signed-in climber's own profile, sourced entirely from `queries.profile`'s payload (there is no independent "GET my climber" call in the live app — `getClimber` is dead); (2) the anonymous point-entry climber identity for the public compkey flow, sourced from `getClimberByKey`. Both already share one Vuex field; Task 1 preserves that into one shared Pinia store (`useClimberStore`) written by both sources, exactly matching today's "whichever ran most recently wins" semantics. 19 files currently read `state.climber`.
- **`problems` state is NOT a pure server cache** — it starts as a `select` slice of the SAME `queries.profile(gymid)` payload (`ret.gym.problems`, keyed by id — see `queryKeys.js`'s existing bridge), but is then locally patched by `likeProblem`/`dislikeProblem`/`commentProblem`/`reportProblem`/`getProblemDetails`'s merge/`saveTick`'s `updateProblem`/`deleteProject`/`deleteTick`. Task 4 must preserve each of these patches using `queryClient.setQueryData(['profile', gymid], ...)` to surgically update the cached profile payload's `gym.problems` — not a full invalidate-and-refetch, since `getProblemDetails`'s merge in particular adds detail fields a plain profile refetch would not include.
- **Competitions' read-side and checkpoint/judging-side are NOT separable into independent tasks without double-touching files**: `CompetitionEntry.vue` and `PublicCompetitionEntry.vue` alone account for `getCompResults`, `getPointsPerRoute`, `compResults`, `competition` state, AND `saveCheckpoint` in the same two files. Task 3 covers all of Competitions (read + checkpoint + judging) as one task rather than splitting it, to respect "touched exactly once."

## Review Focus

1. **The stale-cross-competition-response guard** (`ret?.comp?.id == state.competition.id` in `getCompResults`/`publicGetCompResults`) likely becomes unnecessary once `compid` is part of the TanStack query key itself — a stale response can only resolve into its own key's cache entry. Task 3 must confirm this explicitly (and simplify away the manual check) rather than porting it verbatim into a `useQuery`.
2. **`commitSavedCheckpoint`'s branching** (sport score vs. zone tries vs. removal-on-empty undo) must survive intact in whichever form Task 3's `saveCheckpoint`/`publicSaveCheckpoint` mutations take — this is the single piece of logic in this whole plan most likely to silently regress if simplified carelessly.
3. **Ticks (Task 5) must write into Rankings/Competitions/Problems' FINAL homes, not bridge into anything** — unlike every task in the first plan, there is no "later task will fix this" escape hatch left in this plan; if Task 5 finds it still needs to bridge somewhere, a prior task in this plan (2, 3, or 4) left something unfinished, and that is this plan's own defect to fix, not a note for a future plan (there is no future plan after this one).
4. **The Rankings "seed once from profile, then authoritative" rule** (design doc's own decided design) needs an explicit mechanism, not a vague intention — Task 2 must specify exactly how `rankingTarget` is seeded from the profile payload's `gym.country` exactly once and never re-synced after, even across multiple profile refetches (gym switches, `saveSettings` invalidation).
5. **The final cleanup task (Task 6) is the only point in this entire two-plan migration where `src/js/store.js` is actually deleted** — it must verify, not assume, that nothing anywhere in `src/` still imports it, still calls `useStore()` from `'vuex'`, or still references `invalidateAfter`/`keysInvalidatedBy`, before removing any of them. A single missed import anywhere breaks the production build, not just a test.

---

### Task 1: Climber identity (signed-in + public point-entry) → thin Pinia

**Files:**
- Create: `src/js/stores/climber.store.js`
- Test: `test/stores/climber.store.test.js`
- Modify: `src/js/mutations.js` (add `getClimberByKey` entry; update `saveSettings`'s `onSuccess` to write into the new store instead of `store.commit('climber', ...)`)
- Modify: `src/js/queryKeys.js` (`profile`'s queryFn: replace `store.commit('climber', ret.climber)` with `useClimberStore().setFromProfile(ret.climber)` called via the module-scope-explicit-instance pattern already established in `auth.store.js`/`ui.store.js` — import `pinia` from `./stores/index.js`)
- Modify consumers (19 files reading `state.climber`, 1 dispatching `getClimberByKey`): `src/pages/PublicSingleCompetitionPage.vue`, `src/components/home/CompleteProfilePopup.vue`, `src/components/home/LeftSidepanel.vue`, `src/components/home/ShowRanking.vue`, `src/components/comps/CompetitionEntry.vue`, `src/js/helpers/threads.js`, `src/components/home/ShowTickHelp.vue`, `src/components/home/YearlyScores.vue`, `src/components/profile/FollowersData.vue`, `src/components/comps/PublicCompetitionEntry.vue`, `src/components/comps/CompetitionRegisterInfo.vue`, `src/pages/ClimberProfilePage.vue`, `src/pages/SimpleEntryPage.vue`, `src/pages/SettingsPage.vue`, `src/pages/OngoingCompetitionsPage.vue`, `src/pages/MessagesPage.vue`, `src/pages/SingleCompetitionPage.vue` (re-verify this list against the current tree before editing — grep fresh, this plan's own research may have drifted by the time you execute, same lesson the first plan learned repeatedly)
- Modify (remove): `src/js/store.js` (state `climber`, `pointEntryKey`; mutations `climber`, `pointEntryKey`; actions `getClimberByKey`, `getClimber` (dead — re-confirm zero dispatch sites before dropping))

**Interfaces:**
- Produces: `useClimberStore()` from `src/js/stores/climber.store.js` — a setup store exposing `climber` (ref, default `null`) and two actions: `setFromProfile(climberData)` (called from `queries.profile`'s queryFn on every successful fetch — this is the signed-in climber's own data, refreshed whenever the profile refreshes) and `setFromPublicKey(climberData)` (called from the new `mutations.getClimberByKey()`'s `onSuccess` — the anonymous point-entry identity). Both write the SAME `climber` ref, preserving today's exact "whichever ran most recently wins" overload — do not try to separate these into two fields, that is a behavior-adjacent redesign outside this plan's scope.
- `mutations.getClimberByKey()`: `mutationFn: (payload) => api.getClimberByKey(payload, '/compkey')` where `payload` is `{compid, key}`, matching `api.getClimberByKey`'s actual signature exactly (verified: `GET /climber/key/:compid/:key/?key=:key`) — do not simplify this to a single `key` argument, `compid` is required. `onSuccess: (data) => useClimberStore(pinia).setFromPublicKey(data)`. The endpoint can return either a real climber object OR a plain string error message (`PublicSingleCompetitionPage.vue`'s current `.then()` checks `typeof ret == 'string' && ret.match(/access.to.this.comp/i)`) — preserve this exact check in whatever replaces that `.then()` (the mutation's own `onSuccess`, or the component reading `useMutation(...).data` afterward — your call, state which), and do NOT call `setFromPublicKey` with a string error response as if it were a climber. `PublicSingleCompetitionPage.vue` replaces its `store.dispatch('getClimberByKey', {compid, key})` with `useMutation(mutations.getClimberByKey()).mutate({compid: props.compid, key})`.
- `mutations.saveSettings()`'s `onSuccess` becomes: `useClimberStore(pinia).setFromProfile(data.climber); queryClient.invalidateQueries({ queryKey: ['profile'] })` — same two effects as today, just targeting the new store instead of Vuex.
- `queryKeys.js`'s `profile` queryFn's climber bridge line becomes `useClimberStore(pinia).setFromProfile(ret.climber)` in place of `store.commit('climber', ret.climber)`.
- Every one of the 19 consumer files replaces `store.state.climber` with `useClimberStore().climber` (reactive, same shape). `PublicSingleCompetitionPage.vue` additionally replaces its `getClimberByKey` dispatch per above.

- [ ] **Step 1: Write the failing tests** for `climber.store.js` (`setFromProfile`/`setFromPublicKey` each set `climber`, later call overwrites earlier regardless of which method) and for `mutations.getClimberByKey` (mutationFn calls the mocked `api.getClimberByKey` with the right shape, `onSuccess` calls the store).

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement `src/js/stores/climber.store.js`, the new `mutations.js` entry, and the two bridge-call replacements in `queryKeys.js`/`mutations.js`.**

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update all 19 consumer files + `PublicSingleCompetitionPage.vue`'s dispatch**, re-grepping the current tree first to confirm this file list and each file's exact usage (some may have changed since this plan was written).

- [ ] **Step 6: Remove `climber`, `pointEntryKey` state/mutations and `getClimberByKey`, `getClimber` actions from `store.js`**, re-confirming `getClimber`'s zero-dispatch-sites and `pointEntryKey`'s zero-reads claims immediately before deleting.

- [ ] **Step 7: Full suite, lint, build.**

- [ ] **Step 8: Commit**

```bash
git add src/js/stores/climber.store.js test/stores/climber.store.test.js src/js/mutations.js src/js/queryKeys.js src/js/store.js # plus all touched consumer files
git commit -m "feat: migrate climber identity (signed-in + public point-entry) to Pinia"
```

---

### Task 2: Rankings → Pinia

**Files:**
- Create: `src/js/stores/rankings.store.js`
- Test: `test/stores/rankings.store.test.js`
- Modify: `src/js/queryKeys.js` (`profile`'s queryFn: replace `store.commit('rankingTarget', ret.gym.country)` with a call to the new store's seed method)
- Modify consumers: `src/components/home/Ranking.vue` (state `rankings`, dispatch `rankings`), `src/components/home/ShowRanking.vue` (dispatch `rankings`) — re-verify against the current tree before editing
- Modify (remove): `src/js/store.js` (state `rankings`, `rankingTarget`; mutations `rankingTarget`, `rankings`; action `rankings`)

**Interfaces:**
- Produces: `useRankingsStore()` from `src/js/stores/rankings.store.js` exposing: `rankingTarget` (ref, default `'global'`, matching today's Vuex default), `rankings` (ref, default `null`), `setRankingTarget(country)` (explicit user choice — always wins, and marks the store as no longer eligible for the profile seed), `seedFromProfile(country)` (internal — a no-op if the store has already been explicitly set OR already seeded once; otherwise sets `rankingTarget` and marks seeded), `fetchRankings()` (ports the `rankings` action's body: `api.ranking({country: rankingTarget.value})` then sets the `rankings` ref — keep this a plain Pinia action calling `api.js` directly, per the design doc's dividing line: nothing else caches or invalidates "the current ranking view," it is view state tied 1:1 to this one store's own `rankingTarget`, not a shared server resource multiple independent queries read).
- Implement the seed-once guard with an internal `seeded` ref (not exported): `seedFromProfile(country) { if (seeded.value || country == null) return; rankingTarget.value = country; seeded.value = true }`; `setRankingTarget(country) { rankingTarget.value = country; seeded.value = true }`.
- `queryKeys.js`'s `profile` queryFn's rankingTarget bridge line becomes `useRankingsStore(pinia).seedFromProfile(ret.gym?.country)` in place of `store.commit('rankingTarget', ret.gym.country)` (note the added `?.` — today's line assumes `ret.gym` is already checked non-null by the surrounding `if`, preserve that exact guard structure, don't introduce a new null-safety behavior change).
- `Ranking.vue`/`ShowRanking.vue` replace `store.dispatch('rankings', {country})` with the store's `fetchRankings()` (reading `rankingTarget` from the store directly rather than being passed it, since the store now owns both pieces) and `store.state.rankings` with the store's `rankings` ref.

- [ ] **Step 1: Write the failing tests** for `rankings.store.js`: `seedFromProfile` sets `rankingTarget` on first call, is a no-op on a second call with a different country, is a no-op after `setRankingTarget` has been called even if `seedFromProfile` runs afterward (the exact ordering risk a profile refetch after a manual ranking-target change could otherwise hit); `fetchRankings` calls the mocked `api.ranking` with the current `rankingTarget` and sets `rankings`.

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement `src/js/stores/rankings.store.js` and the `queryKeys.js` bridge replacement.**

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update `Ranking.vue` and `ShowRanking.vue`**, re-verified against the current tree first.

- [ ] **Step 6: Remove `rankings`, `rankingTarget` state/mutations and the `rankings` action from `store.js`.**

- [ ] **Step 7: Full suite, lint, build.**

- [ ] **Step 8: Commit**

```bash
git add src/js/stores/rankings.store.js test/stores/rankings.store.test.js src/js/queryKeys.js src/js/store.js src/components/home/Ranking.vue src/components/home/ShowRanking.vue
git commit -m "feat: migrate rankings to Pinia"
```

---

### Task 3: Competitions (read, checkpoints, judging) → TanStack Query + mutations

**Files:**
- Modify: `src/js/queryKeys.js` (add `competition(compid)`, `compResults(compid)` entries)
- Modify: `src/js/mutations.js` (add `getPointsPerRoute`, `registerToComp`, `unRegisterToComp`, `saveCheckpoint`, `deleteCheckpoint`, `addTopJudging`, `addCheckpointJudging`, plus the public-key variants `publicGetCompetition`, `publicGetCompResults`, `publicGetPointsPerRoute`, `publicSaveTick`'s competition-side effects are Task 5's concern not this task's — do NOT touch `saveTick`/`publicSaveTick` here — `publicSaveCheckpoint`, `publicDeleteCheckpoint`, `removeCompAscent`)
- Modify consumers: `src/components/judging/JudgingComponent.vue`, `src/pages/SimpleEntryPage.vue`, `src/pages/PublicSingleCompetitionPage.vue`, `src/pages/SingleCompetitionPage.vue`, `src/components/comps/CompetitionEntry.vue`, `src/components/comps/PublicCompetitionEntry.vue`, `src/components/comps/CompetitionRegisterInfo.vue`, `src/js/useCheckpointLadders.js`, `src/components/judging/BoulderJudging.vue` — re-verify against the current tree before editing
- Modify (remove): `src/js/store.js` (state `competition`, `compResults`, all `my_checkpoint*`-touching state shape; mutations `updatePointsPerRoute`, `removeParticipation`, `updatecompparticipates`, `addTickToCompetition` (Task 5 removes this one, since it's `saveTick`'s own commit — coordinate: leave it here until Task 5, note explicitly in that task's brief), `setMyCheckpoint`, `removeMyCheckpoint`, `setMyCheckpointScore`, `setMyCheckpointTries`, `removeTickFromCompetition` (same Task 5 coordination note), `competition`; actions `publicGetPointsPerRoute`, `publicGetCompResults`, `publicGetCompetition`, `getCompResults`, `getPointsPerRoute`, `saveCheckpoint`, `deleteCheckpoint`, `publicSaveCheckpoint`, `publicDeleteCheckpoint`, `addTopJudging`, `addCheckpointJudging`, `removeCompAscent`, `unRegisterToComp`, `registerToComp`, `getCompetition`)

**Interfaces:**
- Produces: `queries.competition(compid) => ({ queryKey: key('competition', compid), queryFn: () => api.getCompetition(unref(compid)), enabled: needs(compid) })` and its public-key sibling consumed the same way `publicAscents`/other public-key queries already are in this file — check the exact public-key call signature `api.getCompetition(payload, '/compkey')` takes and mirror it faithfully, do not assume it is identical to the authenticated call's shape.
- Produces: `queries.compResults(compid) => ({ queryKey: key('comp-results', compid), queryFn: () => api.getCompResults({compid: unref(compid)}), enabled: needs(compid) })`. Per Review Focus item 1: confirm whether `compid` being part of this key makes the existing manual stale-response guard (`ret?.comp?.id == state.competition.id`, present in both `getCompResults` and `publicGetCompResults`) now redundant — a response for compid A can only ever resolve into the `['comp-results', A]` cache entry, so a climber who has navigated to compid B is observing a different query entirely. If this reasoning holds (verify it, don't just assert it), drop the manual guard entirely rather than porting it into the queryFn — this is new dead-code removal confirmed by this task, not a port.
- Produces `mutations.saveCheckpoint()`/`mutations.deleteCheckpoint()` (and public-key siblings) preserving `commitSavedCheckpoint`'s exact branching (sport score vs. zone tries vs. removal-on-empty-undo) — move this helper function's logic into the mutation's `onSuccess`, writing into wherever the ported `my_checkpoint*` state now lives (this task's own new home for it — your call on exact shape: likely fields on the `queries.competition`/`queries.compResults` cache via `setQueryData`, since these are per-competition, per-climber checkpoint states tightly coupled to a specific competition's cached data, not independent cacheable resources of their own). State this design decision explicitly in your report.
- Produces `mutations.addTopJudging()`/`mutations.addCheckpointJudging()` as thin mutations preserving the existing error-shape handling (`addTopJudging`'s `{error:true, message}` 200-response throw).
- Produces `mutations.registerToComp()`/`mutations.unRegisterToComp()`/`mutations.removeCompAscent()`/`mutations.getPointsPerRoute()` (and public-key siblings) as straightforward `mutationFn` wrappers around their `api.js` calls, invalidating `['competition', compid]`/`['comp-results', compid]` as appropriate per what each one's old commit touched (`updatecompparticipates`/`removeParticipation` both touch `state.competition.paidregistrations`/`unpaidregistrations` — these become a cache update on the `competition` query, via `setQueryData` or invalidation, your call, state which and why).

- [ ] **Step 1: Write the failing tests** covering: `queries.competition`/`queries.compResults` queryFn+enabled, each new mutation's `mutationFn` calling the right `api.js` function with the right shape, `commitSavedCheckpoint`'s three branches (sport score / zone tries / removal-on-empty) each producing the correct cache update, `addTopJudging`'s error-response-throws-not-resolves behavior.

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement** the `queryKeys.js`/`mutations.js` entries, following this file's `commitSavedCheckpoint` logic exactly (read it from `store.js` before removing it — this is the single highest-risk piece of logic in this plan per Review Focus item 2).

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update all 9 consumer files**, re-verified against the current tree first. Pay particular attention to `CompetitionEntry.vue`/`PublicCompetitionEntry.vue`, which read/write nearly every piece this task touches.

- [ ] **Step 6: Remove the ported state/mutations/actions from `store.js`**, EXCEPT leave `addTickToCompetition`/`removeTickFromCompetition` mutations in place for Task 5 to remove (they are `saveTick`/`deleteTick`'s own commits, not this task's to touch, even though they write into `state.competition`).

- [ ] **Step 7: Full suite, lint, build.**

- [ ] **Step 8: Commit**

```bash
git add src/js/queryKeys.js src/js/mutations.js src/js/store.js # plus all touched consumer files and new test files
git commit -m "feat: migrate competitions (read, checkpoints, judging) to TanStack Query"
```

---

### Task 4: Problems (profile-derived, locally patched) → TanStack Query

**Files:**
- Modify: `src/js/queryKeys.js` (`profile`'s queryFn: replace `store.commit('problems', problems)` with nothing — `problems` becomes a pure `select` slice, no bridge needed, since it was never anything but a reshaping of `ret.gym.problems`; add a new `useProfileProblems(gymid)` helper to `useProfileSlice.js` instead, matching `useProfileGym`/`useProfileGrades`/etc.'s existing pattern)
- Modify: `src/js/useProfileSlice.js` (add `useProfileProblems`)
- Modify: `src/js/mutations.js` (add `likeProblem`, `dislikeProblem`, `commentProblem`, `reportProblem`, `getProblemDetails`, `deleteProject` — each patches the cached profile payload's `gym.problems[id]` via `queryClient.setQueryData`, not invalidation, since `getProblemDetails` in particular merges in detail-endpoint-only fields a refetch would not restore)
- Modify consumers: `src/components/ExpiringProblemsAlert.vue`, `src/components/home/AttributeRadar.vue`, `src/pages/GymCompletionPage.vue`, `src/pages/SprayWallProblemPage.vue`, `src/pages/ProblemList.vue`, `src/pages/GymMapPage.vue` (reads), `src/components/problem/LeftDetails.vue` (likeProblem/dislikeProblem/commentProblem), `src/components/problem/ReportProblem.vue` (reportProblem), `src/components/Problem.vue` (getProblemDetails), `src/components/ui/problem/TickList.vue`, `src/pages/ArchivePage.vue` (both dispatch `deleteProject` — confirmed still a single, whole, unmigrated action in the current `store.js`, Task 4's to take in full, not split with Archive) — re-verify every file in this list against the current tree before editing
- Modify (remove): `src/js/store.js` (state `problems`; mutation `updateProblem`, `problems`; actions `likeProblem`, `dislikeProblem`, `commentProblem`, `reportProblem`, `getProblemDetails`, `deleteProject`)

**Interfaces:**
- Produces: `useProfileProblems(gymid)` in `useProfileSlice.js`, matching the existing helpers' exact shape: `useProfileSlice(gymid, (d) => d.gym?.problems, [])` — but check whether consumers actually want the id-keyed object shape `store.commit('problems', problems)` currently produces (`acc[prob.id] = prob`) rather than the raw array `d.gym.problems` — match whatever shape the consumer files actually destructure today, don't assume the array shape is right just because it's simpler.
- Each new `mutations.js` entry (`likeProblem` etc.) follows the pattern: `mutationFn: (id) => api.likeProblem(id)`, `onSuccess: (data, id) => queryClient.setQueryData(['profile', gymid], (old) => ({...old, gym: {...old.gym, problems: old.gym.problems.map(p => p.id === id ? {...p, ...patchFromData} : p)}}))` — note `gymid` is not available inside a plain `mutations.js` factory the way it is in a component; these mutations need `gymid` passed as part of their payload or captured via the Pinia gym store's `useGymStore(pinia).gymid` at call time (your call on which — state it explicitly, since this is a real design decision `queryKeys.js`'s existing gym-scoped entries didn't have to make the same way, since they take `gymid` as a factory argument reactively, not inside a mutationFn).

- [ ] **Step 1: Write the failing tests** covering `useProfileProblems`'s selector/fallback shape, and each new mutation's `setQueryData` patch producing the exact same merged shape the old Vuex commit produced (e.g. `likeProblem`'s `c_like`/`likeCount`/`c_dislike`/`dislikeCount` fields, `getProblemDetails`'s `{...curProblem, ...problem}` merge).

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement.**

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update all consumer files**, re-verified against the current tree first.

- [ ] **Step 6: Remove the ported state/mutations/actions from `store.js`, and remove the now-dead `store.commit('problems', ...)` bridge line from `queryKeys.js`'s `profile` queryFn** (the `if (ret.gym.problems != null) {...}` block becomes unnecessary entirely once nothing reads `state.problems` — delete the block, not just the commit call, if nothing else in it is needed).

- [ ] **Step 7: Full suite, lint, build.**

- [ ] **Step 8: Commit**

```bash
git add src/js/queryKeys.js src/js/useProfileSlice.js src/js/mutations.js src/js/store.js # plus all touched consumer files and new test files
git commit -m "feat: migrate problems (profile-derived, locally patched) to TanStack Query"
```

---

### Task 5: Ticks (the central, highest-fan-in piece) → TanStack Query

**Files:**
- Modify: `src/js/mutations.js` (add `saveTick`, `deleteTick`, `deleteTickByProblem`, `publicSaveTick`, `publicDeleteTickByProblem`, `loadAllTimeTicks` (as a query, not a mutation — see below), `requestSync`)
- Modify: `src/js/queryKeys.js` (add `allTimeTicks()` — `loadAllTimeTicks` is a read, not a write, despite living in `store.js`'s `actions` block; per the TanStack-vs-Pinia dividing line it belongs in `queries`, not `mutations`)
- Modify consumers: `src/components/ui/problem/SearchHitItem.vue`, `src/components/feed/NewProblemItem.vue`, `src/components/comps/CompetitionEntry.vue`, `src/components/problem/AddTick.vue` (saveTick), `src/components/ui/problem/TickList.vue`, `src/pages/ArchivePage.vue` (deleteTick), `src/components/comps/CompetitionEntry.vue` (deleteTickByProblem — already touched above for saveTick, confirm no double-edit), `src/components/comps/PublicCompetitionEntry.vue` (publicSaveTick, publicDeleteTickByProblem), `src/app.vue` (loadAllTimeTicks), `src/components/home/ShowTickHelp.vue` (requestSync), plus the ~17 files reading `state.alltime`: `src/app.vue`, `src/components/home/BadgeGymStats.vue`, `src/components/home/ScoreToday.vue`, `src/components/ui/problem/SearchHitItem.vue`, `src/components/home/GradePyramid.vue`, `src/components/home/MyLogs.vue`, `src/components/home/AttributeRadar.vue`, `src/components/home/TodayHeader.vue`, `src/components/problem/LeftDetails.vue`, `src/components/profile/ClimbedProblemListItem.vue`, `src/components/feed/NewProblemItem.vue`, `src/components/feed/FeedItem.vue`, `src/components/comps/PublicCompetitionEntry.vue`, `src/pages/ProblemList.vue`, `src/pages/GymMapPage.vue`, `src/pages/Home.vue`, `src/pages/GymCompletionPage.vue`, `src/pages/SprayWallProblemPage.vue` — re-verify every file in this list against the current tree before editing, this is the largest consumer list in this plan
- Modify (remove): `src/js/store.js` entirely — once this task lands, `store.js` should have nothing left but its `createStore({...})` scaffold and the `commitSavedCheckpoint` helper (confirm this is true before Task 6, don't assume)

**Interfaces:**
- Produces: `queries.allTimeTicks() => ({ queryKey: key('alltime-ticks'), queryFn: () => api.loadAllTimeTicks(), enabled: isAuthenticated })` replacing `state.alltime`/`ticksLoaded` — the 17 consumer files above read `data.value?.ticks ?? []`/`data.value?.tries ?? []` (via a `useProfileSlice`-style safe-default helper — add `useAllTimeTicks()`/similar to a new or existing composable, matching the established convention) instead of `store.state.alltime`. `ticksLoaded` itself is redundant with the query's own `isSuccess`, same reasoning the first plan applied to `profileLoaded` — eliminate it, don't port it, unless you find a consumer that genuinely needs it for something `isSuccess` doesn't cover (state explicitly if so).
- Produces `mutations.saveTick()`/`mutations.deleteTick()`/`mutations.deleteTickByProblem()` (and public-key siblings) whose `onSuccess` does ALL of what the old action did, now writing directly into final homes with zero bridging: `queryClient.setQueryData` (or invalidate) on `['alltime-ticks']` for the tick/try list, on `['profile', gymid]` for the problem patch (same pattern as Task 4's mutations — use the SAME patch helper if Task 4 built one reusable enough, don't duplicate the merge logic), on `['competition', compid]` for `addTickToCompetition`/`removeTickFromCompetition`'s effect, and calling `useRankingsStore(pinia).fetchRankings()` in place of `dispatch('rankings', {country: state.rankingTarget})` (Task 2's store already owns `rankingTarget`, so this call needs no country argument — the store reads its own).
- `saveTick`/`publicSaveTick`/`deleteTickByProblem`-family `mutationFn`s must preserve the `point_entry_key` attachment the old actions did: `if (state.climber != null && state.climber.point_entry_key != null) payload.point_entry_key = state.climber.point_entry_key` — read this from Task 1's `useClimberStore(pinia).climber` the same way, before calling `api.saveTick(payload)`. This is easy to silently drop since it is a precondition check buried before the API call, not part of the success-path effects most of this task's attention goes toward — it has no test today and needs one here (a payload sent while `climber.point_entry_key` is set must include it; one without must not).
- `requestSync` becomes a plain `mutations.requestSync()` (or a direct Pinia-less helper if nothing needs to observe its pending/success state beyond firing — check `ShowTickHelp.vue`'s actual usage before deciding, state your choice).

- [ ] **Step 1: Write the failing tests** covering `queries.allTimeTicks`, and each new mutation's full effect set (tick/try list update, problem patch, competition-cache update where applicable, rankings refetch call) — this is the task where a missed effect is most likely to produce a real regression, so err toward one test per effect rather than one broad test per mutation.

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement.** Read `store.js`'s current `saveTick`/`deleteTick`/`publicSaveTick`/`publicDeleteTickByProblem` bodies in full immediately before writing this task's mutations — by now `store.js` may have shrunk further than this plan anticipated from Tasks 1-4 removing neighboring code, but these specific actions' bodies should be unchanged until this task touches them.

- [ ] **Step 4: Run to verify pass.**

- [ ] **Step 5: Update all consumer files**, re-verified against the current tree first.

- [ ] **Step 6: Remove everything this task ported from `store.js`**, including the `addTickToCompetition`/`removeTickFromCompetition` mutations Task 3 deliberately left behind for this task to remove. Confirm `store.js` now contains nothing but the `createStore({...})` scaffold, empty `state`/`mutations`/`actions`/`getters` blocks, and the `commitSavedCheckpoint` helper (which Task 3 should have already moved out — if it's still here, that's this task's problem to finish, not silently leave for Task 6).

- [ ] **Step 7: Full suite, lint, build.**

- [ ] **Step 8: Commit**

```bash
git add src/js/mutations.js src/js/queryKeys.js src/js/store.js # plus all touched consumer files and new test files
git commit -m "feat: migrate ticks to TanStack Query"
```

---

### Task 6: Delete Vuex entirely

**Files:**
- Delete: `src/js/store.js`, `src/js/store/` (if anything remains in it — should be empty/nonexistent after the first plan's Task 5 already deleted its two module files; confirm)
- Modify: `package.json` (remove `vuex` dependency)
- Modify: `src/js/app.js` (remove `import store from './store.js'`, `app.use(store)`)
- Modify: `src/js/queryKeys.js`, `src/js/mutations.js` (remove `import store from './store.js'` — this import should now be provably unused in both files, since Tasks 1, 2, and 4 each retired the one bridge call that needed it)
- Modify: `src/js/invalidation.js`, `src/js/queryKeyNames.js` (delete `invalidateAfter` and `keysInvalidatedBy`/`INVALIDATES`/`invalidate` entirely, along with any now-dead `INVALIDATES` map entries left over from actions this and the first plan already converted — check for residue like the first plan's already-fixed `changeGym: () => []`)
- Test: delete or update any test file that imports `store.js` directly (grep for `from '@js/store.js'`/`from '../js/store.js'`/similar in `test/`)

**Interfaces:**
- No new interfaces — this task only deletes.

- [ ] **Step 1: Grep-verify before deleting anything** (per Review Focus item 5): `grep -rln "from '@js/store.js'\|from '\.\./.*store\.js'\|from '\./store\.js'" src/ test/`, `grep -rln "useStore.*from ['\"]vuex['\"]\|from ['\"]vuex['\"]" src/`, `grep -rln "invalidateAfter\|keysInvalidatedBy\|INVALIDATES" src/`. Every hit must be accounted for — either already removed by Tasks 1-5, or removed as part of this task's own edits below. Do not proceed to deletion until this grep comes back clean or every remaining hit is explained.

- [ ] **Step 2: Remove `app.use(store)` and its import from `src/js/app.js`.**

- [ ] **Step 3: Remove the now-unused `import store from './store.js'` from `queryKeys.js` and `mutations.js`.**

- [ ] **Step 4: Delete `src/js/invalidation.js`'s `invalidateAfter` export and `src/js/queryKeyNames.js`'s `keysInvalidatedBy`/`INVALIDATES`/`invalidate` export** (check `queryKeys.js`'s own `export { invalidate } from '@js/queryKeyNames'` re-export line — remove it too once nothing imports `invalidate` from `queryKeys.js` either).

- [ ] **Step 5: Delete `src/js/store.js` and `src/js/store/`** (if it still exists as a directory).

- [ ] **Step 6: Remove `vuex` from `package.json`'s dependencies, run `npm install` to update the lockfile.**

- [ ] **Step 7: Delete or update any test file that imported `store.js` directly**, per Step 1's grep.

- [ ] **Step 8: Full suite, lint, build.** This is the first point in either plan where a missed reference produces a hard build failure rather than a silent runtime gap — if the build fails, do not route around it by re-adding a stub; find and fix the actual remaining reference.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: delete Vuex entirely — migration to Pinia/TanStack Query complete"
```

---

## After this plan ships

The Vuex→Pinia/TanStack migration (both plans) is complete. `src/js/store.js`, `src/js/store/`, `vuex`, and the `invalidateAfter`/`keysInvalidatedBy` indirection no longer exist anywhere in the mobile app. Every one of the ~60 files that used to call `useStore()` from `'vuex'` now uses a Pinia store or a TanStack query/mutation.
