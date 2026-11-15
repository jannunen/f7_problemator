import { describe, it, expect, vi, beforeEach } from 'vitest'

// The store reads localStorage while building its initial state.
vi.hoisted(() => { globalThis.localStorage = {} })

vi.mock('../src/js/api.js', () => ({
  default: {
    saveTick: vi.fn(),
    deleteTickByProblem: vi.fn(),
  },
}))
vi.mock('@js/queryClient', () => ({
  invalidateAfter: vi.fn(),
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}))
// fetchRankings calls api.ranking, which this file's api mock does not
// provide; saveTick/publicSaveTick fire it without awaiting it, so an
// unmocked real store would reject it as an unhandled rejection.
vi.mock('@js/stores/rankings.store.js', () => ({
  useRankingsStore: () => ({ fetchRankings: vi.fn() }),
}))
vi.mock('@helpers/socialAuth.js', () => ({ signInWith: vi.fn(), clearSupabaseSession: vi.fn() }))

import api from '../src/js/api.js'
import { queryClient } from '@js/queryClient'
import store from '../src/js/store.js'
import { useClimberStore } from '../src/js/stores/climber.store.js'
import { pinia } from '../src/js/stores/index.js'

beforeEach(() => {
  api.saveTick.mockReset()
  api.deleteTickByProblem.mockReset()
  queryClient.setQueryData.mockReset()
  useClimberStore(pinia).setFromProfile(null)
})

// Captures the (key, updater) setQueryData was called with and runs the
// updater against `old`, the same way the real queryClient would.
const patched = (old) => {
  const [key, updater] = queryClient.setQueryData.mock.calls.at(-1)
  return { key, next: updater(old) }
}

/**
 * Regression coverage for the reviewer's Critical finding: saveTick/
 * deleteTick/deleteTickByProblem still commit addTickToCompetition/
 * removeTickFromCompetition (Task 5's domain, not yet migrated), but those
 * two Vuex mutations guard on state.competition, which Task 3 removed —
 * making them permanent no-ops. Without a bridge, a tick write on a
 * competition page would never update the cached competition's userticks,
 * so CompetitionEntry.vue's isTicked/toppedIds/tickCount (now reading
 * props.comp, sourced from the ['competition', compid] query) would go
 * stale, and useCheckpointLadders.js would visibly revert a just-saved Top
 * the instant its optimistic state yields back to the (stale) server state.
 *
 * This proves the bridge: store.dispatch('saveTick'/'deleteTickByProblem',
 * {..., compid}) patches the ['competition', compid] (or
 * ['public-competition', compid]) query cache's userticks directly.
 */
describe('saveTick: the competition-cache bridge', () => {
  it('does not forward compid to api.saveTick (it is not part of the tick payload)', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 1 }, tick: { problemid: 42, tries: 1 } })

    await store.dispatch('saveTick', { ticktype: 'tick', problemid: 42, compid: 7 })

    expect(api.saveTick.mock.calls[0][0]).not.toHaveProperty('compid')
  })

  it('patches userticks on the ["competition", compid] query cache', async () => {
    const tick = { problemid: 42, tries: 1, tries_bonus: 0 }
    api.saveTick.mockResolvedValue({ problem: { id: 1 }, tick })

    await store.dispatch('saveTick', { ticktype: 'tick', problemid: 42, compid: 7 })

    const { key, next } = patched({ id: 7, userticks: { 1: { problemid: 1 } } })
    expect(key).toEqual(['competition', 7])
    expect(next.userticks).toEqual({ 1: { problemid: 1 }, 42: tick })
  })

  it('is a no-op (no cache write at all) for callers with no competition context', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 1 }, tick: { problemid: 42, tries: 1 } })

    // AddTick.vue/SearchHitItem.vue/NewProblemItem.vue never send compid.
    await store.dispatch('saveTick', { ticktype: 'tick', problemid: 42 })

    expect(queryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('does not touch the competition cache for a try (ticktype != "tick")', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 1 }, tick: { problemid: 42, tries: 1 } })

    await store.dispatch('saveTick', { ticktype: 'try', problemid: 42, compid: 7 })

    expect(queryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('is a safe no-op when the competition is not in the cache yet', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 1 }, tick: { problemid: 42 } })

    await store.dispatch('saveTick', { ticktype: 'tick', problemid: 42, compid: 7 })

    const { next } = patched(undefined)
    expect(next).toBeUndefined()
  })
})

describe('publicSaveTick: the public-competition-cache bridge', () => {
  it('patches userticks on the ["public-competition", compid] query cache', async () => {
    const tick = { problemid: 42, tries: 1 }
    api.saveTick.mockResolvedValue({ problem: { id: 1 }, tick })

    await store.dispatch('publicSaveTick', { ticktype: 'tick', problemid: 42, compid: 7 })

    const { key, next } = patched({ id: 7, userticks: {} })
    expect(key).toEqual(['public-competition', 7])
    expect(next.userticks).toEqual({ 42: tick })
  })

  it('does not forward compid to api.saveTick', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 1 }, tick: { problemid: 42 } })

    await store.dispatch('publicSaveTick', { ticktype: 'tick', problemid: 42, compid: 7, point_entry_key: 'abc' })

    expect(api.saveTick.mock.calls[0][0]).not.toHaveProperty('compid')
    expect(api.saveTick.mock.calls[0][0]).toMatchObject({ point_entry_key: 'abc' })
  })
})

describe('deleteTickByProblem: the competition-cache bridge', () => {
  it('does not forward compid to api.deleteTickByProblem', async () => {
    api.deleteTickByProblem.mockResolvedValue({ message: 'ok' })

    await store.dispatch('deleteTickByProblem', { problemid: 42, compid: 7 })

    expect(api.deleteTickByProblem.mock.calls[0][0]).not.toHaveProperty('compid')
  })

  it('removes the problem from userticks on the ["competition", compid] query cache', async () => {
    api.deleteTickByProblem.mockResolvedValue({ message: 'ok' })

    await store.dispatch('deleteTickByProblem', { problemid: 42, compid: 7 })

    const { key, next } = patched({ id: 7, userticks: { 42: { problemid: 42 }, 1: { problemid: 1 } } })
    expect(key).toEqual(['competition', 7])
    expect(next.userticks).toEqual({ 1: { problemid: 1 } })
  })

  it('is a no-op (no cache write at all) for callers with no competition context', async () => {
    api.deleteTickByProblem.mockResolvedValue({ message: 'ok' })

    // TickList.vue/ArchivePage.vue never send compid.
    await store.dispatch('deleteTickByProblem', { problemid: 42 })

    expect(queryClient.setQueryData).not.toHaveBeenCalled()
  })
})

describe('publicDeleteTickByProblem: the public-competition-cache bridge', () => {
  it('removes the problem from userticks on the ["public-competition", compid] query cache', async () => {
    api.deleteTickByProblem.mockResolvedValue({ message: 'ok' })

    await store.dispatch('publicDeleteTickByProblem', { problemid: 42, compid: 7 })

    const { key, next } = patched({ id: 7, userticks: { 42: { problemid: 42 } } })
    expect(key).toEqual(['public-competition', 7])
    expect(next.userticks).toEqual({})
  })

  it('does not forward compid to api.deleteTickByProblem', async () => {
    api.deleteTickByProblem.mockResolvedValue({ message: 'ok' })

    await store.dispatch('publicDeleteTickByProblem', { problemid: 42, compid: 7, point_entry_key: 'abc' })

    expect(api.deleteTickByProblem.mock.calls[0][0]).not.toHaveProperty('compid')
    expect(api.deleteTickByProblem.mock.calls[0][0]).toMatchObject({ point_entry_key: 'abc' })
  })
})
