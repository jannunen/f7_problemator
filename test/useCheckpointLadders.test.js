import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive } from 'vue'
import { useCheckpointLadders } from '../src/js/useCheckpointLadders.js'

const prob = { id: 7, pivot: { max_points: 25, checkpoints: [{ points: 10 }, { points: 15 }] } }
const t = (k) => k

// An environment double that behaves like the real mutations: it stores
// what was written and answers like the backend ({ok, applied, checkpoint,
// attempts, zone_tries}). `comp`/`saveCheckpoint`/`deleteCheckpoint` are no
// longer Vuex dispatch stand-ins (there is no default dispatch any more —
// every caller passes its own mutation explicitly) but plain functions, the
// same shape the real CompetitionEntry.vue/PublicCompetitionEntry.vue now
// pass in (wrapping useMutation(...).mutateAsync).
const makeEnv = ({ fail = null } = {}) => {
  const competition = reactive({ my_checkpoints: [], my_checkpoint_tries: [], userticks: {} })
  const calls = []
  const maybeFail = (name, payload) => {
    if (!fail || !fail(name, payload)) return
    const err = new Error('nope')
    err.response = typeof fail(name, payload) === 'object' ? fail(name, payload) : undefined
    throw err
  }
  const saveCheckpoint = vi.fn(async (payload) => {
    calls.push({ name: 'saveCheckpoint', payload })
    maybeFail('saveCheckpoint', payload)
    const ret = { ok: true, applied: true, checkpoint: payload.checkpoint, attempts: payload.attempts ?? 0, zone_tries: payload.zone_tries ?? {} }
    competition.my_checkpoints = { ...competition.my_checkpoints, [payload.problemid]: ret.checkpoint }
    competition.my_checkpoint_tries = { ...competition.my_checkpoint_tries, [payload.problemid]: { attempts: ret.attempts, zone_tries: ret.zone_tries } }
    return ret
  })
  const deleteCheckpoint = vi.fn(async (payload) => {
    calls.push({ name: 'deleteCheckpoint', payload })
    maybeFail('deleteCheckpoint', payload)
    competition.my_checkpoints = {}
    competition.my_checkpoint_tries = {}
    return { ok: true }
  })
  const saveTop = vi.fn(async (pid, tries) => {
    competition.userticks = { ...competition.userticks, [pid]: { problemid: pid, tries } }
  })
  const deleteTop = vi.fn(async (pid) => {
    const next = { ...competition.userticks }
    delete next[pid]
    competition.userticks = next
  })
  return { competition, calls, saveCheckpoint, deleteCheckpoint, saveTop, deleteTop }
}

const setup = (opts, overrides = {}) => {
  const env = makeEnv(opts)
  const ladders = useCheckpointLadders({
    comp: () => env.competition,
    compId: () => 3,
    t,
    saveTop: env.saveTop,
    deleteTop: env.deleteTop,
    saveCheckpoint: env.saveCheckpoint,
    deleteCheckpoint: env.deleteCheckpoint,
    delay: 300,
    ...overrides,
  })
  return { ...env, ladders }
}
const writes = (calls) => calls.filter((c) => c.name === 'saveCheckpoint').map((c) => c.payload)

describe('useCheckpointLadders', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {}) // onUnmounted outside a component
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('taps are instant and coalesce into one full-state write', async () => {
    const { ladders, calls } = setup()
    ladders.act(prob, 'try')
    ladders.act(prob, 'try')
    ladders.act(prob, 'select', 2)
    ladders.act(prob, 'try')
    expect(ladders.stateFor(prob)).toMatchObject({ attempts: 3, reached: { 1: 2 }, active: 2 })
    expect(ladders.isSaving(7)).toBe(true)
    expect(writes(calls)).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(300)
    expect(writes(calls)).toEqual([{ compid: 3, problemid: 7, checkpoint: 1, attempts: 3, zone_tries: { 1: 2 }, replace: false }])
    expect(ladders.isSaving(7)).toBe(false)
    expect(ladders.stateFor(prob).active).toBe(2) // kept after adopting the response
  })

  it('a failed write keeps the taps on screen with Not saved, and Retry re-sends the whole state', async () => {
    let failing = true
    const { ladders, calls, competition } = setup({ fail: (name) => failing && name === 'saveCheckpoint' })
    ladders.act(prob, 'try')
    ladders.act(prob, 'try')
    await vi.advanceTimersByTimeAsync(300)
    expect(ladders.stateFor(prob).attempts).toBe(2) // not lost
    expect(ladders.errors.value[7]).toBe('ladder.not_saved')
    expect(ladders.isSaving(7)).toBe(false)
    failing = false
    ladders.act(prob, 'retry')
    expect(ladders.errors.value[7]).toBeUndefined()
    await vi.advanceTimersByTimeAsync(300)
    expect(writes(calls).at(-1)).toMatchObject({ attempts: 2, checkpoint: 0 })
    expect(competition.my_checkpoint_tries[7]).toEqual({ attempts: 2, zone_tries: {} })
  })

  it('a tap after a failed write sends everything, including the unsaved taps', async () => {
    let failing = true
    const { ladders, calls } = setup({ fail: (name) => failing && name === 'saveCheckpoint' })
    ladders.act(prob, 'try')
    await vi.advanceTimersByTimeAsync(300)
    failing = false
    ladders.act(prob, 'try')
    expect(ladders.errors.value[7]).toBeUndefined()
    await vi.advanceTimersByTimeAsync(300)
    expect(writes(calls).at(-1)).toMatchObject({ attempts: 2 })
  })

  it('a locked competition disables every ladder with the reason', async () => {
    const { ladders } = setup({ fail: () => ({ status: 400, data: { message: 'competition is locked!' } }) })
    ladders.act(prob, 'reached')
    await vi.advanceTimersByTimeAsync(300)
    expect(ladders.lockedReason.value).toBe('comps.checkpoint_locked')
    expect(ladders.stateFor(prob).reached).toEqual({}) // back to what the server has
  })

  it('Top saves the zone stamps first, then the top tick with tries = attempts', async () => {
    const { ladders, calls, saveTop } = setup()
    ladders.act(prob, 'try')
    ladders.act(prob, 'try')
    ladders.act(prob, 'reached') // zone 1 in 2
    ladders.act(prob, 'try')
    ladders.act(prob, 'select', 3)
    await ladders.act(prob, 'reached') // ✓ on the Top rung is the top
    expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, attempts: 3, zone_tries: { 1: 2, 2: 3 } })
    expect(saveTop).toHaveBeenCalledWith(7, 3, 2)
    expect(ladders.stateFor(prob)).toMatchObject({ topped: true, topTries: 3 })
  })

  it('a failed top tick keeps the zones and offers the top again', async () => {
    const { ladders, saveTop } = setup()
    saveTop.mockRejectedValueOnce(new Error('offline'))
    await ladders.act(prob, 'top')
    expect(ladders.stateFor(prob)).toMatchObject({ topped: false, active: 3, reached: { 1: 1, 2: 1 } })
    expect(ladders.errors.value[7]).toBe('ladder.not_saved')
    await ladders.act(prob, 'retry')
    expect(saveTop).toHaveBeenCalledTimes(2)
    expect(ladders.stateFor(prob).topped).toBe(true)
  })

  it('double tap on ✓ of the last zone records the zone only, never a top', async () => {
    const { ladders, calls, saveTop } = setup()
    ladders.act(prob, 'try')
    ladders.act(prob, 'reached') // zone 1
    await vi.advanceTimersByTimeAsync(1000)
    const before = writes(calls).length
    ladders.act(prob, 'reached') // zone 2, the last zone: the button becomes ✓ Top
    await vi.advanceTimersByTimeAsync(150)
    await ladders.act(prob, 'reached') // second tap of the double tap (as 'reached')
    await ladders.act(prob, 'top') // ...or as 'top' from the ✓ Top button
    await vi.advanceTimersByTimeAsync(300)
    expect(writes(calls).length - before).toBe(1)
    expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, zone_tries: { 1: 1, 2: 1 } })
    expect(saveTop).not.toHaveBeenCalled()
    expect(ladders.stateFor(prob)).toMatchObject({ topped: false, active: 3 })
    // a deliberate tap afterwards still tops
    await vi.advanceTimersByTimeAsync(400)
    await ladders.act(prob, 'top')
    expect(saveTop).toHaveBeenCalledTimes(1)
  })

  it('undo of a top removes the tick and writes the previous state with replace', async () => {
    const { ladders, calls, deleteTop } = setup()
    ladders.act(prob, 'try')
    await ladders.act(prob, 'top')
    await ladders.act(prob, 'undo')
    expect(deleteTop).toHaveBeenCalledWith(7)
    await vi.advanceTimersByTimeAsync(300)
    expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 0, attempts: 1, zone_tries: {}, replace: true })
    expect(ladders.stateFor(prob)).toMatchObject({ topped: false, attempts: 1, reached: {} })
  })

  it('undo of a try writes the lower state with replace', async () => {
    const { ladders, calls } = setup()
    ladders.act(prob, 'try')
    ladders.act(prob, 'try')
    await vi.advanceTimersByTimeAsync(300)
    ladders.act(prob, 'undo')
    await vi.advanceTimersByTimeAsync(300)
    expect(writes(calls).at(-1)).toMatchObject({ attempts: 1, replace: true })
  })

  describe('corrections', () => {
    // zone 1 in 2, zone 2 in 3, saved; trying the top
    const reachBoth = async (ladders) => {
      ladders.act(prob, 'try')
      ladders.act(prob, 'try')
      ladders.act(prob, 'reached')
      ladders.act(prob, 'try')
      ladders.act(prob, 'reached')
      await vi.advanceTimersByTimeAsync(500) // saved, and past the double tap guard on the Top
    }

    it('editing a reached count is one full-state write with replace', async () => {
      const { ladders, calls } = setup()
      await reachBoth(ladders)
      ladders.act(prob, 'edit', { rung: 1, count: 1 })
      expect(ladders.stateFor(prob).reached).toEqual({ 1: 1, 2: 3 }) // at once
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toEqual({ compid: 3, problemid: 7, checkpoint: 2, attempts: 3, zone_tries: { 1: 1, 2: 3 }, replace: true })
      expect(ladders.stateFor(prob)).toMatchObject({ reached: { 1: 1, 2: 3 }, active: 3 })
    })

    it('stepper taps coalesce, and a count is clamped to what the server accepts', async () => {
      const { ladders, calls } = setup()
      await reachBoth(ladders)
      const before = writes(calls).length
      ladders.act(prob, 'edit', { rung: 1, count: 3 })
      ladders.act(prob, 'edit', { rung: 1, count: 4 }) // zone 2 was reached in 3
      ladders.act(prob, 'edit', { rung: 1, count: 9 })
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).length - before).toBe(1)
      expect(writes(calls).at(-1)).toMatchObject({ zone_tries: { 1: 3, 2: 3 }, attempts: 3, replace: true })
    })

    it('an edit that changes nothing sends nothing', async () => {
      const { ladders, calls } = setup()
      await reachBoth(ladders)
      const before = writes(calls).length
      ladders.act(prob, 'edit', { rung: 1, count: 2 })
      ladders.act(prob, 'edit', { rung: 3, count: 5 }) // not topped: the top has no count
      ladders.act(prob, 'unreach', 3)
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).length).toBe(before)
      expect(ladders.isSaving(7)).toBe(false)
    })

    it('removing the highest mark keeps the zones below and makes it the active rung', async () => {
      const { ladders, calls, competition } = setup()
      await reachBoth(ladders)
      ladders.act(prob, 'unreach', 2)
      expect(ladders.stateFor(prob)).toMatchObject({ reached: { 1: 2 }, attempts: 3, active: 2 })
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toEqual({ compid: 3, problemid: 7, checkpoint: 1, attempts: 3, zone_tries: { 1: 2 }, replace: true })
      expect(competition.my_checkpoints[7]).toBe(1)
      expect(ladders.stateFor(prob).active).toBe(2) // kept after adopting the response
    })

    it('removing the first zone removes the ones above; the tries stay', async () => {
      const { ladders, calls } = setup()
      await reachBoth(ladders)
      ladders.act(prob, 'unreach', 1)
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 0, attempts: 3, zone_tries: {}, replace: true })
      expect(ladders.stateFor(prob)).toMatchObject({ reached: {}, active: 1 })
    })

    it('undo of a removal puts the mark back', async () => {
      const { ladders, calls } = setup()
      await reachBoth(ladders)
      ladders.act(prob, 'unreach', 2)
      await vi.advanceTimersByTimeAsync(300)
      ladders.act(prob, 'undo')
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, zone_tries: { 1: 2, 2: 3 }, replace: true })
      expect(ladders.stateFor(prob).active).toBe(3)
    })

    it('removing the top deletes the tick and keeps the zones; undo tops again with the same tries', async () => {
      const { ladders, calls, saveTop, deleteTop, competition } = setup()
      await reachBoth(ladders)
      ladders.act(prob, 'try')
      await ladders.act(prob, 'top') // top in 4
      expect(saveTop).toHaveBeenLastCalledWith(7, 4, 2)
      await ladders.act(prob, 'unreach', 3)
      expect(deleteTop).toHaveBeenCalledWith(7)
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, attempts: 4, zone_tries: { 1: 2, 2: 3 }, replace: true })
      expect(ladders.stateFor(prob)).toMatchObject({ topped: false, active: 3 })
      expect(competition.userticks[7]).toBeUndefined()
      await ladders.act(prob, 'undo')
      expect(saveTop).toHaveBeenCalledTimes(2)
      expect(saveTop).toHaveBeenLastCalledWith(7, 4, 2)
      expect(ladders.stateFor(prob)).toMatchObject({ topped: true, topTries: 4 })
    })

    it('removing a zone of a topped route removes the top tick too', async () => {
      const { ladders, calls, deleteTop } = setup()
      await reachBoth(ladders)
      await ladders.act(prob, 'top')
      await ladders.act(prob, 'unreach', 2)
      expect(deleteTop).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 1, zone_tries: { 1: 2 }, replace: true })
      expect(ladders.stateFor(prob)).toMatchObject({ topped: false, reached: { 1: 2 }, active: 2 })
    })

    it('a zone edit on a topped route leaves the top tick alone', async () => {
      const { ladders, calls, saveTop, deleteTop } = setup()
      await reachBoth(ladders)
      await ladders.act(prob, 'top')
      ladders.act(prob, 'edit', { rung: 2, count: 2 })
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, attempts: 3, zone_tries: { 1: 2, 2: 2 }, replace: true })
      expect(saveTop).toHaveBeenCalledTimes(1)
      expect(deleteTop).not.toHaveBeenCalled()
      expect(ladders.stateFor(prob).topped).toBe(true)
    })

    it('correcting the tries of the top saves the tick once, with the last value', async () => {
      const { ladders, calls, saveTop, competition } = setup()
      await reachBoth(ladders)
      await ladders.act(prob, 'top') // top in 3
      ladders.act(prob, 'edit', { rung: 3, count: 4 })
      ladders.act(prob, 'edit', { rung: 3, count: 5 })
      ladders.act(prob, 'edit', { rung: 3, count: 6 })
      expect(ladders.stateFor(prob)).toMatchObject({ topped: true, topTries: 6, attempts: 6 })
      expect(ladders.isSaving(7)).toBe(true)
      expect(saveTop).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(300)
      expect(saveTop).toHaveBeenCalledTimes(2)
      expect(saveTop).toHaveBeenLastCalledWith(7, 6, 2)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, attempts: 6, zone_tries: { 1: 2, 2: 3 }, replace: true })
      expect(competition.userticks[7].tries).toBe(6)
      expect(ladders.isSaving(7)).toBe(false)
    })

    it('a zone edit made while a corrected top is waiting does not lose the top', async () => {
      const { ladders, calls, saveTop } = setup()
      await reachBoth(ladders)
      await ladders.act(prob, 'top')
      ladders.act(prob, 'edit', { rung: 3, count: 5 })
      ladders.act(prob, 'edit', { rung: 1, count: 1 })
      await vi.advanceTimersByTimeAsync(300)
      expect(saveTop).toHaveBeenLastCalledWith(7, 5, 1)
      expect(writes(calls).at(-1)).toMatchObject({ attempts: 5, zone_tries: { 1: 1, 2: 3 }, replace: true })
      expect(ladders.isSaving(7)).toBe(false)
    })

    it('removing the top while a corrected top is waiting just removes it', async () => {
      const { ladders, saveTop, deleteTop } = setup()
      await reachBoth(ladders)
      await ladders.act(prob, 'top')
      ladders.act(prob, 'edit', { rung: 3, count: 5 })
      await ladders.act(prob, 'unreach', 3)
      await vi.advanceTimersByTimeAsync(600)
      expect(deleteTop).toHaveBeenCalledTimes(1)
      expect(saveTop).toHaveBeenCalledTimes(1)
      expect(ladders.stateFor(prob)).toMatchObject({ topped: false, attempts: 5, active: 3 })
      expect(ladders.isSaving(7)).toBe(false)
    })

    it('by default a bonus (rung 1) edit on a topped route leaves the top tick alone', async () => {
      const { ladders, calls, saveTop, deleteTop } = setup()
      await reachBoth(ladders)
      await ladders.act(prob, 'top') // top in 3, bonus in 2
      ladders.act(prob, 'edit', { rung: 1, count: 1 })
      await vi.advanceTimersByTimeAsync(600)
      expect(saveTop).toHaveBeenCalledTimes(1)
      expect(deleteTop).not.toHaveBeenCalled()
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, attempts: 3, zone_tries: { 1: 1, 2: 3 }, replace: true })
      expect(ladders.stateFor(prob)).toMatchObject({ topped: true, topTries: 3 })
      expect(ladders.isSaving(7)).toBe(false)
    })

    it('test_editing_a_reached_bonus_rungs_count_after_a_top_resaves_the_tick', async () => {
      const { ladders, calls, saveTop, competition } = setup({}, { bonusAffectsTop: true })
      await reachBoth(ladders)
      await ladders.act(prob, 'top') // top in 3, bonus in 2
      expect(saveTop).toHaveBeenLastCalledWith(7, 3, 2)
      ladders.act(prob, 'edit', { rung: 1, count: 1 })
      expect(ladders.isSaving(7)).toBe(true)
      await vi.advanceTimersByTimeAsync(300)
      expect(saveTop).toHaveBeenCalledTimes(2)
      expect(saveTop).toHaveBeenLastCalledWith(7, 3, 1)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, attempts: 3, zone_tries: { 1: 1, 2: 3 }, replace: true })
      expect(competition.userticks[7].tries).toBe(3)
      expect(ladders.stateFor(prob)).toMatchObject({ topped: true, topTries: 3, reached: { 1: 1, 2: 3 } })
      expect(ladders.isSaving(7)).toBe(false)
    })

    it('a failed correction stays on screen with Retry, like any other write', async () => {
      let failing = false
      const { ladders, calls } = setup({ fail: (name) => failing && name === 'saveCheckpoint' })
      await reachBoth(ladders)
      failing = true
      ladders.act(prob, 'unreach', 2)
      await vi.advanceTimersByTimeAsync(300)
      expect(ladders.errors.value[7]).toBe('ladder.not_saved')
      expect(ladders.stateFor(prob).reached).toEqual({ 1: 2 })
      failing = false
      ladders.act(prob, 'retry')
      await vi.advanceTimersByTimeAsync(300)
      // replace sticks until a write carrying it succeeds
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 1, zone_tries: { 1: 2 }, replace: true })
    })

    it('works on a ladder loaded from the server, after a reload', async () => {
      const { ladders, calls, competition } = setup()
      competition.my_checkpoints = { 7: 2 }
      competition.my_checkpoint_tries = { 7: { attempts: 5, zone_tries: { 1: 2, 2: 4 } } }
      expect(ladders.stateFor(prob).active).toBe(3)
      ladders.act(prob, 'edit', { rung: 2, count: 3 })
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, attempts: 5, zone_tries: { 1: 2, 2: 3 }, replace: true })
      ladders.act(prob, 'unreach', 2)
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 1, attempts: 5, zone_tries: { 1: 2 }, replace: true })
      expect(ladders.stateFor(prob).active).toBe(2)
    })
  })

  describe('bonus rung through saveTop', () => {
    it('test_top_tapped_after_a_reached_bonus_rung_passes_the_bonus_tries_as_saveTops_third_argument', async () => {
      const { ladders, saveTop } = setup()
      ladders.act(prob, 'try')
      ladders.act(prob, 'try')
      ladders.act(prob, 'try')
      ladders.act(prob, 'reached') // bonus (rung 1) in 3
      ladders.act(prob, 'try')
      ladders.act(prob, 'try')
      await ladders.act(prob, 'top') // top in 5
      expect(saveTop).toHaveBeenCalledTimes(1)
      expect(saveTop).toHaveBeenCalledWith(7, 5, 3)
    })

    it('test_top_tapped_directly_without_a_bonus_tap_passes_the_top_tries_as_the_bonus_value_too', async () => {
      const { ladders, saveTop } = setup()
      ladders.act(prob, 'try')
      ladders.act(prob, 'try')
      ladders.act(prob, 'try')
      ladders.act(prob, 'try')
      await ladders.act(prob, 'top') // top in 4, rung 1 never marked
      expect(saveTop).toHaveBeenCalledTimes(1)
      expect(saveTop).toHaveBeenCalledWith(7, 4, 4)
    })

    // A Top saved before the ladders existed has no checkpoint row, so its
    // bonus count is only on the tick itself.
    it('test_correcting_a_legacy_tops_tries_keeps_the_ticks_own_tries_bonus', async () => {
      const { ladders, calls, saveTop, competition } = setup({}, { bonusAffectsTop: true, zonesFor: () => 1 })
      competition.userticks = { 7: { problemid: 7, tries: 5, tries_bonus: 2 } }
      expect(ladders.stateFor(prob)).toMatchObject({ topped: true, topTries: 5, reached: { 1: 2 } })
      ladders.act(prob, 'edit', { rung: 2, count: 4 })
      await vi.advanceTimersByTimeAsync(300)
      expect(saveTop).toHaveBeenCalledTimes(1)
      expect(saveTop).toHaveBeenLastCalledWith(7, 4, 2)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 1, attempts: 4, zone_tries: { 1: 2 }, replace: true })
    })

    it('test_a_legacy_ticks_tries_bonus_is_not_used_when_the_type_does_not_store_the_bonus_on_the_tick', () => {
      const { ladders, competition } = setup({}, { zonesFor: () => 1 })
      competition.userticks = { 7: { problemid: 7, tries: 5, tries_bonus: 2 } }
      expect(ladders.stateFor(prob).reached).toEqual({ 1: null })
    })

    const ifscZones = (tick) => ({ 1: tick.attempts_low_zone, 2: tick.attempts_high_zone })

    it('test_correcting_a_legacy_top_writes_the_ticks_own_zone_counts', async () => {
      const { ladders, calls, saveTop, competition } = setup({}, { legacyZoneTries: ifscZones })
      competition.userticks = { 7: { problemid: 7, tries: 5, attempts_low_zone: 2, attempts_high_zone: 3 } }
      expect(ladders.stateFor(prob).reached).toEqual({ 1: 2, 2: 3 })
      ladders.act(prob, 'edit', { rung: 3, count: 4 })
      await vi.advanceTimersByTimeAsync(300)
      expect(writes(calls).at(-1)).toMatchObject({ checkpoint: 2, attempts: 4, zone_tries: { 1: 2, 2: 3 }, replace: true })
      expect(saveTop).toHaveBeenLastCalledWith(7, 4, 2)
    })

    it.each([
      ['out_of_order', { attempts_low_zone: 4, attempts_high_zone: 3 }],
      ['above_the_tries', { attempts_low_zone: 2, attempts_high_zone: 6 }],
      ['missing', { attempts_low_zone: null, attempts_high_zone: null }],
    ])('test_legacy_zone_counts_that_are_%s_stay_unknown', (_, zones) => {
      const { ladders, competition } = setup({}, { legacyZoneTries: ifscZones })
      competition.userticks = { 7: { problemid: 7, tries: 5, ...zones } }
      expect(ladders.stateFor(prob).reached).toEqual({ 1: null, 2: null })
    })
  })

  describe('injected dependencies', () => {
    it('test_zonesFor_override_changes_the_rung_count_without_affecting_the_default_caller', () => {
      const { ladders: overridden } = setup({}, { zonesFor: () => 1 })
      expect(overridden.stateFor(prob)).toMatchObject({ zones: 1, active: 1 })
      const { ladders: plain } = setup()
      expect(plain.stateFor(prob)).toMatchObject({ zones: 2, active: 1 })
    })

    it('test_saveCheckpoint_and_deleteCheckpoint_overrides_are_used_instead_of_the_setup_defaults', async () => {
      const saveCheckpoint = vi.fn(async (p) => ({ ok: true, applied: true, checkpoint: p.checkpoint, attempts: p.attempts, zone_tries: p.zone_tries }))
      const deleteCheckpoint = vi.fn(async () => ({ ok: true }))
      const { ladders, saveCheckpoint: defaultSave, deleteCheckpoint: defaultDelete } = setup({}, { saveCheckpoint, deleteCheckpoint })
      ladders.act(prob, 'try')
      ladders.act(prob, 'reached')
      await vi.advanceTimersByTimeAsync(300)
      expect(saveCheckpoint).toHaveBeenCalledWith({ compid: 3, problemid: 7, checkpoint: 1, attempts: 1, zone_tries: { 1: 1 }, replace: false })
      await ladders.act(prob, 'clear')
      expect(deleteCheckpoint).toHaveBeenCalledWith({ compid: 3, problemid: 7 })
      expect(defaultSave).not.toHaveBeenCalled()
      expect(defaultDelete).not.toHaveBeenCalled()
    })
  })

  it('swiping the ascent away (tick deleted elsewhere) drops the local topped ladder', async () => {
    const { ladders, competition } = setup()
    await ladders.act(prob, 'top')
    expect(ladders.stateFor(prob).topped).toBe(true)
    competition.userticks = {}
    expect(ladders.stateFor(prob)).toMatchObject({ topped: false, reached: { 1: 1, 2: 1 }, active: 3 })
  })

  it('loads from the server: old data shows counts unknown; Clear deletes the row', async () => {
    const { ladders, competition, calls } = setup()
    competition.my_checkpoints = { 7: 1 }
    expect(ladders.stateFor(prob).reached).toEqual({ 1: null })
    await ladders.act(prob, 'clear')
    expect(calls.at(-1).name).toBe('deleteCheckpoint')
    expect(ladders.stateFor(prob).reached).toEqual({})
  })
})
