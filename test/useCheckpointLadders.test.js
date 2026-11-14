import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive } from 'vue'
import { useCheckpointLadders } from '../src/js/useCheckpointLadders.js'

const prob = { id: 7, pivot: { max_points: 25, checkpoints: [{ points: 10 }, { points: 15 }] } }
const t = (k) => k

// A store double that behaves like the real actions: it stores what was
// written and answers like the backend ({ok, applied, checkpoint, attempts, zone_tries}).
const makeStore = ({ fail = null } = {}) => {
  const competition = reactive({ my_checkpoints: [], my_checkpoint_tries: [], userticks: {} })
  const calls = []
  const store = {
    state: { competition },
    dispatch: vi.fn(async (name, payload) => {
      calls.push({ name, payload })
      if (fail && fail(name, payload)) {
        const err = new Error('nope')
        err.response = typeof fail(name, payload) === 'object' ? fail(name, payload) : undefined
        throw err
      }
      if (name === 'saveCheckpoint') {
        const ret = { ok: true, applied: true, checkpoint: payload.checkpoint, attempts: payload.attempts ?? 0, zone_tries: payload.zone_tries ?? {} }
        competition.my_checkpoints = { ...competition.my_checkpoints, [payload.problemid]: ret.checkpoint }
        competition.my_checkpoint_tries = { ...competition.my_checkpoint_tries, [payload.problemid]: { attempts: ret.attempts, zone_tries: ret.zone_tries } }
        return ret
      }
      if (name === 'deleteCheckpoint') {
        competition.my_checkpoints = {}
        competition.my_checkpoint_tries = {}
        return { ok: true }
      }
      return {}
    }),
  }
  const saveTop = vi.fn(async (pid, tries) => {
    competition.userticks = { ...competition.userticks, [pid]: { problemid: pid, tries } }
  })
  const deleteTop = vi.fn(async (pid) => {
    const next = { ...competition.userticks }
    delete next[pid]
    competition.userticks = next
  })
  return { store, competition, calls, saveTop, deleteTop }
}

const setup = (opts) => {
  const env = makeStore(opts)
  const ladders = useCheckpointLadders({ store: env.store, compId: () => 3, t, saveTop: env.saveTop, deleteTop: env.deleteTop, delay: 300 })
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
    expect(saveTop).toHaveBeenCalledWith(7, 3)
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
