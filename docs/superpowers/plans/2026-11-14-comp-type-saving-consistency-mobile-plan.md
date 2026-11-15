# Competition self-entry saving consistency — Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish wiring `ifsc_2024_bouldering` through the real checkpoint-ladder system
(it was never completed — a prior unit built the ladder UI, but Save still always calls
`doTick`), and wire `ifsc_2018_bouldering`, `traditional`, `flashcomp` through the same
system for the first time (1-rung "Bonus" ladder), plus `sport`'s non-ladder height input
through an equivalent partial-score save path. Delete `zoneLadder.js`, now fully
superseded.

**Architecture:** `useCheckpointLadders.js` already generically drives any rung count via
injectable `zonesFor`/`saveCheckpoint`/`deleteCheckpoint`/`saveTop` params. Extend it to
also carry bonus-rung data through `saveTop` so the additive bonus-plus-top scoring types
store `tries_bonus` correctly. Wire five comp-type branches in `CompetitionEntry.vue` and
`PublicCompetitionEntry.vue` onto this one mechanism instead of each type's own
stepper/ladder-with-doTick code.

**Tech Stack:** Vue 3 `<script setup>`, Framework7, Vuex, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-comp-type-saving-consistency-design.md`

**Depends on:** the sibling backend plan (`fix/comp-type-saving-consistency` in the
backend repo) being merged/deployed first — this plan's new API calls need
`CheckpointRecorder` to accept these five types and the `score_value` column to exist.

## Global Constraints

- `checkpoint_points`'s own behavior is unchanged — every default value added to
  `useCheckpointLadders.js` must preserve exactly what it does today when the new
  params are omitted.
- `compTickTries()` is not modified.
- `PublicCompetitionEntry.vue`'s `checkpoint_points` branch (its separate, deliberately
  read-only `ladderFor`) is not touched.
- A Bonus/zone/height save never writes a `problemator_tick` row. A Top save always
  does, and (for the four rung types) carries the correct `tries_bonus` alongside
  `tries`.
- `zoneLadder.js` and its test are deleted only in this plan's final task, after
  confirming (by grep) that nothing still imports them.

## Review Focus

1. For each of the five newly/correctly-wired types, tapping only the Bonus/zone rung
   (never Top) and letting the ladder save does not show a ✓/checkmark on the row's
   generic Save-button-era UI and does not enable the delete-ascent icon — both of
   those are tied to `isTicked(prob.id)`, which must stay false.
2. A Top tapped directly (without tapping Bonus first) on a 1-rung type still writes
   `tries_bonus` equal to the top's own tries — not `0` — so the backend's additive
   formula doesn't silently lose or penalize it.
3. Editing a bonus rung's count AFTER a Top has already been saved re-saves the tick
   with the corrected `tries_bonus` (not just the checkpoint row).
4. `sport`'s text-field input still shows/accepts the same values as today
   (`sportPointsDisplay`'s `'TOP'` for 1000, the raw number otherwise) — only what
   happens on Save changes, not the input itself.
5. `checkpoint_points`'s existing passing tests (`test/compEntryRows.test.js`,
   `test/useCheckpointLadders.test.js`, `test/checkpointLadder.test.js`) all still pass
   unmodified — this plan's shared-file changes default to today's behavior.

---

### Task 1: `useCheckpointLadders.js` carries bonus-rung data through `saveTop`

**Files:**
- Modify: `src/js/useCheckpointLadders.js`
- Modify: `test/useCheckpointLadders.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `saveTop(problemid, tries, bonus)` — the composable's internal `top()`
  function now calls the caller-supplied `saveTop` with a third argument, `bonus`: the
  state's own bonus-rung reached-count if rung 1 was reached before Top, else `tries`
  (the "reached together" default). Every later task's `saveTop` callback (Task 3/4)
  reads this third argument; `checkpoint_points`'s own `saveTop` callback ignores it
  (JS ignores extra arguments by default — no code change needed there, but Task 3/4
  must not accidentally require it).
- Also produces: `zonesFor`, `saveCheckpoint`, `deleteCheckpoint` as optional params to
  `useCheckpointLadders({...})`, each defaulting to today's exact dispatch (this was
  already-approved work from the prior, unexecuted `ifsc_2024_bouldering`-only mobile
  plan; re-stated here since this plan supersedes that one).

- [ ] **Step 1: Write the failing tests**

In `test/useCheckpointLadders.test.js`:
- `test_zonesFor_override_changes_the_rung_count_without_affecting_the_default_caller`:
  passing `zonesFor: () => 1` makes `stateFor()` build a 1-rung ladder; omitting it
  keeps today's `prob.pivot.checkpoints?.length` behavior.
- `test_saveCheckpoint_and_deleteCheckpoint_overrides_are_used_instead_of_the_default_dispatch`:
  passing stub functions for these means `act(prob, 'try')` etc. call the stubs, not
  `store.dispatch('saveCheckpoint', ...)`.
- `test_top_tapped_after_a_reached_bonus_rung_passes_the_bonus_tries_as_saveTops_third_argument`:
  tap `reached` on rung 1 three times (bonus reached at try 3), then tap `top` at try 5 —
  `saveTop` is called with `(pid, 5, 3)`.
- `test_top_tapped_directly_without_a_bonus_tap_passes_the_top_tries_as_the_bonus_value_too`:
  tap `top` directly at try 4 (rung 1 never separately marked reached) — `saveTop` is
  called with `(pid, 4, 4)`.
- `test_editing_a_reached_bonus_rungs_count_after_a_top_resaves_the_tick`: with a topped
  ladder, emit `edit` on rung 1's count — `saveTop` (or the existing `retop` mechanism)
  fires again with the corrected bonus value, not just a `saveCheckpoint` write.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/useCheckpointLadders.test.js`

- [ ] **Step 3: Implement**

Add the three optional params to the function signature with their default values equal
to today's inline expressions (read the current `serverState`/`sync` definitions first —
the defaults must be the literal current behavior, not a rewrite of it).

For the bonus-on-top piece: `top()`'s call to `saveTop(pid, next.topTries ?? next.attempts)`
gains a third argument computed from `next`'s own rung-1 state — if rung 1 is `reached`,
its `count`; otherwise `next.topTries ?? next.attempts` (the same value as the second
argument). Check `helpers/ladder.js`'s existing state shape (`rungView`/row `count`) for
the exact field name holding a reached rung's try count — use that, don't invent a new
one.

For the bonus-edit-resaves-the-tick piece: `correct()` already special-cases
`next.topTries !== cur.topTries` to trigger `retop`. Extend that condition to also fire
when the state is topped AND rung 1's reached count differs between `cur` and `next` (an
edit to the bonus rung while already topped) — same `retop(prob, next)` call, since
`retop` already re-invokes `top()` with the full corrected state, which (per the change
above) recomputes the third `saveTop` argument from `next` automatically.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Run the full suite, then commit**

Run: `npx vitest run`
Expected: all 450 existing tests plus the new ones pass.

```bash
git add src/js/useCheckpointLadders.js test/useCheckpointLadders.test.js
git commit -m "feat: useCheckpointLadders carries bonus-rung data through saveTop"
```

---

### Task 2: `api.js`/`store.js` support `sport`'s score payload

**Files:**
- Modify: `src/js/api.js`
- Modify: `src/js/store.js`
- Create/modify: `test/api.checkpoint.test.js` (extend if Task 1's prior-plan groundwork
  already created this file for `ifsc_2024_bouldering`'s checkpoint prefix/key support;
  otherwise create it)

**Interfaces:**
- Consumes: nothing new.
- Produces: `api.saveCheckpoint`/`api.deleteCheckpoint` accept and forward a `score`
  field exactly like any other field in the payload (these are already generic pass-
  through functions per the prior plan's groundwork — check first whether this task is
  "confirm and test" rather than "implement", since the generic shape may need no code
  change at all, only a test proving it).

- [ ] **Step 1: Read the current `api.js`/`store.js` checkpoint functions**

Confirm whether `saveCheckpoint(payload, prefix='')`/`publicSaveCheckpoint` already pass
an arbitrary payload object through to the backend unchanged (most likely, mirroring
`saveTick`'s own pattern), or whether they narrow the payload to named fields
(`checkpoint`/`attempts`/`zone_tries`) that would silently drop a `score` field.

- [ ] **Step 2: Write the failing test (only if Step 1 found narrowing)**

`test_saveCheckpoint_forwards_a_score_field_for_sport_type_comps`: calling
`api.saveCheckpoint({ compid, problemid, score: 25.25 })` sends a request body
containing `score: 25.25`.

If Step 1 found the payload is already passed through generically, skip straight to
Step 4 and record in the task's commit message that this was a verify-only task.

- [ ] **Step 3: Implement (only if needed)**

Widen whatever narrows the payload to also forward `score`.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`

- [ ] **Step 5: Commit**

```bash
git add src/js/api.js src/js/store.js test/api.checkpoint.test.js
git commit -m "feat: checkpoint save/delete forward sport's score field"
```

---

### Task 3: `CompetitionEntry.vue` — wire all five types through the corrected system

**Files:**
- Modify: `src/components/comps/CompetitionEntry.vue`
- Modify: `src/js/i18n/locales/en.json` (add `"comps.bonus": "Bonus"`)
- Modify: `test/compEntryRows.test.js`

**Interfaces:**
- Consumes: `useCheckpointLadders`'s extended `saveTop` (Task 1), `zonesFor`/
  `saveCheckpoint`/`deleteCheckpoint` overrides (Task 1), `api`/`store` score support
  (Task 2).
- Produces: nothing consumed by a later task except Task 4, which mirrors this one.

- [ ] **Step 1: Write the failing tests**

In `test/compEntryRows.test.js`, reusing its existing `ticked` fixture and `count()`
helper (the same pattern Task 3/4 of the prior `ifsc_2024_bouldering`-only plan used —
read that pattern from the file before writing new assertions, don't invent a different
one):
- For each of `ifsc_2018_bouldering`, `traditional`, `flashcomp`: a row renders a
  `data-test="ladder"` element (not the old stepper pair), the generic Save button and
  delete-ascent icon are hidden (same `v-if` treatment `ifsc_2024_bouldering` gets).
- For `ifsc_2024_bouldering`: the ladder's `@top`/`@reached` handlers now dispatch through
  `ladders.act(...)` (the real `useCheckpointLadders` instance), not
  `onZoneLadderAction`/`zoneLadderFor` (confirm these functions and their backing
  `zoneLadders` ref are gone from the component, not just unused).
- For `sport`: the existing height text field still renders; entering a value under
  1000 and saving calls `ladders`' (or an equivalent) checkpoint-save path, not `doTick`;
  entering `1000` (TOP) and saving still calls `doTick`/`saveTickFor`.
- **For every one of the four rung types** (`ifsc_2024_bouldering`,
  `ifsc_2018_bouldering`, `traditional`, `flashcomp`): tapping `top` on the ladder for a
  specific problem results in a real tick-save dispatch (`saveTop` → `saveTickFor`
  → `store.dispatch('saveTick', ...)`) carrying that exact `problemid` — asserted
  directly (spy on the dispatch, check its `problemid`/`problemid` payload field), not
  just inferred from the fact that scoring tests elsewhere pass. This is the invariant
  the whole unit exists to preserve: a genuine top for a problem always becomes a real
  `problemator_tick` row for that problem; only a lesser bonus/zone/height save is
  diverted away from it.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/compEntryRows.test.js`

- [ ] **Step 3: Delete the old plumbing for `ifsc_2024_bouldering`**

Remove `zoneLadderFor`, `setZoneLadderState`, `onZoneLadderAction`, the `zoneLadders` ref,
and the `zoneLadderFromTick`/`zoneLadderToTick`/`applyZoneLadderAction` import from
`@helpers/zoneLadder.js`. Keep `zoneLadderOptions` (still needed as the `options` prop
for this type's ladder) but source its three entries (`low_zone`/`high_zone`/`top`
labels and point values `5`/`10`/`25`) the same way it already does today — no value
changes, just removing the dead write-path code around it.

- [ ] **Step 4: Wire `ifsc_2024_bouldering`'s template branch onto `ladders`**

Replace the `zoneLadderFor(prob)`/`onZoneLadderAction` calls in that branch's
`checkpoint-ladder` element with `ladders.stateFor(prob)` / `ladders.act(prob, ...)`,
mirroring the `checkpoint_points` branch immediately above it in the template exactly
(same event names, same props), keeping `:options="zoneLadderOptions"`.

The existing `ladders = useCheckpointLadders({...})` call's `saveTop` callback
(`setTries(pid, triesToTop); return saveTickFor(pid)`) needs its signature widened to
accept the bonus argument Task 1 now passes — for `ifsc_2024_bouldering` specifically,
this value is unused (its scoring ignores zone fields once a tick exists); for the three
new 1-rung types (next step) it's required. Give the callback a third parameter and
thread it to `saveTickFor` (see Step 5) so one `ladders` instance serves every type on
this page correctly, rather than building a second instance.

- [ ] **Step 5: Thread the bonus value into `saveTickFor`**

`saveTickFor(id, triesBonus)`: when a `triesBonus` argument is given, use it instead of
`compTickTries()`'s own `tries_bonus` derivation for that specific save call (today's
callers that never pass it — the generic Save button's `doTick` — keep today's
behavior unchanged, deriving `tries_bonus` from `tries.value[id]` as before). Update the
`saveTop` callback from Step 4 to pass this value through:
`saveTop: (pid, triesToTop, triesBonus) => { setTries(pid, triesToTop); return saveTickFor(pid, triesBonus) }`.

- [ ] **Step 6: Add the three new 1-rung ladder branches**

For each of `ifsc_2018_bouldering`, `traditional`, `flashcomp`: add a template branch
identical in shape to `ifsc_2024_bouldering`'s (Step 4's result), using
`ladders.stateFor(prob)`/`ladders.act(prob, ...)`, with an `options` computed ref holding
one entry: `{ label: t('comps.bonus'), value: 1, points: <this type's bonus point value>
}`. Read each type's actual bonus point value from the same place its OLD stepper pair's
label/behavior implied it came from (for `traditional`/`ifsc_2018_bouldering`, this is
the fixed `3` the backend formula hardcodes — read `points` as a literal `3`, not a
per-comp field, matching the backend; for `flashcomp`, its points are try-count-
dependent per `defineFlashPoints()`, which doesn't fit the ladder's "one fixed point
value per rung" display model — omit a specific number for this type's Bonus rung
instead of showing a misleading static one: pass `points: null` and extend
`CheckpointLadder.vue`'s `rungPoints`/template to not render the `ladder__points` span
when a rung's `points` is `null` (today it defaults to `0`, which would show "0" and
read as "this is worth nothing," which is wrong).

Give `useCheckpointLadders`'s `zonesFor` override `() => 1` for these three types (same
single-rung count Task 2 of the backend plan established server-side).

Hide the generic Save button and delete-ascent icon for these three types, same `v-if`
exclusion `ifsc_2024_bouldering` already gets.

- [ ] **Step 7: Wire `sport`'s non-ladder Save path**

`sport` keeps its `<input>` text field (`sportPointsDisplay`/`onChangeSportPoints`)
unchanged. Change what pressing Save does for this type: if the entered value (parsed
from `tries.value[id].sport_points`) is `1000`, call `doTick(id)` exactly as today;
otherwise, dispatch a checkpoint-style save carrying `score: <that value>` (use the
`saveCheckpoint`/`store.dispatch('saveCheckpoint', ...)` path Task 2 confirmed/extended,
either directly or by giving this type its own small `useCheckpointLadders`-adjacent
call — builder's choice of exact plumbing, the constraint is just "a tick is written if
and only if the value is a genuine 1000 top", per the design doc). Keep the Save
button visible and wired to a handler that makes this branch instead of blindly calling
`doTick` for `sport`.

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run test/compEntryRows.test.js`

- [ ] **Step 9: Run the full suite, then commit**

Run: `npx vitest run`
Expected: all previously-passing tests (including `checkpoint_points`'s) plus the new
ones pass.

```bash
git add src/components/comps/CompetitionEntry.vue src/js/i18n/locales/en.json test/compEntryRows.test.js
git commit -m "feat: wire ifsc_2024_bouldering/ifsc_2018_bouldering/traditional/flashcomp/sport through the checkpoint ladder system"
```

---

### Task 4: `PublicCompetitionEntry.vue` — mirror Task 3

**Files:**
- Modify: `src/components/comps/PublicCompetitionEntry.vue`
- Modify: `test/compEntryRows.test.js` (same file Task 3 touched — append alongside its
  existing new blocks, do not duplicate or rewrite them)

**Interfaces:**
- Consumes: everything Task 3 established, applied to the public (point-entry-key) page.

- [ ] **Step 1: Write the failing tests**

Same assertions as Task 3 Step 1 (including the explicit "a genuine top dispatches a
real tick-save carrying that exact problemid" test for all four rung types), against
`PublicCompetitionEntry.vue`'s render output, PLUS: every dispatched save/delete carries
`point_entry_key` when `climber.point_entry_key` is set (mirroring this page's existing
`publicSaveTick`/`publicDeleteTickByProblem` pattern — the new types' saves must use the
`public*` checkpoint actions, not the signed-in ones).

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Apply the same changes as Task 3**

Steps 3-7 of Task 3, adapted to this file: this page never had a `useCheckpointLadders`
instance at all before now (`checkpoint_points`' ladder here is read-only, via the
page's own separate `ladderFor`/`ladderFromServer` — unchanged, not touched by this
task). Instantiate one new `useCheckpointLadders` call for the five types this plan
adds, with `saveCheckpoint`/`deleteCheckpoint` overrides dispatching
`publicSaveCheckpoint`/`publicDeleteCheckpoint` (Task 2) instead of the signed-in
actions, and a `saveTop` override calling this file's own tick-save helper (extract one
from `doTick`'s inlined body if it doesn't already have a named `saveTickFor`-equivalent,
the same way the prior `ifsc_2024_bouldering`-only plan called for).

This page's existing Save-button `v-if` shows it unconditionally for every type today
(`checkpoint_points` relies on this, since its ladder is read-only here). Add a `v-if`
excluding the five types this plan wires, same as Task 3's exclusion — `checkpoint_points`
keeps Save unconditionally, unchanged.

- [ ] **Step 4: Run tests to verify they pass**

- [ ] **Step 5: Run the full suite, then commit**

```bash
git add src/components/comps/PublicCompetitionEntry.vue test/compEntryRows.test.js
git commit -m "feat: PublicCompetitionEntry wires the same five types through the checkpoint ladder system"
```

---

### Task 5: Delete `zoneLadder.js`

**Files:**
- Delete: `src/js/helpers/zoneLadder.js`
- Delete: `test/zoneLadder.test.js`

**Interfaces:**
- Consumes: Tasks 3-4 having removed every import of this file.

- [ ] **Step 1: Grep for remaining references**

Run: `grep -rn "zoneLadder" src/ test/ --include=*.vue --include=*.js`
Expected: no hits outside the two files being deleted. If there are hits, go back and
remove them in the file that still has one — do not delete out from under a live import.

- [ ] **Step 2: Delete both files**

```bash
git rm src/js/helpers/zoneLadder.js test/zoneLadder.test.js
```

- [ ] **Step 3: Run the full suite, then commit**

Run: `npx vitest run`
Expected: all tests pass (one fewer test file).

```bash
git commit -m "chore: delete zoneLadder.js, superseded by useCheckpointLadders"
```
