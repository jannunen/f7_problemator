# Checkpoint Labels (Mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a routesetter-defined checkpoint `label` (e.g. "A"/"B"/"C") display everywhere this mobile PWA currently shows "Checkpoint N" to a climber or a judge, falling back to today's exact "Checkpoint N" text when a checkpoint has no label.

**Architecture:** One pure helper (`checkpointDisplayLabel`) in `src/js/helpers/checkpoints.js` becomes the single source of display text for a checkpoint position, and the two real render sites (`CheckpointRow.vue`'s picker/status line, used by both `CompetitionEntry.vue` and `PublicCompetitionEntry.vue`; `BoulderJudging.vue`'s picker/toast) are switched to call it instead of each building its own text. Two new, narrowly-scoped i18n keys carry the label-aware sentences ("{label} reached", "{label} recorded"); the existing "Checkpoint {n}"-shaped keys are kept, untouched, for the no-label fallback.

**Tech Stack:** Vue 3 `<script setup>`, Vuex, vue-i18n, Vitest (`environment: 'node'`, no DOM/component-mount library present).

**Spec:** `/private/var/sites/problemator_backend/.worktrees/checkpoint-labels-bulk-apply/docs/superpowers/specs/2026-11-10-checkpoint-labels-and-bulk-apply-design.md` (mobile portion: "Mobile changes (f7_problemator)" section; data-model and backend-contract sections give the `label` shape this plan consumes).

## Important correction to the spec before you start

The spec's mobile section claims: *"both `CompetitionEntry.vue` and `PublicCompetitionEntry.vue` already consume this helper's output directly ... so the label flows through to the picker with no template changes in either component."* **This is false, confirmed by reading the actual code.** Neither component renders a checkpoint option's `label` field at all, today or after a literal patch of `checkpointOptions()`:

- Both components delegate the entire checkpoint picker + status row to one shared child, `CheckpointRow.vue` (`CompetitionEntry.vue:117-126`, `PublicCompetitionEntry.vue:118-125`, both importing it as `CheckPointRow` from `./CheckpointRow.vue`).
- `CheckpointRow.vue:49` builds its own button text — `const label = (opt) => (opt.value === 'top' ? t('comps.top') : t('comps.checkpoint_n', { n: opt.value }))` — which **ignores `opt.label` entirely** and always renders the translated "Checkpoint N" text, in a loop at `CheckpointRow.vue:5-15` (`{{ label(opt) }} ({{ opt.points }})`, `CheckpointRow.vue:14`).
- `CheckpointRow.vue:19` has a second spot with the same problem: the "reached" status line calls `t('comps.checkpoint_reached', { n: myCheckpoint })` directly from the raw position number, never looking at any option's label.
- `BoulderJudging.vue:234` has the exact same pattern inline in its template: `{{ opt.value === 'top' ? t('comps.top') : t('comps.checkpoint_n', { n: opt.value }) }} ({{ opt.points }})` — it already calls the shared `checkpointOptions()` helper (`BoulderJudging.vue:24`, `cpChoices`), but then discards the `label` field from each option when building display text.
- `BoulderJudging.vue:62` has a third spot: the post-record toast — `toaster(t('judging.checkpoint_recorded_n', { n: ret.checkpoint }))` — again from the raw position, not a label.

So patching `checkpointOptions()` alone (what the spec's sample code shows) changes nothing a user sees. This plan fixes the helper **and** all four real render sites (two in `CheckpointRow.vue`, two in `BoulderJudging.vue`), reusing one new shared helper instead of duplicating the `label-or-fallback` rule four times (the spec explicitly prefers a shared helper over a second drifting copy, stated for the `BoulderJudging.vue` case — the same reasoning applies to all four sites here).

**Judgment call (deviate from the spec's literal helper code):** the spec's sample `checkpointOptions()` bakes the English string `` `Checkpoint ${i + 1}` `` into the `label` field as the fallback. Keeping that would mean every render site that now uses `opt.label` directly shows **English** "Checkpoint N" even on the Finnish locale, regressing the existing translated fallback (`fi.json` has `"checkpoint_n": "Tarkistuspiste {n}"`, actively used). Instead, `checkpointOptions()` in this plan returns the checkpoint's raw custom label (trimmed) or `null` when absent/blank, and every render site falls back to the existing translated `t('comps.checkpoint_n', ...)` only when `label` is `null`. This produces the exact same visible text as today for every unlabeled checkpoint in every locale, and shows the routesetter's label verbatim (no "Checkpoint " prefix) when one is set — matching the spec's own example ("A"/"B"/"C" *instead of* "Checkpoint 1/2/3").

## Global Constraints

- Scope is mobile-only (this repo, `f7_problemator`). The backend (`problemator_backend`) and dashboard repos have their own, separate plans — do not touch those repos.
- `label` is nullable/absent on a checkpoint; every display surface must fall back to the existing "Checkpoint N" text when `label` is null or empty — this is the one rule every surface below must follow (spec, data model section).
- Handle `label` being entirely absent from a checkpoint object (older/unmigrated payloads) exactly like `label: null` — never throw on a missing key.
- No change to checkpoint scoring, validation, or the bulk-apply flow — all backend and dashboard-only (spec non-goals).
- This repo's Vitest convention: `npm run test` (config `vitest.config.js`, `environment: 'node'`). There is no `@vue/test-utils` or jsdom in `package.json` — only plain-JS/pure-function code in `src/js/helpers/` gets an automated test in this repo's convention; `.vue` template/script changes are verified by code review and a manual `npm run dev` check, not an automated component test.
- i18n: `fallbackLocale: 'en'` is set at `src/js/app.js:74`. New translation keys in this plan are added to `en.json` and `fi.json` only (the two locales that already carry the existing checkpoint strings); the other 10 locale files fall back to English automatically and are left for translators — not an engineering task.

## Review Focus

- A blank or whitespace-only `label` (`"   "`) must be treated exactly like no label at all, everywhere — not rendered as literal whitespace. (Task 1 test.)
- A labeled checkpoint's text must never be confused with the position number or the literal `'top'` sentinel value — label lookup is by `value`, not string matching, and `'top'` always uses its own translation regardless of any label. (Task 2 tests.)
- `checkpointDisplayLabel` must not throw and must fall back to the numbered translation when `value` doesn't match any option — e.g. a judge's `cpChoices` going stale after the problem list reloads between fetching options and recording a result. (Task 2 test.)
- `<script setup>` call sites must pass the **unwrapped** computed array (`cpChoices.value`, `options.value`) into `checkpointDisplayLabel(...).find(...)` when calling it from script code; inside `<template>`, Vue auto-unwraps the same ref to a plain array. Mixing these up (passing the ref itself from script) silently breaks `.find()`. (Called out explicitly in Tasks 5 and 6's steps.)
- Every existing unlabeled competition, in every locale, must show pixel-for-pixel the same "Checkpoint N" / "Tarkistuspiste N" text after this change as before it — no automated i18n-rendering test exists in this repo, so this is a named manual-check step in Task 7, not assumed.

---

## Task 1: `checkpointOptions()` carries the raw label, not a baked-in fallback string

**Files:**
- Modify: `src/js/helpers/checkpoints.js:14-23`
- Test: `test/checkpoints.test.js:4-23`

**Interfaces:**
- Produces: `checkpointOptions(problem) -> Array<{ label: string|null, value: number|'top', points: number }>` — `label` is the checkpoint's trimmed custom label, or `null` when absent/blank (not a pre-formatted "Checkpoint N" string). The `'top'` entry keeps its existing literal `label: 'Top'` (unused for display by any caller; left as-is to minimize diff).

- [ ] **Step 1: Write the failing tests in `test/checkpoints.test.js`**

Replace the first `it` block (lines 5-13) and add two new ones, inside the existing `describe('checkpointOptions', ...)`:

```js
it('lists checkpoints in order then the top, with no label by default', () => {
  const problem = { pivot: { max_points: 25, checkpoints: [{ points: 5 }, { points: 10 }, { points: 15 }] } }
  expect(checkpointOptions(problem)).toEqual([
    { label: null, value: 1, points: 5 },
    { label: null, value: 2, points: 10 },
    { label: null, value: 3, points: 15 },
    { label: 'Top', value: 'top', points: 25 },
  ])
})
it('uses a checkpoint\'s custom label, trimmed, when set', () => {
  const problem = { pivot: { max_points: 25, checkpoints: [{ points: 5, label: 'A' }, { points: 10, label: '  C  ' }] } }
  expect(checkpointOptions(problem)).toEqual([
    { label: 'A', value: 1, points: 5 },
    { label: 'C', value: 2, points: 10 },
    { label: 'Top', value: 'top', points: 25 },
  ])
})
it('treats a blank or whitespace-only label the same as no label', () => {
  const problem = { pivot: { max_points: 25, checkpoints: [{ points: 5, label: '' }, { points: 10, label: '   ' }] } }
  expect(checkpointOptions(problem).map((o) => o.label)).toEqual([null, null, 'Top'])
})
```

Leave the other two existing `it` blocks (`'offers only the top when there are no checkpoints'`, `'copes with a problem that has no pivot'`) unchanged — they don't reference `label` and already pass.

- [ ] **Step 2: Run tests to verify the new/changed ones fail**

Run: `npm run test -- checkpoints`
Expected: FAIL on the three checkpoint-label assertions above (current code returns `label: 'Checkpoint 1'` etc., not `null`/`'A'`/`'C'`).

- [ ] **Step 3: Implement the new `checkpointOptions` body in `src/js/helpers/checkpoints.js:14-23`**

```js
export function checkpointOptions(problem) {
  const pivot = problem?.pivot ?? {}
  const options = (pivot.checkpoints ?? []).map((c, i) => ({
    label: typeof c.label === 'string' && c.label.trim() !== '' ? c.label.trim() : null,
    value: i + 1,
    points: Number(c.points),
  }))
  options.push({ label: 'Top', value: 'top', points: Number(pivot.max_points ?? 0) })
  return options
}
```

Update the function's doc comment (`checkpoints.js:7-13`) to mention `label` is the routesetter's custom checkpoint label or `null`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- checkpoints`
Expected: PASS, all `checkpointOptions` and other existing `describe` blocks in the file green.

- [ ] **Step 5: Commit**

```bash
git add src/js/helpers/checkpoints.js test/checkpoints.test.js
git commit -m "feat: checkpointOptions carries a checkpoint's raw custom label"
```

---

## Task 2: Shared `checkpointDisplayLabel(options, value, t)` helper

**Files:**
- Modify: `src/js/helpers/checkpoints.js` (add new exported function after `checkpointOptions`, i.e. after line 23)
- Test: `test/checkpoints.test.js` (new `describe` block)

**Interfaces:**
- Consumes: the `options` array shape produced by Task 1's `checkpointOptions` (`{ label: string|null, value: number|'top', points: number }[]`).
- Produces: `checkpointDisplayLabel(options: Array<{label, value}>, value: number|'top', t: (key: string, params?: object) => string) -> string` — the single function every render site in Tasks 3/5 (picker buttons) and Tasks 4/6 (status line / toast) calls to get display text for one checkpoint position. `t` is whatever translator function the caller already has (vue-i18n's `t`, or a test stub).

- [ ] **Step 1: Write the failing tests**

Add to `test/checkpoints.test.js`, after the `checkpointOptions` describe block:

```js
describe('checkpointDisplayLabel', () => {
  const t = (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key)
  const options = [
    { label: 'A', value: 1, points: 5 },
    { label: null, value: 2, points: 10 },
    { label: 'Top', value: 'top', points: 25 },
  ]
  it('always uses the top translation for value "top", ignoring any label', () => {
    expect(checkpointDisplayLabel(options, 'top', t)).toBe('comps.top')
  })
  it('returns a labeled checkpoint\'s label verbatim, ignoring the translator', () => {
    expect(checkpointDisplayLabel(options, 1, t)).toBe('A')
  })
  it('falls back to the numbered translation for an unlabeled checkpoint', () => {
    expect(checkpointDisplayLabel(options, 2, t)).toBe('comps.checkpoint_n:{"n":2}')
  })
  it('falls back to the numbered translation when value matches no option', () => {
    expect(checkpointDisplayLabel(options, 99, t)).toBe('comps.checkpoint_n:{"n":99}')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- checkpoints`
Expected: FAIL with `checkpointDisplayLabel is not a function` (not yet exported).

- [ ] **Step 3: Implement `checkpointDisplayLabel` in `src/js/helpers/checkpoints.js`**

```js
/**
 * Display text for one checkpoint position: the routesetter's custom label
 * when set, otherwise the localized 'Checkpoint N' fallback (unchanged from
 * before labels existed). value === 'top' always uses the dedicated 'Top'
 * translation, ignoring any label — matches today's behavior.
 */
export function checkpointDisplayLabel(options, value, t) {
  if (value === 'top') return t('comps.top')
  const opt = options.find((o) => o.value === value)
  return opt?.label || t('comps.checkpoint_n', { n: value })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- checkpoints`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/js/helpers/checkpoints.js test/checkpoints.test.js
git commit -m "feat: add shared checkpointDisplayLabel helper"
```

---

## Task 3: `CheckpointRow.vue` picker buttons use the shared helper

**Files:**
- Modify: `src/components/comps/CheckpointRow.vue:37` (import), `CheckpointRow.vue:49` (the `label` function)

**Interfaces:**
- Consumes: `checkpointDisplayLabel(options, value, t)` from Task 2, and `options` (the `computed` at `CheckpointRow.vue:48`, already built from `checkpointOptions(props.problem)` per Task 1).
- Produces: no new exports; `CompetitionEntry.vue` and `PublicCompetitionEntry.vue` need zero changes — confirmed they only pass `problem`/`my-checkpoint`/`has-top`/`disabled` props into `<check-point-row>` (`CompetitionEntry.vue:117-126`, `PublicCompetitionEntry.vue:118-125`) and render no other "Checkpoint" text themselves.

- [ ] **Step 1: Update the import at `CheckpointRow.vue:37`**

```js
import { checkpointOptions, checkpointDisplayLabel } from '@helpers/checkpoints.js'
```

- [ ] **Step 2: Replace the `label` function at `CheckpointRow.vue:49`**

```js
const label = (opt) => checkpointDisplayLabel(options.value, opt.value, t)
```

(`options` is the existing `computed(() => checkpointOptions(props.problem))` at line 48; `.value` unwraps it for use inside this plain function, matching the constraint in Review Focus.)

- [ ] **Step 3: Verify manually — no automated component test exists for this file (no `@vue/test-utils`/jsdom in this repo's Vitest setup, per Global Constraints)**

Run: `npm run dev`, open a `checkpoint_points` competition's entry screen with at least one problem whose pivot has a labeled checkpoint (or temporarily hardcode one in the component for the check), confirm the picker button shows the label text (e.g. "A (5)") instead of "Checkpoint 1 (5)", and that an unlabeled checkpoint on the same screen still shows "Checkpoint 2 (10)" unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/comps/CheckpointRow.vue
git commit -m "feat: checkpoint picker buttons show the routesetter's label"
```

---

## Task 4: `CheckpointRow.vue` "reached" status line uses the label

**Files:**
- Modify: `src/components/comps/CheckpointRow.vue:19` (template), add one `computed` in `<script setup>`
- Modify: `src/js/i18n/locales/en.json` (add one key in the `comps` block, near line 168)
- Modify: `src/js/i18n/locales/fi.json` (add the matching key in the `comps` block, near line 150)

**Interfaces:**
- Consumes: `options` (same computed as Task 3), `props.myCheckpoint` (`CheckpointRow.vue:41`, a `Number|null`).
- Produces: new i18n key `comps.checkpoint_label_reached` (`"{label} reached"` / `"{label} saavutettu"`), used only here.

- [ ] **Step 1: Add the new i18n keys**

In `src/js/i18n/locales/en.json`, in the `comps` object, immediately after the `"checkpoint_reached": "Checkpoint {n} reached",` line (currently line 168):

```json
"checkpoint_label_reached": "{label} reached",
```

In `src/js/i18n/locales/fi.json`, in the `comps` object, immediately after `"checkpoint_reached": "Tarkistuspiste {n} saavutettu",` (currently line 150):

```json
"checkpoint_label_reached": "{label} saavutettu",
```

(No automated test for JSON locale files in this repo's convention — verified by Step 3's manual check and by the app not crashing on a missing-key warning in the dev console.)

- [ ] **Step 2: Add a `reachedLabel` computed in `CheckpointRow.vue`'s `<script setup>`, after the existing `options` computed (line 48)**

```js
const reachedLabel = computed(() => options.value.find((o) => o.value === props.myCheckpoint)?.label ?? null)
```

- [ ] **Step 3: Update the template at `CheckpointRow.vue:19`**

Replace:
```html
<span v-else-if="myCheckpoint" class="font-bold text-indigo-600">{{ t('comps.checkpoint_reached', { n: myCheckpoint }) }}</span>
```
with:
```html
<span v-else-if="myCheckpoint" class="font-bold text-indigo-600">{{ reachedLabel ? t('comps.checkpoint_label_reached', { label: reachedLabel }) : t('comps.checkpoint_reached', { n: myCheckpoint }) }}</span>
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, select a labeled checkpoint on the entry screen and confirm the status line reads e.g. "A reached"; select an unlabeled one and confirm it still reads "Checkpoint 2 reached" exactly as before.

- [ ] **Step 5: Commit**

```bash
git add src/components/comps/CheckpointRow.vue src/js/i18n/locales/en.json src/js/i18n/locales/fi.json
git commit -m "feat: show the checkpoint's label in the reached status line"
```

---

## Task 5: `BoulderJudging.vue` picker buttons use the shared helper

**Files:**
- Modify: `src/components/judging/BoulderJudging.vue:7` (import), `BoulderJudging.vue:234` (template)

**Interfaces:**
- Consumes: `checkpointDisplayLabel` from Task 2; `cpChoices` (the existing `computed(() => checkpointOptions(cpProblem.value))` at `BoulderJudging.vue:24`).

- [ ] **Step 1: Update the import at `BoulderJudging.vue:7`**

```js
import { checkpointOptions, checkpointDisplayLabel, CHECKPOINT_TYPES } from '@helpers/checkpoints.js'
```

- [ ] **Step 2: Update the template at `BoulderJudging.vue:234`**

Replace:
```html
{{ opt.value === 'top' ? t('comps.top') : t('comps.checkpoint_n', { n: opt.value }) }} ({{ opt.points }})
```
with:
```html
{{ checkpointDisplayLabel(cpChoices, opt.value, t) }} ({{ opt.points }})
```

(This is inside the `<template>`, where `cpChoices` — a computed ref — is auto-unwrapped to its plain array by Vue, so passing it bare here is correct; contrast with Task 6's script-side call, which needs `cpChoices.value`.)

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, open the judging sheet (`/competitions/{id}/judging`) for a `checkpoint_points` competition, pick a problem with a labeled checkpoint, confirm the button shows the label (e.g. "B (10)"); confirm an unlabeled checkpoint on the same problem still shows "Checkpoint 2 (10)".

- [ ] **Step 4: Commit**

```bash
git add src/components/judging/BoulderJudging.vue
git commit -m "feat: judge checkpoint picker shows the routesetter's label"
```

---

## Task 6: `BoulderJudging.vue` "recorded" toast uses the label

**Files:**
- Modify: `src/components/judging/BoulderJudging.vue:59-66` (the `.then` callback in `pickCheckpoint`)
- Modify: `src/js/i18n/locales/en.json` (add one key in the `judging` block, near line 87)
- Modify: `src/js/i18n/locales/fi.json` (add the matching key in the `judging` block, near line 79)

**Interfaces:**
- Consumes: `checkpointDisplayLabel` (Task 2), `cpChoices` (Task 5's import/computed, already present).
- Produces: new i18n key `judging.checkpoint_recorded_label` (`"{label} recorded"` / `"{label} tallennettu"`), used only here. The existing `judging.checkpoint_recorded_n` key is left in place, now unused by this call site but harmless (not removed — may be referenced elsewhere; out of scope to chase).

- [ ] **Step 1: Add the new i18n keys**

In `src/js/i18n/locales/en.json`, in the `judging` object, immediately after `"checkpoint_recorded_n": "Checkpoint {n} recorded",` (currently line 87):

```json
"checkpoint_recorded_label": "{label} recorded",
```

In `src/js/i18n/locales/fi.json`, in the `judging` object, immediately after `"checkpoint_recorded_n": "Tarkistuspiste {n} tallennettu",` (currently line 79):

```json
"checkpoint_recorded_label": "{label} tallennettu",
```

- [ ] **Step 2: Update the `.then` callback at `BoulderJudging.vue:59-66`**

Replace:
```js
.then((ret) => {
  // Show what the server stored (it keeps the highest), not what was tapped.
  if (ret && ret.ok === true && ret.checkpoint != null) {
    toaster(t('judging.checkpoint_recorded_n', { n: ret.checkpoint }))
  } else {
    toaster(ret?.message || t('judging.checkpoint_failed'))
  }
})
```
with:
```js
.then((ret) => {
  // Show what the server stored (it keeps the highest), not what was tapped.
  if (ret && ret.ok === true && ret.checkpoint != null) {
    const label = checkpointDisplayLabel(cpChoices.value, ret.checkpoint, t)
    toaster(t('judging.checkpoint_recorded_label', { label }))
  } else {
    toaster(ret?.message || t('judging.checkpoint_failed'))
  }
})
```

(This runs inside `<script setup>`, not the template, so `cpChoices.value` — not bare `cpChoices` — per the Review Focus note on ref unwrapping.)

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, from the judging sheet record a labeled checkpoint for a contender, confirm the toast reads e.g. "B recorded"; record an unlabeled one and confirm it reads "Checkpoint 2 recorded" exactly as before.

- [ ] **Step 4: Commit**

```bash
git add src/components/judging/BoulderJudging.vue src/js/i18n/locales/en.json src/js/i18n/locales/fi.json
git commit -m "feat: judge checkpoint-recorded toast shows the routesetter's label"
```

---

## Task 7: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, including every `checkpoints.test.js` case from Tasks 1-2.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no new lint errors in `src/js/helpers/checkpoints.js`, `src/components/comps/CheckpointRow.vue`, `src/components/judging/BoulderJudging.vue`.

- [ ] **Step 3: Manual sanity pass across every surface this plan touched**

Using `npm run dev`, with one `checkpoint_points` competition that has at least one problem with a mix of labeled and unlabeled checkpoints (set via the backend/dashboard directly in the DB if the dashboard side of this feature isn't built yet — this plan does not depend on the dashboard or backend tasks landing first, only on the data shape in `pivot.checkpoints` already matching `{points, label}`):
  - Climber entry screen (`CompetitionEntry.vue`): picker buttons and "reached" status line show labels, unlabeled checkpoints unchanged.
  - Public entry screen (`PublicCompetitionEntry.vue`): same check (read-only picker, `disabled="true"` per `PublicCompetitionEntry.vue:123`, but button text still goes through the same `label()` function).
  - Judging sheet (`BoulderJudging.vue`): picker buttons and the post-record toast show labels, unlabeled checkpoints unchanged.
  - Switch the app to the Finnish locale and repeat the unlabeled-checkpoint checks — confirm "Tarkistuspiste N" / "... saavutettu" / "... tallennettu" still appear unchanged (this is the one check with no automated coverage, called out in Global Constraints and Review Focus).

- [ ] **Step 4: Commit (only if Step 2 required fixes)**

```bash
git add -A
git commit -m "fix: lint cleanup for checkpoint label work"
```
