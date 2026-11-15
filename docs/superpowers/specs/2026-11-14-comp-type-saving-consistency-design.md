# Competition self-entry saving consistency — design

**For agentic workers:** REQUIRED SUB-SKILL: superpowers:writing-plans, then superpowers:subagent-driven-development.

## Intent and why

This session fixed one instance of a bug class for `ifsc_2024_bouldering`: a climber's
self-entry save always wrote a full `problemator_tick` row (`tries >= 1`, forced by
`compTickTries()`'s `minOneTries`), even when the climber had only reached a zone, not
the actual Top. Since `problemator_tick` is the app-wide ascent ledger (ranking points,
badges — not scoped to competitions), that phantom row got scored, ranked, and badged as
a genuine flash Top it never was.

An audit (this session, opus) of the other 7 competition types found the same bug class,
in two different shapes, across 4 more types, plus confirmed the `ifsc_2024_bouldering`
mobile fix was designed (approved earlier this session) but never executed:

| Type | Shape of the bug |
|---|---|
| `ifsc_2024_bouldering` | Mobile-only gap. Backend fallback (merged) is correct; mobile's ladder still always calls `doTick`, so the fallback never engages. |
| `traditional` | Same as ifsc_2024: a bonus-only (not topped) entry can't even be expressed by the mobile UI — pressing Save always writes `tries>=1`, scored as a top. Backend scoring is already correct (`if ($ttop != 0) amountTops += 1`, `BoulderTopsAndZones.php`). |
| `ifsc_2018_bouldering` | Identical to `traditional` — same two fields (`tries`, `tries_bonus`), same mobile gap, same already-correct backend formula (`IFSC2018Bouldering.php:189`). |
| `flashcomp` | Both ends broken. Mobile has the same gap. Backend additionally miscounts: `FlashComp.php`'s per-ascent loop increments `totalTops` and `totalBonuses` unconditionally for every row the SQL returns (SQL keeps `tries >= 0`), so even a judge-entered `tries=0` bonus-only row double-counts as both a bonus AND a top. |
| `sport` | Different shape. The *competition* result is correct (`Sport.php` reads `sport_points` directly, not `tries`). But every self-entered height — topped or not — writes a tick with `tries=1` (forced the same way), and `RankingService::tryModifier()`/`ProblemService::calculateModifier()` treat `tries==1` as a one-try flash, inflating the climber's *global* ranking and badges for routes they never actually topped. |

`predefined_plus_flashcomp`, `variable_points`, `fixed_points_best_n` have no partial-credit
concept at all (just "how many tries did the completed ascent take") and are not at risk —
their SQL already filters `tries > 0`. Out of scope below.

## Goals

- A self-entry save for `traditional`, `ifsc_2018_bouldering`, `ifsc_2024_bouldering`,
  and `flashcomp` can record "reached the bonus/zone, did not top" without that ever
  being scored, ranked, or badged as a top.
- Finish the already-approved, never-executed `ifsc_2024_bouldering` mobile fix (delete
  `zoneLadder.js`'s plumbing, wire it through the real `useCheckpointLadders`/
  `comp_checkpoint_result` system that `checkpoint_points` already uses correctly).
- `flashcomp`'s backend stops counting a `tries=0` row as a top or a bonus.
- A `sport`-type self-entry that does not reach the top (`sport_points != 1000`) no
  longer inflates the climber's global ranking/badges, while the competition's own
  scoring (which needs every height, topped or not) keeps working exactly as today.
- Every type's scoring keeps the invariant judge/legacy ticks already rely on: a genuine
  tick, whenever one exists for a climber+problem, is authoritative; the side-effect-free
  partial store only fills in when there is no tick at all.

## Non-goals / anti-goals

- No change to `predefined_plus_flashcomp`, `variable_points`, `fixed_points_best_n`,
  or `checkpoint_points` — they're already correct or not at risk.
- No change to the judge path's own ability to write `tries=0` bonus-only rows directly
  (`CompetitionsController::addAscent`) — that path is already correct by construction
  (a judge can and does enter exactly what happened); only the *self-entry* mobile path
  is being fixed.
- No change to `RankingService`'s `tryModifier` formula itself, or to badge logic, beyond
  what's needed to stop a non-topped sport entry from reaching them at all.
- No retroactive fix of already-written bad data (existing phantom tops from any of
  these types before this ships). Out of scope; the user can decide separately whether a
  one-off cleanup script is worth running.
- No change to `compTickTries()`'s `minOneTries` behavior itself, or to any other
  consumer of `problemator_tick` — ~30 files read it; this unit only changes which
  competition flows write to it and when.

## Constraints

- `comp_checkpoint_result` (`CheckpointResult` model) is the proven, side-effect-free
  store already used correctly by `checkpoint_points` and (backend-side) by
  `ifsc_2024_bouldering`. Reuse it rather than inventing a second mechanism, for every
  type whose partial-credit shape fits it (a rung reached, with an attempt count).
- `sport`'s partial value (`sport_points`, e.g. `25.25` for "25+") is a single continuous
  score, not a rung ladder — it doesn't fit `comp_checkpoint_result`'s zone/rung shape
  the way bouldering-style bonus/zone credit does. Needs its own small accommodation
  (see Approaches).
- `CheckpointRecorder::isCheckpointComp()` / `record()`'s zone-count switch already
  special-cases comp types that don't have routesetter-configured checkpoints
  (`ifsc_2024_bouldering => 2`). Extending it to `ifsc_2018_bouldering`, `traditional`,
  `flashcomp` (each `=> 1`, a single bonus/zone rung) is a direct extension of an
  existing, reviewed pattern — not a new concept.
- Mobile's `useCheckpointLadders.js` is already rung-count-agnostic
  (`zones: prob?.pivot?.checkpoints?.length ?? 0`), but needs the zone count and the
  save/delete dispatch overridable per comp type — this was already scoped as Task 1 of
  the unexecuted `ifsc_2024_bouldering` mobile plan; this unit extends that same task to
  cover 1-rung types too.
- `CheckpointLadder.vue`'s `options` prop already supports a fixed label/points override
  (built for `ifsc_2024_bouldering`'s 3-rung ladder). A 2-rung (bonus + top) and 1-rung
  config are smaller instances of the same mechanism, not new work on that component.
- Backend test suite currently: 1156 passed, 0 failed (`/private/var/sites/problemator_backend`,
  branch `main` as of this unit's start). Mobile: 450 passed, 0 failed.

## Approaches considered

### For traditional / ifsc_2018_bouldering / ifsc_2024_bouldering / flashcomp (bonus-or-zone + top)

**Chosen: port the proven `checkpoint_points` pattern.** Mobile writes bonus/zone taps to
`comp_checkpoint_result` via the ladder (no tick, no side effect); a real `problemator_tick`
is written only when the climber taps Top. Backend's `getAllAscentsInComp`-equivalent
query for each type gets the same two-query merge `IFSC2024Bouldering.php` already has:
tick wins when one exists; `comp_checkpoint_result` fills in only for climber+problem
pairs with no tick. `flashcomp` additionally gets its unconditional-increment bug fixed
(guard both `totalTops`/`totalBonuses` increments on the field being nonzero) regardless
of where the row came from — that part is a pure correctness fix, needed whether the row
is judge- or self-entered.

This is the only approach considered in depth: it's the exact architecture this session
already designed, reviewed, and shipped once; re-deriving a different mechanism per type
would be pure risk for no benefit. The only real decision per type is the ladder's rung
count and labels (1 rung "Bonus" for traditional/ifsc_2018/flashcomp; 2 rungs "Low
zone"/"High zone" already decided for ifsc_2024, unchanged).

### For sport (continuous height, not a rung ladder)

**A. Reuse `comp_checkpoint_result`, encoding the score into the existing integer
`checkpoint` column.** **Ruled out by the builder-check:** `checkpoint` is
`unsignedTinyInteger` (max 255); `25.25` encodes to `2525`, which overflows, and no
encoding scheme rescues this (even quarter-hold precision overflows past hold 64). "No
migration" was never actually true for this approach.

**B. Add a nullable decimal column to `comp_checkpoint_result`** (e.g. `score_value`)
instead of overloading `checkpoint`. Clearer column semantics, no decode-by-dividing
trick — but a schema migration for one comp type's one field, and the table already has
an integer `checkpoint` that's semantically "the single thing reached," which an encoded
sport height genuinely is.

**C. Leave the tick written as today, exclude non-topped sport-comp ticks from
`RankingService`/badges by querying competition context at ranking time** (join to
`comp_comp`/`problemator_problem_in_comp` to check "is this problem currently in a
`sport`-type comp and was this tick's `sport_points` < 1000"). No new storage, but adds
join complexity to ranking code that runs hourly over the whole ticks table, for a type
this gym likely uses rarely — the wrong place to add an ongoing cost for a self-entry
edge case.

**Chosen: B.** The migration is small (one nullable decimal column, used by one comp
type), and every other advantage of the original plan still holds: tick-is-authoritative-
else-checkpoint-fills-in, `RankingService`/`BadgeService` completely untouched (a
non-topped sport attempt simply never reaches them, same as a non-topped bouldering zone
attempt never does today). **This means the backend schema must be hand-applied in
production before this branch merges to `main`** (this project's existing
merge-to-main-deploys convention) — a deploy step, not left implicit.

## Decided design

### Backend

- `CheckpointRecorder::isCheckpointComp()`: widen to
  `in_array($comp->tyyppi, ['checkpoint_points', 'ifsc_2024_bouldering', 'ifsc_2018_bouldering', 'traditional', 'flashcomp', 'sport'], true)`.
- `CheckpointRecorder::record()`'s `$count` switch: `ifsc_2024_bouldering => 2`;
  `ifsc_2018_bouldering`, `traditional`, `flashcomp`, `sport` → `1` (single rung); else
  the existing `count($pic->checkpoints ?? [])`.
- Migration: add a nullable `score_value DECIMAL(6,2)` column to `comp_checkpoint_result`
  — used only by `sport` rows, holding the raw (unencoded) `sport_points` value. Must be
  hand-applied to the production schema before this branch merges to `main`.
- `sport`'s record path is its own small variant of `CheckpointRecorder::record()`, not
  forced through the rung-count/`checkpoint`-value validation the other 5 types share
  (that validation means "which rung, 0..count" — meaningless for a continuous score).
  It writes `score_value` directly, validated only as a non-negative number less than
  the comp's top sentinel (1000). Builder confirms the cleanest way to share code with
  `record()` (a separate method vs. a branch inside it) without distorting the existing
  rung validation for the other types.
- `saveTop`'s contract gains an optional third argument carrying whatever reached-rung
  data the caller needs written onto the tick alongside `tries` (see Mobile, below, and
  the "bonus credit on Top" decision). `checkpoint_points`' own `saveTop` callback is
  unaffected — it ignores the new argument, since its scoring already treats top and
  checkpoint credit as mutually exclusive (never additive).
- **Bonus credit when Top is tapped (traditional / ifsc_2018_bouldering / flashcomp):**
  these three types' scoring is additive (`bonus points + top points`), computed from
  the TICK's own `tries`/`tries_bonus` fields once a tick exists (the checkpoint fallback
  never engages for a climber+problem that has a tick). So saving a Top must also write
  `tries_bonus` onto that same tick, or the additive formula silently loses the bonus
  (and, per `($totalBonuses - $totalTops) * 3`, actively penalizes it). Decided: Top
  always implies the bonus was reached, since reaching the route's one lower bonus hold
  is physically required to reach the top above it (the same "a higher rung implies
  every lower rung" invariant `ladder.js` already enforces for `checkpoint_points`'
  multi-rung ladders). Concretely: if the bonus rung was tapped before Top, its own
  recorded try count becomes the tick's `tries_bonus`; if Top is tapped directly without
  a separate bonus tap, `tries_bonus` is set equal to `tries` (reached together). Editing
  the bonus rung's count after a Top re-saves the tick with the corrected `tries_bonus` —
  the same `retop()` correction path `useCheckpointLadders.js` already has for a
  corrected `topTries`, extended to also fire on a post-top bonus edit.
- **`flashcomp`'s points, not just its counts, need the same zero-guard.**
  `defineFlashPoints(0, ...)` currently falls through to the `pointsharing['other']`
  bucket, so even once `totalTops`/`totalBonuses` are guarded (above), a `tries=0` row
  would still add top/bonus *points* as if it were real. Guard `totalPointsTop`/
  `totalPointsBonus` the same way: only add `$ptop` when `tries != 0`, only add `$pbonus`
  when `tries_bonus != 0`. Since results are computed live from ticks (never frozen),
  this is a scoring correction that applies to all data, past and future — any existing
  flashcomp with a judge-entered `tries=0` row (the only way one could exist before this
  change; mobile self-entry couldn't send one) will show a corrected, lower standing for
  that climber. That is the intended fix, not a side effect to avoid.
- Each of `IFSC2018Bouldering.php`, `BoulderTopsAndZones.php` (traditional),
  `FlashComp.php` (results class), `Sport.php`: add the same fallback merge
  `IFSC2024Bouldering.php::getAllAscentsInComp` already has — tick wins; for
  climber+problem pairs with no tick, read `comp_checkpoint_result` and synthesize the
  equivalent of a bonus-only / partial-height ascent row from it.
- `FlashComp.php`: additionally guard both increments
  (`if ($ascent['tries'] != 0) totalTops += 1`, `if ($ascent['tries_bonus'] != 0) totalBonuses += 1`)
  — a pure correctness fix independent of the fallback, since a judge can already write
  `tries=0` today and it's currently mis-scored.
- Judge path (`CompetitionsController::addAscent`) is untouched — it already writes
  correctly-shaped rows; only self-entry changes.

### Mobile

- `useCheckpointLadders.js` (already-approved, unexecuted Task 1 of the prior mobile
  plan): `zonesFor`, `saveCheckpoint`, `deleteCheckpoint` become optional injectable
  params, each defaulting to today's exact behavior (so `checkpoint_points`, the only
  current real caller, is unaffected).
- `CompetitionEntry.vue` and `PublicCompetitionEntry.vue`: for
  `ifsc_2024_bouldering`, `ifsc_2018_bouldering`, `traditional`, `flashcomp` — replace
  each type's current branch (old 3-rung `zoneLadder.js`-based ladder for ifsc_2024; the
  `isTriesAndBonusType` stepper pair for the other three) with a `CheckpointLadder`
  instance wired through `useCheckpointLadders`, using an `options` override for each
  type's rung labels/points (ifsc_2024: Low zone/High zone/Top, unchanged values;
  ifsc_2018/traditional/flashcomp: a single "Bonus" rung + Top, with each type's own
  point values read from the comp same as today).
- `sport`: keeps its existing height text-field input (no ladder — a continuous value
  has no rungs to tap), but its Save path changes: a non-topped height dispatches a save
  of the raw `sport_points` value to `comp_checkpoint_result`'s new `score_value` column
  instead of `doTick`; reaching `sport_points === 1000` dispatches the real tick save,
  same as today. Exact UI wiring (does the existing text field's `@change` now call a
  different handler, or does the generic Save button branch on the entered value) is
  left to the builder — the constraint is just "a tick is written if and only if the
  entry is a genuine top."
- `traditional` / `ifsc_2018_bouldering` / `flashcomp`'s `saveTop` callbacks pass the
  ladder's recorded bonus-rung tries (or, if the bonus rung was never separately tapped,
  the same tries as the top) as `saveTop`'s new third argument, so the tick's
  `tries_bonus` is written correctly alongside `tries` — see the backend "bonus credit on
  Top" decision above. `ifsc_2024_bouldering`'s own `saveTop` callback ignores it (its
  scoring already ignores zone fields once a tick exists).
- `zoneLadder.js` and its test file: deleted once nothing references them (last step,
  after grepping for remaining references) — this was already the prior plan's Task 4
  final step; now also confirm `ifsc_2018_bouldering`/`traditional`/`flashcomp` never
  adopted it either (they didn't; they used the stepper pair, not this file).
- `PublicCompetitionEntry.vue`'s existing asymmetry (its own Save button shows
  unconditionally for `checkpoint_points` because that page's ladder is read-only there)
  is unchanged for `checkpoint_points`; the four newly-wired types get the same
  Save/delete-icon hiding treatment `ifsc_2024_bouldering` was already going to get in
  the prior plan (hidden once the ladder owns the save).

## Review focus (for the plan)

1. A zone/bonus-only save for any of the four rung types never writes a `problemator_tick`
   row (direct regression test per type, mirroring the one already proven for
   `ifsc_2024_bouldering`'s backend).
2. A genuine top for any of the four rung types still scores exactly as before (the tick
   wins over any stale/earlier checkpoint row).
3. `flashcomp`'s `tries=0`-counts-as-both-a-top-and-a-bonus defect has its own regression
   test independent of the fallback mechanism (a judge-entered `tries=0` row, no
   checkpoint fallback involved).
4. A `sport` entry under 1000 points writes to `comp_checkpoint_result`, not
   `problemator_tick` — and does NOT appear in `RankingService`'s top-10/flash-bonus
   calculation for that climber (a real ranking-level test, not just "no tick row").
5. `checkpoint_points` itself (the reference type, untouched by this unit) keeps passing
   its full existing test suite — the shared `useCheckpointLadders.js`/`CheckpointRecorder`
   changes must not regress the one type that already worked.
6. A Top saved via the ladder for `traditional`/`ifsc_2018_bouldering`/`flashcomp`
   correctly carries `tries_bonus` onto the tick (both "bonus tapped first, then top" and
   "top tapped directly" cases), and scores the full bonus-plus-top total — not the
   `(bonuses - tops) * 3` penalty the bug produced today.
7. A Bonus/zone/height self-entry outside the competition's timespan is refused (400,
   "not ongoing") for all five newly-wired types, matching `checkpoint_points`' existing
   behavior — decided explicitly with the user; Top self-entry's own lack of timespan
   enforcement (`TickController::isUserPartOfCompetition`'s standing `// TBD` comment) is
   a separate, pre-existing gap this unit does not touch.

## What's left to the builder

- Exact mobile UI treatment for `sport`'s non-topped save dispatch (text field `@change`
  vs Save button branch) — constraint given above, mechanism is the builder's call.
- Exact threading of `sport`'s encoded value through `CheckpointRecorder`'s validation
  (flagged above as not fully decided here).
- Exact rung label/point values read per type for the new 1-rung ladders — read from
  each comp's existing config the same way `ifsc_2024_bouldering`'s ladder already does
  (not hardcoded), builder confirms the exact source field per type during
  implementation.
