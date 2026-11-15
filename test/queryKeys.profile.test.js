import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    getProfile: vi.fn(),
  },
}))

// The rankings store's seedFromProfile is mocked rather than exercised for
// real here: its seed-once guard is store-instance state that would leak
// across this file's tests through the shared `pinia` singleton (there is
// no public reset for a setup store's internal `seeded` ref). What this
// file needs to verify is only that queries.profile's queryFn calls it with
// the gym country — the guard itself is covered by rankings.store.test.js.
const { rankingsStoreMock } = vi.hoisted(() => ({
  rankingsStoreMock: { seedFromProfile: vi.fn() },
}))
vi.mock('@js/stores/rankings.store.js', () => ({
  useRankingsStore: () => rankingsStoreMock,
}))

import api from '@js/api'
import { queries } from '@js/queryKeys'
import { setAuthToken } from '@js/authToken.js'
import { QueryClient, QueryObserver } from '@tanstack/query-core'
import { useClimberStore } from '@js/stores/climber.store.js'
import { pinia } from '@js/stores/index.js'

beforeEach(() => {
  api.getProfile.mockReset()
  rankingsStoreMock.seedFromProfile.mockReset()
  useClimberStore(pinia).setFromProfile(null)
  setAuthToken(null)
})

describe('queries.profile', () => {
  it('calls api.getProfile with the gym id', async () => {
    api.getProfile.mockResolvedValue({
      profile: { settings: {} },
      climber: { id: 1 },
      gym: { country: 'fi', walls: [] },
      styles: [],
      grades: [],
    })

    await queries.profile(42).queryFn()

    expect(api.getProfile).toHaveBeenCalledWith(42)
  })

  /**
   * Unlike badges/newProblems/sprayWalls, this is NOT gated on a gym being
   * chosen: api.getProfile already answers for a climber with no gym
   * selected yet (that is what lets Home.vue's "no gym selected" prompt, and
   * the climber bridge below, work for a brand-new climber). It is gated on
   * being signed in instead — matching gyms/competitions/feed/virtualCoach.
   */
  it('is enabled once signed in, even before a gym is chosen', () => {
    expect(queries.profile(null).enabled.value).toBe(false)

    setAuthToken('a.real.jwt')

    expect(queries.profile(null).enabled.value).toBe(true)
    expect(queries.profile(99).enabled.value).toBe(true)
  })

  it('returns the raw payload for consumers to select gym/styles/grades/walls from', async () => {
    const payload = {
      profile: { settings: {} },
      climber: { id: 1 },
      gym: { country: 'fi', walls: ['w1'] },
      styles: ['crimpy'],
      grades: ['5a'],
    }
    api.getProfile.mockResolvedValue(payload)

    const result = await queries.profile(42).queryFn()

    expect(result).toBe(payload)
  })

  it('writes climber into the Pinia climber store', async () => {
    api.getProfile.mockResolvedValue({
      profile: { settings: {} },
      climber: { id: 7 },
      gym: { country: 'fi', walls: [] },
    })

    await queries.profile(42).queryFn()

    expect(useClimberStore(pinia).climber).toEqual({ id: 7 })
  })

  it('bridges rankingTarget from the gym country via the rankings store seed', async () => {
    api.getProfile.mockResolvedValue({
      profile: { settings: {} },
      climber: null,
      gym: { country: 'de', walls: [] },
    })

    await queries.profile(42).queryFn()

    expect(rankingsStoreMock.seedFromProfile).toHaveBeenCalledWith('de')
  })

  // Task 4 (Activity-group migration plan) removed the old
  // `store.commit('problems', ...)` bridge that used to run right here: it
  // reshaped `gym.problems` into an id-keyed object as a side effect of this
  // queryFn. That reshape is now `useProfileSlice.js`'s `useProfileProblems`
  // selector's job (see useProfileSlice.test.js); this queryFn leaves
  // `gym.problems` exactly as the backend returned it — untouched, still an
  // array — so mutations.js's patches (which also operate on this same raw
  // array) and a plain query read always agree on its shape.
  it('leaves gym.problems as the raw array the backend returned, doing no reshaping of its own', async () => {
    const payload = {
      profile: { settings: {} },
      climber: null,
      gym: {
        country: 'fi',
        walls: [],
        problems: [{ id: 5, name: 'a' }, { id: 9, name: 'b' }],
      },
    }
    api.getProfile.mockResolvedValue(payload)

    const result = await queries.profile(42).queryFn()

    expect(result.gym.problems).toEqual([{ id: 5, name: 'a' }, { id: 9, name: 'b' }])
    expect(result.gym.problems).toBe(payload.gym.problems)
  })

  /**
   * The old getProfile action ran at bootstrap and on an explicit gym change
   * only. Under the global 30s staleTime, every one of the ~30 components
   * observing this query refetched the whole bootstrap on any navigation
   * past 30s — re-downloading it, overwriting Vuex state.problems wholesale
   * via the bridge above, and (before the isLoadingError gate) logging the
   * climber out if that refetch failed. A gym change gets a new key and so a
   * fresh fetch anyway; saveSettings invalidates ['profile'] explicitly.
   */
  it('never goes stale on its own, matching the old fetch-once timing', async () => {
    expect(queries.profile(42).staleTime).toBe(Infinity)

    // And behaviourally: a second observer mounting long after the first
    // fetch (here, under a 30s default that has already lapsed) does not refetch.
    setAuthToken('a.real.jwt')
    api.getProfile.mockResolvedValue({ profile: {}, climber: null, gym: null })
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } })
    const first = new QueryObserver(client, { ...queries.profile(42), enabled: true, queryKey: ['profile', 42] })
    const unsub1 = first.subscribe(() => {})
    await vi.waitFor(() => expect(first.getCurrentResult().isSuccess).toBe(true))

    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now + 60_000)
    const second = new QueryObserver(client, { ...queries.profile(42), enabled: true, queryKey: ['profile', 42] })
    const unsub2 = second.subscribe(() => {})
    await new Promise((r) => setTimeout(r, 0))

    expect(api.getProfile).toHaveBeenCalledTimes(1)
    unsub1()
    unsub2()
    vi.restoreAllMocks()
  })
})

