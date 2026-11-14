import { fromServer, toWrite, selectRung, addTry, markReached, top, undo, setReachedCount, unreach } from './ladder.js'

/**
 * ifsc_2024_bouldering's zones (low, high) as a ladder, reusing the same
 * presentation (CheckpointLadder.vue) and state machine (ladder.js) as
 * checkpoint_points — but unlike checkpoints, a zone's "reached" count here
 * lives directly on the climber's problemator_tick row (attempts_low_zone,
 * attempts_high_zone, tries), the same row used for scoring. There is no
 * side-effect-free table to auto-save every tap into, so taps stay local
 * until the existing Save button submits the whole tick — exactly how this
 * screen already behaved before the ladder, just with the ladder's visuals.
 *
 * zones is always 2: rung 1 = low zone, rung 2 = high zone, rung 3 = Top.
 */
export const ZONES = 2

/** Build a ladder state from one tick's zone/tries fields (or none yet ticked). */
export function zoneLadderFromTick({ attempts_low_zone, attempts_high_zone, tries, topped = false } = {}) {
  const low = attempts_low_zone ?? null
  const high = attempts_high_zone ?? null
  const checkpoint = high != null ? 2 : low != null ? 1 : 0
  const zoneTries = {}
  if (low != null) zoneTries[1] = low
  if (high != null) zoneTries[2] = high

  return fromServer({
    zones: ZONES,
    checkpoint,
    tries: { attempts: tries ?? 0, zone_tries: zoneTries },
    topTick: topped ? { tries: tries ?? 0 } : null,
  })
}

/** The ladder state's zones/top translated back to the tick fields doTick already sends. */
export function zoneLadderToTick(state) {
  const write = toWrite(state)
  return {
    attempts_low_zone: write.zone_tries[1] ?? null,
    attempts_high_zone: write.zone_tries[2] ?? null,
    // Top's tries is the running attempt count once topped; before that, the
    // "tries to top" field is not meaningful yet and is left to the caller.
    topTries: state.topped ? state.topTries : null,
  }
}

/**
 * One CheckpointLadder event applied to a zone ladder: the whole driver for
 * ifsc_2024_bouldering, where nothing is sent per tap. Returns the next state
 * (the same object when the event changes nothing); the caller keeps it and
 * mirrors it into the tick fields with zoneLadderToTick.
 *   'edit'     arg = { rung, count }   correct the count a rung was reached at
 *   'unreach'  arg = rung              take a reached mark away again
 */
export function applyZoneLadderAction(state, action, arg) {
  switch (action) {
    case 'select':
      return selectRung(state, arg)
    case 'try':
      return addTry(state)
    case 'reached':
      return markReached(state)
    case 'top':
      return top(state)
    case 'undo':
      return undo(state).state
    case 'edit':
      return setReachedCount(state, arg?.rung, arg?.count)
    case 'unreach':
      return unreach(state, arg)
    case 'clear':
      return zoneLadderFromTick({})
    default:
      return state
  }
}
