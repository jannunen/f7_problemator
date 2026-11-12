/**
 * Zone tries ("the ladder") for checkpoint competitions: a pure state machine,
 * no Vue, no I/O. CheckpointLadder.vue renders it, CompetitionEntry.vue syncs
 * it with the server.
 *
 * Counting is IFSC style: ONE running attempt counter per route, and each zone
 * remembers the count at which it was reached ("zone 1 in 2, zone 2 in 4, top
 * in 7"). Tries never change points; the backend uses them only to break ties.
 *
 * Rungs are 1-based. Rungs 1..zones are the route's checkpoints (zones); rung
 * zones + 1 is the Top. The Top itself is recorded through the ordinary tick
 * path with tries = attempts, so `topped`/`topTries` mirror that tick.
 *
 * State shape (plain object, treated as immutable: every action returns a new one):
 *   zones     number of checkpoints on the route
 *   attempts  running attempt total (includes failed attempts)
 *   reached   { [rung]: attemptCountWhenReached | null }  null = reached, count unknown (data from before zone tries existed)
 *   topped    boolean
 *   topTries  number | null
 *   active    rung being attempted (1..zones+1), null once topped
 *   history   [{ action, snapshot }]  per-session undo stack, newest last
 */

export const ACTIONS = { TRY: 'try', REACHED: 'reached', TOP: 'top' }

const toInt = (v) => {
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

/** Lowest rung not reached yet; zones + 1 (the Top) when every zone is reached. */
export function firstUnreached(state) {
  for (let r = 1; r <= state.zones; r++) {
    if (!(r in state.reached)) return r
  }
  return state.zones + 1
}

export const topRung = (state) => state.zones + 1
export const isTopRung = (state, rung) => rung === state.zones + 1

/** Highest zone reached (0 when none). The value the backend stores as `checkpoint`. */
export function highestReached(state) {
  let max = 0
  for (const k of Object.keys(state.reached)) {
    const r = toInt(k)
    if (r != null && r > max) max = r
  }
  return max
}

const snapshot = (s) => ({
  zones: s.zones,
  attempts: s.attempts,
  reached: { ...s.reached },
  topped: s.topped,
  topTries: s.topTries,
  active: s.active,
})

const withHistory = (prev, next, action) => ({
  ...next,
  history: [...(prev.history ?? []), { action, snapshot: snapshot(prev) }],
})

/**
 * Build a route's ladder from what the server knows.
 *   zones      number of checkpoints on the problem (pivot.checkpoints.length)
 *   checkpoint my_checkpoints[problemid]: highest zone reached, or null
 *   tries      my_checkpoint_tries[problemid]: { attempts, zone_tries } or null/undefined
 *   topTick    the climber's top tick for this route (comp.userticks[problemid]) or null
 *
 * Old data (checkpoint known, zone_tries null/empty, attempts 0) shows the
 * reached rungs without counts. A top implies every zone: zones the server
 * has no record of are shown reached, count unknown, unless zone_tries knows.
 */
export function fromServer({ zones = 0, checkpoint = null, tries = null, topTick = null } = {}) {
  const n = Math.max(0, toInt(zones) ?? 0)
  const reached = {}
  const zt = tries?.zone_tries
  if (zt && typeof zt === 'object' && !Array.isArray(zt)) {
    for (const [k, v] of Object.entries(zt)) {
      const r = toInt(k)
      const c = toInt(v)
      if (r != null && r >= 1 && r <= n) reached[r] = c != null && c >= 1 ? c : null
    }
  }
  const cp = Math.min(toInt(checkpoint) ?? 0, n)
  for (let r = 1; r <= cp; r++) {
    if (!(r in reached)) reached[r] = null
  }
  const topped = topTick != null
  const topTries = topped ? toInt(topTick.tries) : null
  if (topped) {
    for (let r = 1; r <= n; r++) {
      if (!(r in reached)) reached[r] = null
    }
  }
  const attempts = Math.max(0, toInt(tries?.attempts) ?? 0, topTries ?? 0)
  const state = { zones: n, attempts, reached, topped, topTries, active: null, history: [] }
  state.active = topped ? null : firstUnreached(state)
  return state
}

/** Make `rung` the one being attempted. Reached rungs and a topped route ignore it. */
export function selectRung(state, rung) {
  if (state.topped) return state
  const r = toInt(rung)
  if (r == null || r < 1 || r > topRung(state)) return state
  if (r in state.reached) return state
  if (r === state.active) return state
  return { ...state, active: r }
}

// Stamp every zone below `upTo` (inclusive) that is unreached, or reached with
// an unknown count, at `count`. The user's rule: moving on to a higher rung
// means the lower ones were completed, frozen at the tally at that moment.
const stampBelow = (state, upTo, count) => {
  const reached = { ...state.reached }
  const last = Math.min(upTo, state.zones)
  for (let r = 1; r <= last; r++) {
    if (!(r in reached) || reached[r] == null) reached[r] = count
  }
  return reached
}

/**
 * `+ try` on the active rung. ONE TAP = ONE TRY: attempts always goes up by
 * exactly one. Every zone below the active rung that is unreached, or reached
 * with an unknown count (old data), is first stamped at the current tally
 * (at least 1: a zone cannot be reached before the first attempt).
 *   0 tries, choose B, + try   -> A in 1, attempts 1
 *   2 tries on A, choose B, + try -> A in 2, attempts 3
 *   stored cp 3, {1:2}, attempts 4, + try on rung 4 -> {1:2, 2:4, 3:4}, attempts 5
 */
export function addTry(state) {
  if (state.topped || state.active == null) return state
  const reached = stampBelow(state, state.active - 1, Math.max(state.attempts, 1))
  return withHistory(state, { ...state, reached, attempts: state.attempts + 1 }, ACTIONS.TRY)
}

/**
 * `✓ reached` on the active rung: stamps it (and any lower unreached zone) at
 * the current tally, at least 1 (a ✓ with no tries yet is a flash). The next
 * unreached rung becomes active. On the Top rung this is `top`.
 */
export function markReached(state) {
  if (state.topped || state.active == null) return state
  if (isTopRung(state, state.active)) return top(state)
  const attempts = Math.max(state.attempts, 1)
  const reached = stampBelow(state, state.active, attempts)
  const next = { ...state, attempts, reached }
  next.active = firstUnreached(next)
  return withHistory(state, next, ACTIONS.REACHED)
}

/** Top ✓: stamps any unreached zone at the tally too; the top tick gets tries = attempts. */
export function top(state) {
  if (state.topped) return state
  const attempts = Math.max(state.attempts, 1)
  const reached = stampBelow(state, state.zones, attempts)
  return withHistory(
    state,
    { ...state, attempts, reached, topped: true, topTries: attempts, active: null },
    ACTIONS.TOP,
  )
}

export const canUndo = (state) => (state.history?.length ?? 0) > 0

/**
 * Undo the last action of this session. Returns { state, undone } where
 * `undone` is the action that was reverted ('try' | 'reached' | 'top') or null
 * when there was nothing to undo. Undoing 'top' means the caller removes the
 * top tick through the existing delete path.
 */
export function undo(state) {
  if (!canUndo(state)) return { state, undone: null }
  const history = state.history.slice(0, -1)
  const { action, snapshot: prev } = state.history[state.history.length - 1]
  return { state: { ...prev, reached: { ...prev.reached }, history }, undone: action }
}

/** Some reached zone has no known count (data from before zone tries existed). */
export const hasUnknownCounts = (state) => Object.values(state.reached).some((v) => v == null)

/**
 * The full-state write for the checkpoint endpoint: { checkpoint, attempts, zone_tries }.
 * checkpoint is the highest zone reached (0 when none), zone_tries an object
 * (`{}` when none). Zones with an unknown count are left out of zone_tries; a
 * state like that cannot be sent as a full-state write (see hasUnknownCounts),
 * only restored the old way (clear, then a checkpoint-only write).
 */
export function toWrite(state) {
  const zoneTries = {}
  for (const [k, v] of Object.entries(state.reached)) {
    if (v != null) zoneTries[k] = v
  }
  return {
    checkpoint: highestReached(state),
    attempts: state.attempts,
    zone_tries: zoneTries,
  }
}

/** True when two states hold the same data (ignores active rung and history). */
export function sameData(a, b) {
  if (!a || !b) return false
  const wa = toWrite(a)
  const wb = toWrite(b)
  return (
    a.topped === b.topped &&
    wa.checkpoint === wb.checkpoint &&
    wa.attempts === wb.attempts &&
    JSON.stringify(wa.zone_tries) === JSON.stringify(wb.zone_tries)
  )
}

/**
 * Adopt what the server stored after a write ({checkpoint, attempts, zone_tries})
 * while keeping this session's active rung and undo stack.
 */
export function adoptServer(state, response) {
  const fresh = fromServer({
    zones: state.zones,
    checkpoint: response?.checkpoint,
    tries: { attempts: response?.attempts, zone_tries: response?.zone_tries },
    topTick: state.topped ? { tries: state.topTries } : null,
  })
  let active = state.active
  if (fresh.topped) active = null
  else if (active == null || active in fresh.reached) active = firstUnreached(fresh)
  return { ...fresh, active, history: state.history ?? [] }
}

/** Is there anything on this ladder at all (attempts, zones, top)? */
export const isEmpty = (state) => !state.topped && state.attempts === 0 && Object.keys(state.reached).length === 0

/**
 * One row per rung, in climbing order (rung 1 first, Top last), for rendering.
 *   status 'reached' | 'active' | 'idle'
 *   count  for reached rungs: the tally when reached (null = unknown)
 */
export function rungView(state) {
  const rows = []
  for (let r = 1; r <= topRung(state); r++) {
    const isTop = isTopRung(state, r)
    let status = 'idle'
    let count = null
    if (isTop && state.topped) {
      status = 'reached'
      count = state.topTries
    } else if (!isTop && r in state.reached) {
      status = 'reached'
      count = state.reached[r]
    } else if (r === state.active) {
      status = 'active'
    }
    rows.push({ rung: r, isTop, status, count })
  }
  return rows
}

/** Tally groups for `n` attempts: [5, 5, 2] for 12. */
export function tallyGroups(n) {
  const groups = []
  let left = Math.max(0, toInt(n) ?? 0)
  while (left > 0) {
    groups.push(Math.min(5, left))
    left -= 5
  }
  return groups
}
