import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@js/api', () => ({
  default: {
    ranking: vi.fn(),
  },
}))

import api from '@js/api'
import { useRankingsStore } from '../../src/js/stores/rankings.store.js'
import { pinia } from '../../src/js/stores/index.js'

beforeEach(() => {
  setActivePinia(createPinia())
  api.ranking.mockReset()
})

describe('useRankingsStore initial state', () => {
  it('defaults rankingTarget to global', () => {
    const store = useRankingsStore()
    expect(store.rankingTarget).toBe('global')
  })

  it('defaults rankings to null', () => {
    const store = useRankingsStore()
    expect(store.rankings).toBe(null)
  })
})

describe('seedFromProfile', () => {
  it('sets rankingTarget on first call', () => {
    const store = useRankingsStore()
    store.seedFromProfile('FI')
    expect(store.rankingTarget).toBe('FI')
  })

  it('is a no-op on a second call with a different country', () => {
    const store = useRankingsStore()
    store.seedFromProfile('FI')
    store.seedFromProfile('SE')
    expect(store.rankingTarget).toBe('FI')
  })

  it('is a no-op when country is null', () => {
    const store = useRankingsStore()
    store.seedFromProfile(null)
    expect(store.rankingTarget).toBe('global')
  })

  it('is a no-op after setRankingTarget has been called, even if seedFromProfile runs afterward', () => {
    const store = useRankingsStore()
    store.setRankingTarget('DE')
    store.seedFromProfile('FI')
    expect(store.rankingTarget).toBe('DE')
  })
})

describe('setRankingTarget', () => {
  it('always sets rankingTarget, overriding any prior value', () => {
    const store = useRankingsStore()
    store.seedFromProfile('FI')
    store.setRankingTarget('global')
    expect(store.rankingTarget).toBe('global')
  })

  it('blocks a later seedFromProfile call even if it runs before any seed happened', () => {
    const store = useRankingsStore()
    store.setRankingTarget('DE')
    // A profile refetch arriving after the explicit choice must not win.
    store.seedFromProfile('FI')
    store.seedFromProfile('SE')
    expect(store.rankingTarget).toBe('DE')
  })
})

describe('fetchRankings', () => {
  it('calls api.ranking with the current rankingTarget and sets rankings', async () => {
    api.ranking.mockResolvedValue({ foo: 'bar' })
    const store = useRankingsStore()
    store.setRankingTarget('FI')

    await store.fetchRankings()

    expect(api.ranking).toHaveBeenCalledWith({ url: null, country: 'FI', gym: null })
    expect(store.rankings).toEqual({ foo: 'bar' })
  })

  it('passes a pagination url through to api.ranking when given one', async () => {
    api.ranking.mockResolvedValue({ foo: 'page2' })
    const store = useRankingsStore()
    store.setRankingTarget('global')

    await store.fetchRankings('https://api.test/ranking?page=2')

    expect(api.ranking).toHaveBeenCalledWith({ url: 'https://api.test/ranking?page=2', country: 'global', gym: null })
    expect(store.rankings).toEqual({ foo: 'page2' })
  })
})

describe('reset', () => {
  // Called from auth.store's logout(): a seeded/explicitly-chosen scope and
  // the last-fetched page must not survive into the next climber's session,
  // or that climber's own first profile fetch could never seed theirs.
  it('restores rankingTarget/rankings and lets the next seedFromProfile win again', () => {
    const store = useRankingsStore()
    store.setRankingTarget('fi')
    store.rankings = { data: ['previous climber'] }

    store.reset()

    expect(store.rankingTarget).toBe('global')
    expect(store.rankings).toBe(null)
    store.seedFromProfile('se')
    expect(store.rankingTarget).toBe('se')
  })
})

describe('module-scope usage (no component context)', () => {
  it('useRankingsStore(pinia).seedFromProfile succeeds when called outside any setup()', () => {
    expect(() => useRankingsStore(pinia).seedFromProfile('FI')).not.toThrow()
    expect(useRankingsStore(pinia).rankingTarget).toBe('FI')
  })
})

describe('gym scope', () => {
  it('sends the selected gym id and stamps the result with it', async () => {
    const { useGymStore } = await import('../../src/js/stores/gym.store.js')
    api.ranking.mockResolvedValue([{ gym: { id: 7, name: 'X' } }])
    useGymStore().setGymid('7')
    const store = useRankingsStore()
    store.setRankingTarget('gym')
    await store.fetchRankings()
    expect(api.ranking).toHaveBeenCalledWith({ url: null, country: 'gym', gym: '7' })
    expect(store.rankingsGymid).toBe('7')
  })

  it('does not call the api without a selected gym', async () => {
    const { useGymStore } = await import('../../src/js/stores/gym.store.js')
    useGymStore().setGymid(null)
    const store = useRankingsStore()
    store.setRankingTarget('gym')
    await store.fetchRankings()
    expect(api.ranking).not.toHaveBeenCalled()
    expect(store.rankings).toEqual([])
  })

  it('flags an unpublished/unknown gym (422/404) instead of throwing', async () => {
    const { useGymStore } = await import('../../src/js/stores/gym.store.js')
    useGymStore().setGymid('9')
    api.ranking.mockRejectedValue({ response: { status: 404 } })
    const store = useRankingsStore()
    store.setRankingTarget('gym')
    await store.fetchRankings()
    expect(store.gymUnavailable).toBe(true)
    expect(store.rankings).toEqual([])
  })

  it('ignores a stale response after the gym was switched', async () => {
    const { useGymStore } = await import('../../src/js/stores/gym.store.js')
    const g = useGymStore()
    let resolveA
    api.ranking.mockImplementationOnce(() => new Promise((r) => { resolveA = r }))
    api.ranking.mockResolvedValueOnce(['B'])
    const store = useRankingsStore()
    store.setRankingTarget('gym')
    g.setGymid('1')
    const a = store.fetchRankings()
    g.setGymid('2')
    await store.fetchRankings()
    resolveA(['A'])
    await a
    expect(store.rankings).toEqual(['B'])
    expect(store.rankingsGymid).toBe('2')
  })

  it('does not leak the gym id into the country request', async () => {
    api.ranking.mockResolvedValue([])
    const store = useRankingsStore()
    store.setRankingTarget('FI')
    await store.fetchRankings()
    expect(api.ranking).toHaveBeenCalledWith({ url: null, country: 'FI', gym: null })
  })
})
