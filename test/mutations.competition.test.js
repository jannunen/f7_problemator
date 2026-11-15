import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    saveCheckpoint: vi.fn(),
    deleteCheckpoint: vi.fn(),
    getPointsPerRoute: vi.fn(),
    registerToComp: vi.fn(),
    unRegisterToComp: vi.fn(),
    removeCompAscent: vi.fn(),
    addTopAscent: vi.fn(),
    addCheckpointAscent: vi.fn(),
  },
}))

vi.mock('@js/queryClient', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  },
}))

import api from '@js/api'
import { queryClient } from '@js/queryClient'
import { mutations } from '@js/mutations'

beforeEach(() => {
  api.saveCheckpoint.mockReset()
  api.deleteCheckpoint.mockReset()
  api.getPointsPerRoute.mockReset()
  api.registerToComp.mockReset()
  api.unRegisterToComp.mockReset()
  api.removeCompAscent.mockReset()
  api.addTopAscent.mockReset()
  api.addCheckpointAscent.mockReset()
  queryClient.setQueryData.mockReset()
  queryClient.invalidateQueries.mockReset()
})

// Captures the (key, updater) setQueryData was called with and runs the
// updater against `old`, the same way the real queryClient would.
const patched = (old) => {
  const [key, updater] = queryClient.setQueryData.mock.calls.at(-1)
  return { key, next: updater(old) }
}

describe('mutations.saveCheckpoint', () => {
  it('calls api.saveCheckpoint with the payload, no prefix', async () => {
    api.saveCheckpoint.mockResolvedValue({ checkpoint: 1 })

    await mutations.saveCheckpoint().mutationFn({ compid: 7, problemid: 42, checkpoint: 1 })

    expect(api.saveCheckpoint).toHaveBeenCalledWith({ compid: 7, problemid: 42, checkpoint: 1 })
  })

  // commitSavedCheckpoint's branch 1: a sport score. No checkpoint, and the
  // other two maps are left exactly as they were (even an empty-array one).
  it('a sport score only patches my_checkpoint_scores, leaving my_checkpoints untouched', () => {
    const ret = { ok: true, score: 25.25 }
    mutations.saveCheckpoint().onSuccess(ret, { compid: 7, problemid: 42 })

    const { key, next } = patched({ my_checkpoints: [], my_checkpoint_scores: [] })
    expect(key).toEqual(['competition', 7])
    expect(next.my_checkpoint_scores).toEqual({ 42: 25.25 })
    expect(next.my_checkpoints).toEqual([]) // untouched, still the PHP empty-array shape
  })

  // commitSavedCheckpoint's branch 2: a zone-tries write that is NOT empty —
  // stores both the tries and the checkpoint, leaves scores alone.
  it('a non-empty zone-tries write patches both my_checkpoint_tries and my_checkpoints', () => {
    const ret = { ok: true, checkpoint: 2, attempts: 3, zone_tries: { 1: 2, 2: 3 } }
    mutations.saveCheckpoint().onSuccess(ret, { compid: 7, problemid: 42 })

    const { next } = patched({ my_checkpoints: { 1: 1 }, my_checkpoint_tries: {}, my_checkpoint_scores: { 9: 1 } })
    expect(next.my_checkpoint_tries).toEqual({ 42: { attempts: 3, zone_tries: { 1: 2, 2: 3 } } })
    expect(next.my_checkpoints).toEqual({ 1: 1, 42: 2 })
    expect(next.my_checkpoint_scores).toEqual({ 9: 1 }) // untouched
  })

  // commitSavedCheckpoint's branch 3: checkpoint <= 0 AND attempts <= 0 means
  // the row was undone back to empty — clears all three maps for this problem.
  it('a zone-tries write with checkpoint 0 and attempts 0 removes the row from all three maps', () => {
    const ret = { ok: true, checkpoint: 0, attempts: 0, zone_tries: {} }
    mutations.saveCheckpoint().onSuccess(ret, { compid: 7, problemid: 42 })

    const { next } = patched({
      my_checkpoints: { 42: 2, 1: 1 },
      my_checkpoint_tries: { 42: { attempts: 3, zone_tries: {} } },
      my_checkpoint_scores: { 42: 10 },
    })
    expect(next.my_checkpoints).toEqual({ 1: 1 })
    expect(next.my_checkpoint_tries).toEqual({})
    expect(next.my_checkpoint_scores).toEqual({})
  })

  // A plain checkpoint-only write (no attempts/zone_tries in the response at
  // all) only ever touches my_checkpoints.
  it('a plain checkpoint write (no attempts/zone_tries) only patches my_checkpoints', () => {
    const ret = { ok: true, checkpoint: 1 }
    mutations.saveCheckpoint().onSuccess(ret, { compid: 7, problemid: 42 })

    const { next } = patched({ my_checkpoints: {}, my_checkpoint_tries: { 9: { attempts: 1 } } })
    expect(next.my_checkpoints).toEqual({ 42: 1 })
    expect(next.my_checkpoint_tries).toEqual({ 9: { attempts: 1 } })
  })

  it('does nothing when the competition is not in the cache yet', () => {
    mutations.saveCheckpoint().onSuccess({ score: 1 }, { compid: 7, problemid: 42 })

    const { next } = patched(undefined)
    expect(next).toBeUndefined()
  })
})

describe('mutations.publicSaveCheckpoint', () => {
  it('calls api.saveCheckpoint with the payload and the /compkey prefix', async () => {
    api.saveCheckpoint.mockResolvedValue({ checkpoint: 1 })

    await mutations.publicSaveCheckpoint().mutationFn({ compid: 7, problemid: 42, checkpoint: 1, point_entry_key: 'abc' })

    expect(api.saveCheckpoint).toHaveBeenCalledWith({ compid: 7, problemid: 42, checkpoint: 1, point_entry_key: 'abc' }, '/compkey')
  })

  it('patches the public-competition cache entry, not the signed-in one', () => {
    mutations.publicSaveCheckpoint().onSuccess({ score: 25 }, { compid: 7, problemid: 42 })

    const [key] = queryClient.setQueryData.mock.calls.at(-1)
    expect(key).toEqual(['public-competition', 7])
  })
})

describe('mutations.deleteCheckpoint', () => {
  it('calls api.deleteCheckpoint with the payload, no prefix', async () => {
    api.deleteCheckpoint.mockResolvedValue({ ok: true })

    await mutations.deleteCheckpoint().mutationFn({ compid: 7, problemid: 42 })

    expect(api.deleteCheckpoint).toHaveBeenCalledWith({ compid: 7, problemid: 42 })
  })

  it('removes the row from all three maps unconditionally', () => {
    mutations.deleteCheckpoint().onSuccess({ ok: true }, { compid: 7, problemid: 42 })

    const { key, next } = patched({
      my_checkpoints: { 42: 2 },
      my_checkpoint_tries: { 42: { attempts: 3 } },
      my_checkpoint_scores: { 42: 10 },
    })
    expect(key).toEqual(['competition', 7])
    expect(next.my_checkpoints).toEqual({})
    expect(next.my_checkpoint_tries).toEqual({})
    expect(next.my_checkpoint_scores).toEqual({})
  })
})

describe('mutations.publicDeleteCheckpoint', () => {
  it('calls api.deleteCheckpoint with the payload and the /compkey prefix', async () => {
    api.deleteCheckpoint.mockResolvedValue({ ok: true })

    await mutations.publicDeleteCheckpoint().mutationFn({ compid: 7, problemid: 42, point_entry_key: 'abc' })

    expect(api.deleteCheckpoint).toHaveBeenCalledWith({ compid: 7, problemid: 42, point_entry_key: 'abc' }, '/compkey')
  })

  it('patches the public-competition cache entry', () => {
    mutations.publicDeleteCheckpoint().onSuccess({ ok: true }, { compid: 7, problemid: 42 })

    const [key] = queryClient.setQueryData.mock.calls.at(-1)
    expect(key).toEqual(['public-competition', 7])
  })
})

describe('mutations.getPointsPerRoute', () => {
  it('calls api.getPointsPerRoute with the payload, no prefix', async () => {
    api.getPointsPerRoute.mockResolvedValue({ points_for_route: [] })

    await mutations.getPointsPerRoute().mutationFn({ compid: 7 })

    expect(api.getPointsPerRoute).toHaveBeenCalledWith({ compid: 7 })
  })

  it('patches points_per_route onto the cached competition', () => {
    const data = { points_for_route: [{ route_number: 1, points: 10 }] }
    mutations.getPointsPerRoute().onSuccess(data, { compid: 7 })

    const { key, next } = patched({ id: 7, points_per_route: null })
    expect(key).toEqual(['competition', 7])
    expect(next.points_per_route).toBe(data)
  })
})

describe('mutations.publicGetPointsPerRoute', () => {
  it('calls api.getPointsPerRoute with the payload and the /compkey prefix', async () => {
    api.getPointsPerRoute.mockResolvedValue({})

    await mutations.publicGetPointsPerRoute().mutationFn({ compid: 7, point_entry_key: 'abc' })

    expect(api.getPointsPerRoute).toHaveBeenCalledWith({ compid: 7, point_entry_key: 'abc' }, '/compkey')
  })

  it('patches the public-competition cache entry', () => {
    mutations.publicGetPointsPerRoute().onSuccess({}, { compid: 7 })

    const [key] = queryClient.setQueryData.mock.calls.at(-1)
    expect(key).toEqual(['public-competition', 7])
  })
})

describe('mutations.registerToComp', () => {
  it('calls api.registerToComp with the payload', async () => {
    api.registerToComp.mockResolvedValue({ participates: {} })

    await mutations.registerToComp().mutationFn({ compid: 7, category: 2 })

    expect(api.registerToComp).toHaveBeenCalledWith({ compid: 7, category: 2 })
  })

  it('adds a paid registration to paidregistrations', () => {
    const row = { id: 5, pivot: { serieid: 2, paid: '2024-01-01' } }
    mutations.registerToComp().onSuccess({ participates: row }, { compid: 7, category: 2 })

    const { key, next } = patched({ paidregistrations: [], unpaidregistrations: [] })
    expect(key).toEqual(['competition', 7])
    expect(next.paidregistrations).toEqual([row])
    expect(next.unpaidregistrations).toEqual([])
  })

  it('adds an unpaid registration to unpaidregistrations', () => {
    const row = { id: 5, pivot: { serieid: 2, paid: null } }
    mutations.registerToComp().onSuccess({ participates: row }, { compid: 7, category: 2 })

    const { next } = patched({ paidregistrations: [], unpaidregistrations: [] })
    expect(next.unpaidregistrations).toEqual([row])
    expect(next.paidregistrations).toEqual([])
  })
})

describe('mutations.unRegisterToComp', () => {
  it('calls api.unRegisterToComp with the payload', async () => {
    api.unRegisterToComp.mockResolvedValue({ message: 'ok' })

    await mutations.unRegisterToComp().mutationFn({ compid: 7, category: 2, contenderid: 5 })

    expect(api.unRegisterToComp).toHaveBeenCalledWith({ compid: 7, category: 2, contenderid: 5 })
  })

  it('filters the contender out of both registration lists, by payload (not the response)', () => {
    mutations.unRegisterToComp().onSuccess({ message: 'ok' }, { compid: 7, category: 2, contenderid: 5 })

    const old = {
      paidregistrations: [{ id: 5, pivot: { serieid: 2 } }, { id: 9, pivot: { serieid: 3 } }],
      unpaidregistrations: [{ id: 5, pivot: { serieid: 2 } }],
    }
    const { key, next } = patched(old)
    expect(key).toEqual(['competition', 7])
    expect(next.paidregistrations).toEqual([{ id: 9, pivot: { serieid: 3 } }])
    expect(next.unpaidregistrations).toEqual([])
  })
})

describe('mutations.removeCompAscent', () => {
  it('calls api.removeCompAscent with the payload', async () => {
    api.removeCompAscent.mockResolvedValue({ ok: true })

    await mutations.removeCompAscent().mutationFn({ tickid: 99 })

    expect(api.removeCompAscent).toHaveBeenCalledWith({ tickid: 99 })
  })
})

describe('mutations.addTopJudging', () => {
  it('calls api.addTopAscent with the payload and resolves on success', async () => {
    api.addTopAscent.mockResolvedValue({ ok: true })

    const ret = await mutations.addTopJudging().mutationFn({ compid: 7, contender: 5, problemid: 42, tries_top: 2, tries_bonus: 1 })

    expect(api.addTopAscent).toHaveBeenCalledWith({ compid: 7, contender: 5, problemid: 42, tries_top: 2, tries_bonus: 1 })
    expect(ret).toEqual({ ok: true })
  })

  // The controller answers 200 with {error:true,message} for refusals rather
  // than a 4xx, so a plain mutationFn would resolve this as a success.
  it('throws when the 200 response carries {error:true}', async () => {
    api.addTopAscent.mockResolvedValue({ error: true, message: 'Not a participant' })

    await expect(mutations.addTopJudging().mutationFn({})).rejects.toThrow('Not a participant')
  })

  it('throws a default message when the error response has none', async () => {
    api.addTopAscent.mockResolvedValue({ error: true })

    await expect(mutations.addTopJudging().mutationFn({})).rejects.toThrow('Could not record the top')
  })
})

describe('mutations.addCheckpointJudging', () => {
  it('calls api.addCheckpointAscent with the payload', async () => {
    api.addCheckpointAscent.mockResolvedValue({ ok: true, checkpoint: 2 })

    const ret = await mutations.addCheckpointJudging().mutationFn({ compid: 7, contender: 5, problemid: 42, checkpoint: 2 })

    expect(api.addCheckpointAscent).toHaveBeenCalledWith({ compid: 7, contender: 5, problemid: 42, checkpoint: 2 })
    expect(ret).toEqual({ ok: true, checkpoint: 2 })
  })
})

/**
 * Regression coverage for a bug a re-review caught in this file's own
 * cache patches: `payload.compid` is not guaranteed to be a Number by the
 * time it reaches one of these mutations — a caller that threaded a
 * Framework7 route param straight through (always a string) rather than
 * an already-fetched competition's `.id` would send a string. Without
 * normalizing both sides the same way, `queries.competition`'s
 * string-keyed entry (see test/queryKeys.compidTypeConsistency.test.js)
 * and one of these mutations' setQueryData call would address two
 * different cache entries. Every mutation that builds a
 * ['competition'|'public-competition', compid] key goes through
 * asCompId; these three (one per distinct cache-key shape this file
 * writes — a checkpoint-style object patch, a plain field patch, and a
 * list patch) stand in for all eight.
 */
describe('compid normalization: a string payload.compid still addresses the Number-keyed cache entry', () => {
  it('saveCheckpoint', () => {
    mutations.saveCheckpoint().onSuccess({ checkpoint: 1 }, { compid: '7', problemid: 42 })

    const [key] = queryClient.setQueryData.mock.calls.at(-1)
    expect(key).toEqual(['competition', 7])
  })

  it('getPointsPerRoute', () => {
    mutations.getPointsPerRoute().onSuccess({}, { compid: '7' })

    const [key] = queryClient.setQueryData.mock.calls.at(-1)
    expect(key).toEqual(['competition', 7])
  })

  it('registerToComp', () => {
    mutations.registerToComp().onSuccess({ participates: { pivot: { paid: true } } }, { compid: '7', category: 2 })

    const [key] = queryClient.setQueryData.mock.calls.at(-1)
    expect(key).toEqual(['competition', 7])
  })
})
