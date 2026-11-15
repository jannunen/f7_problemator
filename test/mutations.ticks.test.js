import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@js/api', () => ({
  default: {
    saveTick: vi.fn(),
    deleteTick: vi.fn(),
    deleteTickByProblem: vi.fn(),
    requestSync: vi.fn(),
  },
}))

vi.mock('@js/queryClient', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  },
}))

// The rankings store's fetchRankings is mocked rather than exercised for
// real here: all this file needs to verify is that these mutations CALL it
// (replacing the old `dispatch('rankings', {country: state.rankingTarget})`)
// — the store's own behavior is covered by rankings.store.test.js. Same
// hoisted-mock pattern test/queryKeys.profile.test.js uses for
// seedFromProfile.
const { rankingsStoreMock } = vi.hoisted(() => ({
  rankingsStoreMock: { fetchRankings: vi.fn() },
}))
vi.mock('@js/stores/rankings.store.js', () => ({
  useRankingsStore: () => rankingsStoreMock,
}))

import api from '@js/api'
import { queryClient } from '@js/queryClient'
import { mutations } from '@js/mutations'
import { useClimberStore } from '@js/stores/climber.store.js'
import { useGymStore } from '@js/stores/gym.store.js'
import { pinia } from '@js/stores/index.js'

beforeEach(() => {
  setActivePinia(createPinia())
  api.saveTick.mockReset()
  api.deleteTick.mockReset()
  api.deleteTickByProblem.mockReset()
  api.requestSync.mockReset()
  queryClient.setQueryData.mockReset()
  queryClient.invalidateQueries.mockReset()
  rankingsStoreMock.fetchRankings.mockReset()
  useClimberStore(pinia).setFromProfile(null)
  useGymStore(pinia).setGymid(42)
})

// Every onSuccess here makes several distinct setQueryData calls (the
// profile-problem patch, the alltime-ticks patch, and sometimes the
// competition-cache patch) — unlike the single-patch mutations elsewhere,
// so assertions pick the call by its key's first element rather than
// grabbing whichever ran last.
const callFor = (keyName) => queryClient.setQueryData.mock.calls.find(([key]) => key[0] === keyName)
const patchedFor = (keyName, old) => {
  const call = callFor(keyName)
  if (call == null) return undefined
  const [, updater] = call
  return updater(old)
}

describe('mutations.saveTick', () => {
  it('calls api.saveTick with compid stripped out, no prefix', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } })

    await mutations.saveTick().mutationFn({ ticktype: 'tick', problemid: 5, tries: 1, compid: 7 })

    expect(api.saveTick).toHaveBeenCalledWith({ ticktype: 'tick', problemid: 5, tries: 1 })
  })

  // The point_entry_key precondition (per the task brief): easy to drop
  // silently since it's a guard before the API call, not a success-path
  // effect. A payload sent while climber.point_entry_key is set must
  // include it; one without must not.
  describe('point_entry_key precondition', () => {
    it('attaches point_entry_key when the climber has one', async () => {
      useClimberStore(pinia).setFromPublicKey({ id: 1, point_entry_key: 'abc123' })
      api.saveTick.mockResolvedValue({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } })

      await mutations.saveTick().mutationFn({ ticktype: 'tick', problemid: 5 })

      expect(api.saveTick).toHaveBeenCalledWith({ ticktype: 'tick', problemid: 5, point_entry_key: 'abc123' })
    })

    it('does not attach point_entry_key when the climber has none', async () => {
      useClimberStore(pinia).setFromProfile({ id: 1 })
      api.saveTick.mockResolvedValue({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } })

      await mutations.saveTick().mutationFn({ ticktype: 'tick', problemid: 5 })

      expect(api.saveTick).toHaveBeenCalledWith({ ticktype: 'tick', problemid: 5 })
    })

    it('does not attach point_entry_key when there is no climber at all', async () => {
      api.saveTick.mockResolvedValue({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } })

      await mutations.saveTick().mutationFn({ ticktype: 'tick', problemid: 5 })

      expect(api.saveTick).toHaveBeenCalledWith({ ticktype: 'tick', problemid: 5 })
    })
  })

  it('patches the ticked problem into the profile cache (upsert when missing, replace wholesale when present)', () => {
    const problem = { id: 5, myTicks: [{ id: 1 }] }
    mutations.saveTick().onSuccess({ problem, tick: { id: 1, problemid: 5 } }, { ticktype: 'tick' })

    const next = patchedFor('profile', { gym: { problems: [{ id: 5, myTicks: [] }, { id: 9 }] } })
    expect(next.gym.problems).toEqual([problem, { id: 9 }])
  })

  it('pushes the tick onto the alltime-ticks cache ticks array when ticktype is tick', () => {
    const tick = { id: 1, problemid: 5 }
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick }, { ticktype: 'tick' })

    const next = patchedFor('alltime-ticks', { ticks: [], tries: [] })
    expect(next.ticks).toEqual([tick])
    expect(next.tries).toEqual([])
  })

  it('pushes the tick onto the alltime-ticks cache tries array when ticktype is not tick (a try/pretick)', () => {
    const tick = { id: 1, problemid: 5 }
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick }, { ticktype: 'pretick' })

    const next = patchedFor('alltime-ticks', { ticks: [], tries: [] })
    expect(next.tries).toEqual([tick])
    expect(next.ticks).toEqual([])
  })

  it('does nothing to the alltime-ticks cache when it is not cached yet', () => {
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } }, { ticktype: 'tick' })

    const next = patchedFor('alltime-ticks', undefined)
    expect(next).toBeUndefined()
  })

  // Replaces Task 3's temporary patchTickIntoCompetitionCache bridge: only a
  // caller that knows which competition it's on (CompetitionEntry.vue) sends
  // compid; every other saveTick caller doesn't, and this is a no-op for them.
  it('patches the competition userticks cache when the tick carries a compid', () => {
    const tick = { id: 1, problemid: 5 }
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick }, { ticktype: 'tick', compid: 7 })

    const [key] = callFor('competition')
    expect(key).toEqual(['competition', 7])
    const next = patchedFor('competition', { userticks: { 9: { id: 2 } } })
    expect(next.userticks).toEqual({ 9: { id: 2 }, 5: tick })
  })

  it('does not patch any competition cache when there is no compid', () => {
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } }, { ticktype: 'tick' })

    expect(callFor('competition')).toBeUndefined()
    expect(callFor('public-competition')).toBeUndefined()
  })

  it('does not patch the competition cache for a try (only a tick tops a route)', () => {
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } }, { ticktype: 'pretick', compid: 7 })

    expect(callFor('competition')).toBeUndefined()
  })

  it('calls useRankingsStore(pinia).fetchRankings(), replacing dispatch(rankings, ...)', () => {
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } }, { ticktype: 'tick' })

    expect(rankingsStoreMock.fetchRankings).toHaveBeenCalledWith()
  })

  it('invalidates feed/newProblems/badges/rankings/publicAscents, matching the old action', () => {
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } }, { ticktype: 'tick' })

    const keys = queryClient.invalidateQueries.mock.calls.map(([{ queryKey }]) => queryKey[0])
    expect(keys).toEqual(expect.arrayContaining(['feed', 'new-problems', 'badges', 'ranking-top10', 'public-ascents']))
  })
})

describe('mutations.publicSaveTick', () => {
  it('calls api.saveTick with compid stripped out and the /compkey prefix', async () => {
    api.saveTick.mockResolvedValue({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } })

    await mutations.publicSaveTick().mutationFn({ ticktype: 'tick', problemid: 5, compid: 7, point_entry_key: 'abc' })

    expect(api.saveTick).toHaveBeenCalledWith({ ticktype: 'tick', problemid: 5, point_entry_key: 'abc' }, '/compkey')
  })

  it('attaches point_entry_key from the climber store when the caller did not already set one', async () => {
    useClimberStore(pinia).setFromPublicKey({ id: 1, point_entry_key: 'from-store' })
    api.saveTick.mockResolvedValue({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } })

    await mutations.publicSaveTick().mutationFn({ ticktype: 'tick', problemid: 5 })

    expect(api.saveTick).toHaveBeenCalledWith({ ticktype: 'tick', problemid: 5, point_entry_key: 'from-store' }, '/compkey')
  })

  it('patches the public-competition cache, not the signed-in one', () => {
    const tick = { id: 1, problemid: 5 }
    mutations.publicSaveTick().onSuccess({ problem: { id: 5 }, tick }, { ticktype: 'tick', compid: 7 })

    expect(callFor('competition')).toBeUndefined()
    const [key] = callFor('public-competition')
    expect(key).toEqual(['public-competition', 7])
  })

  it('calls fetchRankings', () => {
    mutations.publicSaveTick().onSuccess({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } }, { ticktype: 'tick' })

    expect(rankingsStoreMock.fetchRankings).toHaveBeenCalledWith()
  })

  // The old publicSaveTick action never called invalidateAfter at all (unlike
  // the signed-in saveTick action) — preserved as-is, not newly added.
  it('does not invalidate anything, matching the old action', () => {
    mutations.publicSaveTick().onSuccess({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } }, { ticktype: 'tick' })

    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })
})

describe('mutations.deleteTick', () => {
  it('calls api.deleteTick with the bare tick id', async () => {
    api.deleteTick.mockResolvedValue({ message: 'ok', problem: { id: 5 } })

    await mutations.deleteTick().mutationFn(123)

    expect(api.deleteTick).toHaveBeenCalledWith(123)
  })

  it('replaces the matching problem in the profile cache wholesale', () => {
    const problem = { id: 5, myTicks: [] }
    mutations.deleteTick().onSuccess({ message: 'ok', problem })

    const next = patchedFor('profile', { gym: { problems: [{ id: 5, myTicks: [{ id: 1 }] }] } })
    expect(next.gym.problems).toEqual([problem])
  })

  // deleteTick never touched the all-time ticks list even in the old action
  // (only deleteTickByProblem/publicDeleteTickByProblem did, via the
  // removeTick commit) — not a regression to port one in now.
  it('does not touch the alltime-ticks cache', () => {
    mutations.deleteTick().onSuccess({ message: 'ok', problem: { id: 5 } })

    expect(callFor('alltime-ticks')).toBeUndefined()
  })

  it('calls fetchRankings', () => {
    mutations.deleteTick().onSuccess({ message: 'ok', problem: { id: 5 } })

    expect(rankingsStoreMock.fetchRankings).toHaveBeenCalledWith()
  })

  it('invalidates feed/newProblems/badges/rankings/publicAscents, matching the old action', () => {
    mutations.deleteTick().onSuccess({ message: 'ok', problem: { id: 5 } })

    const keys = queryClient.invalidateQueries.mock.calls.map(([{ queryKey }]) => queryKey[0])
    expect(keys).toEqual(expect.arrayContaining(['feed', 'new-problems', 'badges', 'ranking-top10', 'public-ascents']))
  })
})

describe('mutations.deleteTickByProblem', () => {
  it('calls api.deleteTickByProblem with compid stripped out, no prefix', async () => {
    api.deleteTickByProblem.mockResolvedValue({ message: 'ok' })

    await mutations.deleteTickByProblem().mutationFn({ problemid: 5, compid: 7 })

    expect(api.deleteTickByProblem).toHaveBeenCalledWith({ problemid: 5 })
  })

  it('removes the problem id from the alltime-ticks cache ticks array', () => {
    mutations.deleteTickByProblem().onSuccess({ message: 'ok' }, { problemid: 5, compid: 7 })

    const next = patchedFor('alltime-ticks', { ticks: [{ id: 1, problemid: 5 }, { id: 2, problemid: 9 }], tries: [] })
    expect(next.ticks).toEqual([{ id: 2, problemid: 9 }])
  })

  it('removes the problem from the competition userticks cache', () => {
    mutations.deleteTickByProblem().onSuccess({ message: 'ok' }, { problemid: 5, compid: 7 })

    const [key] = callFor('competition')
    expect(key).toEqual(['competition', 7])
    const next = patchedFor('competition', { userticks: { 5: { id: 1 }, 9: { id: 2 } } })
    expect(next.userticks).toEqual({ 9: { id: 2 } })
  })

  // The old deleteTickByProblem action never called useRankingsStore's
  // fetchRankings (unlike saveTick) — preserved as-is.
  it('does not call fetchRankings, matching the old action', () => {
    mutations.deleteTickByProblem().onSuccess({ message: 'ok' }, { problemid: 5, compid: 7 })

    expect(rankingsStoreMock.fetchRankings).not.toHaveBeenCalled()
  })

  it('invalidates feed/newProblems/badges/rankings/publicAscents, matching the old action', () => {
    mutations.deleteTickByProblem().onSuccess({ message: 'ok' }, { problemid: 5, compid: 7 })

    const keys = queryClient.invalidateQueries.mock.calls.map(([{ queryKey }]) => queryKey[0])
    expect(keys).toEqual(expect.arrayContaining(['feed', 'new-problems', 'badges', 'ranking-top10', 'public-ascents']))
  })
})

describe('mutations.publicDeleteTickByProblem', () => {
  it('calls api.deleteTickByProblem with compid stripped out and the /compkey prefix', async () => {
    api.deleteTickByProblem.mockResolvedValue({ message: 'ok' })

    await mutations.publicDeleteTickByProblem().mutationFn({ problemid: 5, compid: 7, point_entry_key: 'abc' })

    expect(api.deleteTickByProblem).toHaveBeenCalledWith({ problemid: 5, point_entry_key: 'abc' }, '/compkey')
  })

  it('removes the problem id from the alltime-ticks cache', () => {
    mutations.publicDeleteTickByProblem().onSuccess({ message: 'ok' }, { problemid: 5, compid: 7 })

    const next = patchedFor('alltime-ticks', { ticks: [{ id: 1, problemid: 5 }], tries: [] })
    expect(next.ticks).toEqual([])
  })

  it('removes the problem from the public-competition userticks cache, not the signed-in one', () => {
    mutations.publicDeleteTickByProblem().onSuccess({ message: 'ok' }, { problemid: 5, compid: 7 })

    expect(callFor('competition')).toBeUndefined()
    const [key] = callFor('public-competition')
    expect(key).toEqual(['public-competition', 7])
  })

  it('does not invalidate anything, matching the old action', () => {
    mutations.publicDeleteTickByProblem().onSuccess({ message: 'ok' }, { problemid: 5, compid: 7 })

    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })
})

describe('mutations.requestSync', () => {
  it('calls api.requestSync with the payload and resolves with the response', async () => {
    api.requestSync.mockResolvedValue({ message: 'Check your email' })

    const ret = await mutations.requestSync().mutationFn({ climberid: 1, email: 'a@b.com' })

    expect(api.requestSync).toHaveBeenCalledWith({ climberid: 1, email: 'a@b.com' })
    expect(ret).toEqual({ message: 'Check your email' })
  })
})

/**
 * Type-consistency check (per Task 3's post-mortem, reused for this file's
 * own cache writes): CompetitionEntry.vue/PublicCompetitionEntry.vue always
 * send a Number compid (props.comp.id, off a fetched competition), but
 * nothing stops a string from reaching these mutations the way a route
 * param would. Every compid these mutations touch goes through asCompId
 * before building a ['competition'|'public-competition', compid] key.
 */
describe('compid normalization: a string payload.compid still addresses the Number-keyed cache entry', () => {
  it('saveTick', () => {
    mutations.saveTick().onSuccess({ problem: { id: 5 }, tick: { id: 1, problemid: 5 } }, { ticktype: 'tick', compid: '7' })

    const [key] = callFor('competition')
    expect(key).toEqual(['competition', 7])
  })

  it('deleteTickByProblem', () => {
    mutations.deleteTickByProblem().onSuccess({ message: 'ok' }, { problemid: 5, compid: '7' })

    const [key] = callFor('competition')
    expect(key).toEqual(['competition', 7])
  })
})
