import { ref, onUnmounted } from 'vue'
import * as ladder from '@helpers/ladder.js'
import { createLadderSync } from '@helpers/ladderSync.js'
import { myCheckpointFor } from '@helpers/checkpoints.js'

/**
 * The climber's zone tries ladders on one competition page.
 *
 * Taps are optimistic: the ladder changes at once, writes are coalesced per
 * route (helpers/ladderSync.js) and the server response is adopted when it
 * arrives. If a write fails the taps stay on screen marked 'Not saved' with
 * Retry (re-sends the whole state); only final refusals (locked, not ongoing,
 * not a participant) go back to the server's state and lock the ladders.
 *
 * The Top goes through the ordinary tick path (tries = attempts) after the
 * zone stamps are saved; undoing it deletes that tick, then writes the
 * previous state with replace.
 *
 * Corrections (edit a reached rung's count, remove a mark, undo) can lower
 * what is stored, so they are full-state writes with replace. When one also
 * moves the top (removes it, brings it back, changes its tries) the top tick
 * is deleted or saved again to match.
 *
 *   store        the Vuex store (competition, my_checkpoints, my_checkpoint_tries, userticks)
 *   compId       () => competition id
 *   t            vue-i18n t
 *   saveTop      (problemid, tries) => Promise   records the top tick
 *   deleteTop    (problemid) => Promise          removes the top tick
 */
export function useCheckpointLadders({ store, compId, t, saveTop, deleteTop, delay = 500 }) {
  const local = ref({}) // problemid -> ladder state for this session (holds the undo stack)
  const errors = ref({}) // problemid -> inline message
  const topBusy = ref({}) // problemid -> a top/untop is in progress
  const lockedReason = ref(null)
  const version = ref(0) // bumped whenever the writer's busy state may have changed
  const failed = {} // problemid -> { kind: 'write' | 'top', state }
  const lastReach = {} // problemid -> time of the ✓ that just turned the button into ✓ Top
  const retopTimers = {} // problemid -> { timer, run }: a corrected top waiting to be saved again
  // A Top straight after a ✓ on the same route is the second tap of a double
  // tap on ✓ (the button became ✓ Top under the finger): ignore it.
  const isDoubleTap = (pid) => lastReach[pid] != null && Date.now() - lastReach[pid] < ladder.DOUBLE_TAP_MS

  const comp = () => store.state.competition
  const isTicked = (pid) => comp()?.userticks?.[pid] != null
  const triesFor = (pid) => {
    const all = comp()?.my_checkpoint_tries
    if (all == null || Array.isArray(all)) return null
    return all[pid] ?? null
  }

  const serverState = (prob) =>
    ladder.fromServer({
      zones: prob?.pivot?.checkpoints?.length ?? 0,
      checkpoint: myCheckpointFor(comp()?.my_checkpoints, prob.id),
      tries: triesFor(prob.id),
      topTick: comp()?.userticks?.[prob.id] ?? null,
    })

  /** The ladder to show for a problem. A local state whose Top disagrees with
   * the tick list (e.g. the ascent was swiped away) gives way to the server's. */
  const stateFor = (prob) => {
    const mine = local.value[prob.id]
    if (mine && (mine.topped === isTicked(prob.id) || topBusy.value[prob.id])) return mine
    return serverState(prob)
  }

  const setLocal = (pid, state) => {
    local.value = { ...local.value, [pid]: state }
  }
  const setError = (pid, msg) => {
    const next = { ...errors.value }
    if (msg) next[pid] = msg
    else delete next[pid]
    errors.value = next
  }
  const setTopBusy = (pid, on) => {
    topBusy.value = { ...topBusy.value, [pid]: on }
  }

  const messageFor = (err) => {
    const status = err?.response?.status
    if (status == 400) {
      return /not ongoing/.test(err?.response?.data?.message ?? '') ? t('comps.checkpoint_not_ongoing') : t('comps.checkpoint_locked')
    }
    if (status == 403) return t('comps.checkpoint_not_participant')
    if (status == 422) return t('comps.checkpoint_invalid')
    return t('ladder.not_saved')
  }
  // Locked / not ongoing / not a participant will not get better by retrying.
  const isFinal = (err) => [400, 403].includes(err?.response?.status)

  const probById = {}
  const rememberProb = (prob) => {
    probById[prob.id] = prob
  }

  const sync = createLadderSync({
    delay,
    save: (pid, write, replace) => store.dispatch('saveCheckpoint', { compid: compId(), problemid: pid, ...write, replace }),
    restoreLegacy: async (pid, checkpoint) => {
      await store.dispatch('deleteCheckpoint', { compid: compId(), problemid: pid })
      if (checkpoint > 0) return store.dispatch('saveCheckpoint', { compid: compId(), problemid: pid, checkpoint })
      return { ok: true, checkpoint: 0, attempts: 0, zone_tries: {} }
    },
    onSaved: (pid, response, sent) => {
      version.value++
      const mine = local.value[pid]
      // Something newer is on its way: that write's answer will be adopted instead.
      if (sync.hasQueued(pid) || !mine || !ladder.sameData(mine, sent)) return
      setLocal(pid, ladder.adoptServer(mine, response))
    },
    onFailed: (pid, err, sent) => {
      version.value++
      if (sync.hasQueued(pid)) return
      setError(pid, messageFor(err))
      if (isFinal(err)) {
        // Locked / not ongoing / not a participant: retrying cannot help, so
        // show what the server has and lock the ladders.
        const prob = probById[pid]
        if (prob) setLocal(pid, serverState(prob))
        lockedReason.value = messageFor(err)
        return
      }
      // Anything else (offline, 5xx, 422): keep the taps on screen, unsaved,
      // with Retry. The next tap or Retry sends the whole state again.
      failed[pid] = { kind: 'write' }
    },
  })

  const isSaving = (pid) => {
    // eslint-disable-next-line no-unused-expressions
    version.value
    return sync.isBusy(pid) || !!topBusy.value[pid]
  }

  const write = (prob, next, { replace = false } = {}) => {
    setLocal(prob.id, next)
    sync.queue(prob.id, next, { replace })
    version.value++
  }

  const top = async (prob, next, { replace = false } = {}) => {
    const pid = prob.id
    setTopBusy(pid, true)
    setLocal(pid, next)
    sync.queue(pid, next, { replace })
    await sync.flush(pid)
    version.value++
    if (errors.value[pid]) {
      setTopBusy(pid, false)
      return
    }
    try {
      await saveTop(pid, next.topTries ?? next.attempts)
    } catch (err) {
      // The zones are saved; only the top tick is missing. Keep the zones,
      // offer the top again.
      const mine = local.value[pid] ?? next
      setLocal(pid, { ...mine, topped: false, topTries: null, active: ladder.topRung(mine) })
      failed[pid] = { kind: 'top' }
      setError(pid, messageFor(err))
    } finally {
      setTopBusy(pid, false)
    }
  }

  const untop = async (prob, before, prev) => {
    const pid = prob.id
    setTopBusy(pid, true)
    setLocal(pid, prev)
    try {
      await deleteTop(pid)
    } catch (err) {
      setLocal(pid, before)
      setError(pid, messageFor(err))
      setTopBusy(pid, false)
      return
    }
    setTopBusy(pid, false)
    write(prob, prev, { replace: true })
  }

  const cancelRetop = (pid) => {
    if (!retopTimers[pid]) return
    clearTimeout(retopTimers[pid].timer)
    delete retopTimers[pid]
  }
  // The tries of a top were corrected. Saving the tick again replaces the
  // old one, so taps on the stepper are coalesced like any other write and
  // only the last value is sent, one save at a time.
  let retopChain = Promise.resolve()
  const retop = (prob, next) => {
    const pid = prob.id
    cancelRetop(pid)
    setTopBusy(pid, true)
    setLocal(pid, next)
    const run = () => {
      delete retopTimers[pid]
      retopChain = retopChain.then(() => {
        const latest = local.value[pid]
        if (retopTimers[pid]) return undefined // corrected again meanwhile: that save follows
        if (!latest?.topped) return setTopBusy(pid, false)
        return top(prob, latest, { replace: true })
      })
      return retopChain
    }
    retopTimers[pid] = { run, timer: setTimeout(run, delay) }
  }

  /** Store a corrected state (edit, remove, undo): `next` replaces what the server has. */
  const correct = (prob, cur, next) => {
    // A corrected top still waiting to be saved goes out with this one.
    const topUnsaved = !!retopTimers[prob.id]
    cancelRetop(prob.id)
    if (cur.topped && !next.topped) return untop(prob, cur, next)
    if (next.topped && !cur.topped) return top(prob, next, { replace: true })
    if (next.topped && (topUnsaved || next.topTries !== cur.topTries)) return retop(prob, next)
    write(prob, next, { replace: true })
  }

  /** Handle one CheckpointLadder event for a problem. */
  const act = (prob, action, arg) => {
    rememberProb(prob)
    const pid = prob.id
    const cur = stateFor(prob)
    if (action !== 'retry') {
      setError(pid, null)
      delete failed[pid]
    }
    // Anything in between (a try, choosing a rung, undo) makes a later Top deliberate.
    if (action !== 'reached' && action !== 'top') delete lastReach[pid]
    switch (action) {
      case 'select':
        setLocal(pid, ladder.selectRung(cur, arg))
        return
      case 'try': {
        const next = ladder.addTry(cur)
        if (next !== cur) write(prob, next)
        return
      }
      case 'reached': {
        const next = ladder.markReached(cur)
        if (next === cur) return
        if (next.topped) {
          if (isDoubleTap(pid)) return
          return top(prob, next)
        }
        // Only a ✓ that made the Top the active rung swaps the button under the finger.
        if (ladder.isTopRung(next, next.active)) lastReach[pid] = Date.now()
        write(prob, next)
        return
      }
      case 'top': {
        const next = ladder.top(cur)
        if (next === cur || isDoubleTap(pid)) return
        return top(prob, next)
      }
      case 'undo': {
        const { state, undone } = ladder.undo(cur)
        if (!undone) return
        return correct(prob, cur, state)
      }
      case 'edit': {
        const next = ladder.setReachedCount(cur, arg?.rung, arg?.count)
        if (next === cur) return
        return correct(prob, cur, next)
      }
      case 'unreach': {
        const next = ladder.unreach(cur, arg)
        if (next === cur) return
        return correct(prob, cur, next)
      }
      case 'retry': {
        const f = failed[pid]
        setError(pid, null)
        delete failed[pid]
        if (!f) return
        if (f.kind === 'top') return top(prob, ladder.top(cur))
        write(prob, cur)
        return
      }
      case 'clear':
        setLocal(pid, ladder.fromServer({ zones: cur.zones }))
        return store
          .dispatch('deleteCheckpoint', { compid: compId(), problemid: pid })
          .then(() => {
            const next = { ...local.value }
            delete next[pid]
            local.value = next
          })
          .catch((err) => {
            setLocal(pid, cur)
            setError(pid, messageFor(err))
          })
      default:
    }
  }

  onUnmounted(() => {
    // Taps made just before leaving the page still count.
    Object.values(retopTimers).forEach(({ timer, run }) => {
      clearTimeout(timer)
      run()
    })
    sync.flushAll()
  })

  return { stateFor, act, errors, isSaving, lockedReason }
}
