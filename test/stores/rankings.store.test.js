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

    expect(api.ranking).toHaveBeenCalledWith({ url: null, country: 'FI' })
    expect(store.rankings).toEqual({ foo: 'bar' })
  })

  it('passes a pagination url through to api.ranking when given one', async () => {
    api.ranking.mockResolvedValue({ foo: 'page2' })
    const store = useRankingsStore()
    store.setRankingTarget('global')

    await store.fetchRankings('https://api.test/ranking?page=2')

    expect(api.ranking).toHaveBeenCalledWith({ url: 'https://api.test/ranking?page=2', country: 'global' })
    expect(store.rankings).toEqual({ foo: 'page2' })
  })
})

describe('module-scope usage (no component context)', () => {
  it('useRankingsStore(pinia).seedFromProfile succeeds when called outside any setup()', () => {
    expect(() => useRankingsStore(pinia).seedFromProfile('FI')).not.toThrow()
    expect(useRankingsStore(pinia).rankingTarget).toBe('FI')
  })
})
