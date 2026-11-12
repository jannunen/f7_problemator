import { toWrite, hasUnknownCounts, highestReached } from './ladder.js'

/**
 * Coalesces ladder writes per route so taps stay instant.
 *
 * The ladder is written as a FULL state (idempotent), so rapid `+ try` taps
 * only need the latest state sent: queue() restarts a short timer and the
 * newest state wins. Writes for one route never overlap; a state queued while
 * one is in flight goes out after it. `replace` (needed when the state went
 * DOWN, i.e. after an undo) sticks until a write carrying it succeeds.
 *
 * Injected I/O keeps this testable without Vue or the network:
 *   save(pid, write, replace) -> Promise<response>   write = { checkpoint, attempts, zone_tries }
 *   restoreLegacy(pid, checkpoint) -> Promise<response>
 *       For a state with zone counts the server never had (old data reached
 *       again by undo): it cannot be a full-state write, so the caller clears
 *       the row and writes the bare checkpoint, the way old clients did.
 *   onSaved(pid, response, sentState)
 *   onFailed(pid, error, sentState)
 */
export function createLadderSync({
  save,
  restoreLegacy,
  onSaved = () => {},
  onFailed = () => {},
  delay = 500,
  timers = { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (id) => clearTimeout(id) },
}) {
  const routes = new Map()
  const route = (pid) => {
    if (!routes.has(pid)) routes.set(pid, { timer: null, target: null, replace: false, chain: Promise.resolve(), inflight: 0 })
    return routes.get(pid)
  }

  const send = (pid) => {
    const r = route(pid)
    if (r.timer != null) {
      timers.clearTimeout(r.timer)
      r.timer = null
    }
    if (r.target == null) return r.chain
    const state = r.target
    const replace = r.replace
    r.target = null
    r.inflight++
    r.chain = r.chain.then(async () => {
      let response
      try {
        response = hasUnknownCounts(state)
          ? await restoreLegacy(pid, highestReached(state))
          : await save(pid, toWrite(state), replace)
      } catch (err) {
        r.inflight--
        onFailed(pid, err, state)
        return
      }
      r.inflight--
      // Only clear replace if nothing newer asked for it meanwhile.
      if (replace && r.target == null) r.replace = false
      onSaved(pid, response, state)
    })
    return r.chain
  }

  return {
    /** Remember `state` as the one to send for `pid`; sends after `delay` ms of quiet. */
    queue(pid, state, { replace = false } = {}) {
      const r = route(pid)
      r.target = state
      r.replace = r.replace || replace
      if (r.timer != null) timers.clearTimeout(r.timer)
      r.timer = timers.setTimeout(() => send(pid), delay)
    },
    /** Send whatever is queued for `pid` now; resolves when every write for it has settled. */
    flush(pid) {
      return send(pid)
    },
    /** A write for `pid` is waiting or in flight. */
    isBusy(pid) {
      const r = routes.get(pid)
      return !!r && (r.timer != null || r.target != null || r.inflight > 0)
    },
    /** Something newer than `state` is queued for `pid` (so don't adopt a response over it). */
    hasQueued(pid) {
      const r = routes.get(pid)
      return !!r && r.target != null
    },
    /** Send everything still queued now (e.g. the page goes away: taps must not be lost). */
    flushAll() {
      return Promise.all([...routes.keys()].map((pid) => send(pid)))
    },
  }
}
