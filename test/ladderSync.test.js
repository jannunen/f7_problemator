import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLadderSync } from '../src/js/helpers/ladderSync.js'
import { fromServer, addTry, markReached, undo } from '../src/js/helpers/ladder.js'

const setup = (overrides = {}) => {
  const calls = []
  const save = vi.fn(async (pid, write, replace) => {
    calls.push({ pid, write, replace })
    return { ok: true, applied: true, ...write }
  })
  const restoreLegacy = vi.fn(async (pid, checkpoint) => ({ ok: true, checkpoint, attempts: 0, zone_tries: {} }))
  const onSaved = vi.fn()
  const onFailed = vi.fn()
  const sync = createLadderSync({ save, restoreLegacy, onSaved, onFailed, delay: 500, ...overrides })
  return { sync, save, restoreLegacy, onSaved, onFailed, calls }
}

describe('createLadderSync', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('coalesces rapid taps into one write of the latest full state', async () => {
    const { sync, save, onSaved } = setup()
    let s = fromServer({ zones: 2 })
    for (let i = 0; i < 4; i++) {
      s = addTry(s)
      sync.queue(7, s)
      await vi.advanceTimersByTimeAsync(200)
    }
    expect(save).not.toHaveBeenCalled()
    expect(sync.isBusy(7)).toBe(true)
    await vi.advanceTimersByTimeAsync(500)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(7, { checkpoint: 0, attempts: 4, zone_tries: {} }, false)
    expect(onSaved).toHaveBeenCalledWith(7, expect.objectContaining({ attempts: 4 }), s)
    expect(sync.isBusy(7)).toBe(false)
  })

  it('keeps routes independent', async () => {
    const { sync, save } = setup()
    sync.queue(1, addTry(fromServer({ zones: 1 })))
    sync.queue(2, markReached(fromServer({ zones: 1 })))
    await vi.advanceTimersByTimeAsync(500)
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('flush sends at once and serialises with a write in flight', async () => {
    let release
    const order = []
    const save = vi.fn((pid, write) => {
      order.push(write.attempts)
      if (write.attempts === 1) return new Promise((res) => { release = () => res({ ...write }) })
      return Promise.resolve({ ...write })
    })
    const { sync } = setup({ save })
    let s = addTry(fromServer({ zones: 1 }))
    sync.queue(3, s)
    const first = sync.flush(3)
    s = addTry(s)
    sync.queue(3, s)
    expect(sync.hasQueued(3)).toBe(true)
    const second = sync.flush(3)
    await vi.advanceTimersByTimeAsync(0)
    expect(order).toEqual([1]) // the second waits for the first
    release()
    await first
    await second
    expect(order).toEqual([1, 2])
  })

  it('sends replace after an undo and keeps it until a write with it succeeds', async () => {
    const save = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementation(async (pid, write) => ({ ...write }))
    const { sync, onFailed } = setup({ save })
    const s = addTry(addTry(fromServer({ zones: 1 })))
    const back = undo(s).state
    sync.queue(5, back, { replace: true })
    await sync.flush(5)
    expect(onFailed).toHaveBeenCalledWith(5, expect.any(Error), back)
    // retry: queued again without saying replace, still goes out as a replace
    sync.queue(5, back)
    await sync.flush(5)
    expect(save).toHaveBeenLastCalledWith(5, { checkpoint: 0, attempts: 1, zone_tries: {} }, true)
    // after that success, an ordinary write is not a replace
    sync.queue(5, addTry(back))
    await sync.flush(5)
    expect(save).toHaveBeenLastCalledWith(5, expect.anything(), false)
  })

  it('restores an old-data state (no counts) with the legacy path instead of a full-state write', async () => {
    const { sync, save, restoreLegacy } = setup()
    const legacy = fromServer({ zones: 3, checkpoint: 2 })
    sync.queue(9, legacy, { replace: true })
    await sync.flush(9)
    expect(save).not.toHaveBeenCalled()
    expect(restoreLegacy).toHaveBeenCalledWith(9, 2)
  })

  it('flushAll sends every queued route', async () => {
    const { sync, save } = setup()
    sync.queue(1, addTry(fromServer({ zones: 1 })))
    sync.queue(2, addTry(fromServer({ zones: 1 })))
    await sync.flushAll()
    expect(save).toHaveBeenCalledTimes(2)
    expect(sync.isBusy(1)).toBe(false)
  })

  it('flush with nothing queued does not write', async () => {
    const { sync, save } = setup()
    await sync.flush(4)
    expect(save).not.toHaveBeenCalled()
  })
})
