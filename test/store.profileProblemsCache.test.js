import { describe, it, expect, vi, beforeEach } from 'vitest'

// The store reads localStorage while building its initial state.
vi.hoisted(() => { globalThis.localStorage = {} })

vi.mock('../src/js/api.js', () => ({
  default: {
    saveTick: vi.fn(),
    deleteTick: vi.fn(),
  },
}))
vi.mock('@js/queryClient', () => ({
  invalidateAfter: vi.fn(),
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}))
// fetchRankings calls api.ranking, which this file's api mock does not
// provide; saveTick/deleteTick fire it without awaiting it, so an unmocked
// real store would reject it as an unhandled rejection.
vi.mock('@js/stores/rankings.store.js', () => ({
  useRankingsStore: () => ({ fetchRankings: vi.fn() }),
}))
vi.mock('@helpers/socialAuth.js', () => ({ signInWith: vi.fn(), clearSupabaseSession: vi.fn() }))

import api from '../src/js/api.js'
import { queryClient } from '@js/queryClient'
import store from '../src/js/store.js'
import { useClimberStore } from '../src/js/stores/climber.store.js'
import { useGymStore } from '../src/js/stores/gym.store.js'
import { pinia } from '../src/js/stores/index.js'

beforeEach(() => {
  api.saveTick.mockReset()
  api.deleteTick.mockReset()
  queryClient.setQueryData.mockReset()
  useClimberStore(pinia).setFromProfile(null)
  useGymStore(pinia).setGymid(42)
})

// Captures the (key, updater) setQueryData was called with and runs the
// updater against `old`, the same way the real queryClient would.
const patched = (old) => {
  const [key, updater] = queryClient.setQueryData.mock.calls.at(-1)
  return { key, next: updater(old) }
}

/**
 * Regression coverage for the reviewer's Critical finding on Task 4 of the
 * Activity-group migration plan: saveTick/publicSaveTick/deleteTick
 * (Task 5's domain, not yet migrated) still `commit('updateProblem', ...)` /
 * `commit('problems', ...)`, but Task 4 removed both of those Vuex
 * mutations — making the commits permanent no-ops. Before this fix, a tick
 * write or delete never refreshed the ticked problem's cached
 * myTicks/myProjects fields in queries.profile's `['profile', gymid]`
 * cache, so useProfileProblems' consumers (ProblemList.vue,
 * sortFunctions.js's problemStyleFilter, PersonalTickStatus.vue's
 * Ticked/Projects quick filters) would show stale ticked/project state for
 * the rest of the session (staleTime: Infinity on the profile query, and
 * neither saveTick's nor deleteTick's invalidateAfter list touches
 * ['profile']).
 *
 * This proves the bridge: store.dispatch('saveTick'/'publicSaveTick'/
 * 'deleteTick', ...) patches the ['profile', gymid] query cache's
 * gym.problems entry for the ticked/deleted problem, wholesale, with
 * whatever fresh myTicks/myProjects the API response carried.
 */
describe('saveTick: the profile-problems-cache bridge', () => {
  it('replaces the cached problem (myTicks/myProjects included) on the ["profile", gymid] query cache', async () => {
    const problem = { id: 5, myTicks: [{ id: 99 }], myProjects: [] }
    api.saveTick.mockResolvedValue({ problem, tick: { problemid: 5, tries: 1 } })

    await store.dispatch('saveTick', { ticktype: 'tick', problemid: 5 })

    const { key, next } = patched({ gym: { problems: [{ id: 5, myTicks: [], myProjects: [{ id: 1 }] }, { id: 9 }] } })
    expect(key).toEqual(['profile', 42])
    expect(next.gym.problems).toEqual([problem, { id: 9 }])
  })

  it('inserts the problem when it is not already in the cached array', async () => {
    const problem = { id: 777, myTicks: [{ id: 1 }], myProjects: [] }
    api.saveTick.mockResolvedValue({ problem, tick: { problemid: 777, tries: 1 } })

    await store.dispatch('saveTick', { ticktype: 'tick', problemid: 777 })

    const { next } = patched({ gym: { problems: [{ id: 5 }] } })
    expect(next.gym.problems).toEqual([{ id: 5 }, problem])
  })

  it('builds the setQueryData key from the CURRENT Pinia gym store gymid, not a stale one', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 5 }, tick: { problemid: 5, tries: 1 } })
    useGymStore(pinia).setGymid(99)

    await store.dispatch('saveTick', { ticktype: 'tick', problemid: 5 })

    const [key] = queryClient.setQueryData.mock.calls.at(-1)
    expect(key).toEqual(['profile', 99])
  })

  it('is a safe no-op when the profile payload is not cached yet', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 5 }, tick: { problemid: 5, tries: 1 } })

    await store.dispatch('saveTick', { ticktype: 'tick', problemid: 5 })

    const { next } = patched(undefined)
    expect(next).toBeUndefined()
  })
})

describe('publicSaveTick: the profile-problems-cache bridge', () => {
  it('replaces the cached problem on the ["profile", gymid] query cache', async () => {
    const problem = { id: 5, myTicks: [{ id: 99 }], myProjects: [] }
    api.saveTick.mockResolvedValue({ problem, tick: { problemid: 5, tries: 1 } })

    await store.dispatch('publicSaveTick', { ticktype: 'tick', problemid: 5 })

    const { key, next } = patched({ gym: { problems: [{ id: 5, myTicks: [] }] } })
    expect(key).toEqual(['profile', 42])
    expect(next.gym.problems).toEqual([problem])
  })
})

describe('deleteTick: the profile-problems-cache bridge', () => {
  it('replaces the cached problem (myTicks/myProjects cleared) on the ["profile", gymid] query cache', async () => {
    const problem = { id: 5, myTicks: [], myProjects: [] }
    api.deleteTick.mockResolvedValue({ message: 'ok', problem })

    await store.dispatch('deleteTick', 123)

    const { key, next } = patched({ gym: { problems: [{ id: 5, myTicks: [{ id: 99 }], myProjects: [] }] } })
    expect(key).toEqual(['profile', 42])
    expect(next.gym.problems).toEqual([problem])
  })
})
