import { describe, it, expect, vi, beforeEach } from 'vitest'

// The store reads localStorage while building its initial state.
vi.hoisted(() => { globalThis.localStorage = {} })

vi.mock('../src/js/api.js', () => ({
  default: {
    saveCheckpoint: vi.fn(),
    deleteCheckpoint: vi.fn(),
  },
}))
vi.mock('@js/queryClient', () => ({ invalidateAfter: vi.fn() }))
vi.mock('@helpers/socialAuth.js', () => ({ signInWith: vi.fn(), clearSupabaseSession: vi.fn() }))

import api from '../src/js/api.js'
import store from '../src/js/store.js'
import { useClimberStore } from '../src/js/stores/climber.store.js'
import { pinia } from '../src/js/stores/index.js'

beforeEach(() => {
  api.saveCheckpoint.mockReset().mockResolvedValue({ checkpoint: 1 })
  api.deleteCheckpoint.mockReset().mockResolvedValue({})
  useClimberStore(pinia).setFromProfile(null)
})

describe('publicSaveCheckpoint', () => {
  it('sends the climber point entry key to the compkey route', async () => {
    useClimberStore(pinia).setFromProfile({ point_entry_key: 'abc' })

    await store.dispatch('publicSaveCheckpoint', { compid: 7, problemid: 42, score: 25.25 })

    expect(api.saveCheckpoint).toHaveBeenCalledWith(
      { compid: 7, problemid: 42, score: 25.25, point_entry_key: 'abc' },
      '/compkey',
    )
  })

  it('records what the server stored', async () => {
    api.saveCheckpoint.mockResolvedValue({ checkpoint: 2 })
    store.state.competition = { my_checkpoints: {} }

    await store.dispatch('publicSaveCheckpoint', { compid: 7, problemid: 42, checkpoint: 1 })

    expect(store.state.competition.my_checkpoints).toEqual({ 42: 2 })
  })
})

describe('publicDeleteCheckpoint', () => {
  it('sends the climber point entry key to the compkey route', async () => {
    useClimberStore(pinia).setFromProfile({ point_entry_key: 'abc' })

    await store.dispatch('publicDeleteCheckpoint', { compid: 7, problemid: 42 })

    expect(api.deleteCheckpoint).toHaveBeenCalledWith(
      { compid: 7, problemid: 42, point_entry_key: 'abc' },
      '/compkey',
    )
  })
})

describe('saveCheckpoint', () => {
  it('stays on the signed-in route', async () => {
    await store.dispatch('saveCheckpoint', { compid: 7, problemid: 42, score: 25.25 })

    expect(api.saveCheckpoint).toHaveBeenCalledWith({ compid: 7, problemid: 42, score: 25.25 })
  })
})

describe('a sport score save', () => {
  it.each(['saveCheckpoint', 'publicSaveCheckpoint'])('%s records the stored score, and leaves the checkpoints alone', async (action) => {
    api.saveCheckpoint.mockResolvedValue({ ok: true, score: 25.25 })
    store.state.competition = { my_checkpoints: { 7: 2 }, my_checkpoint_tries: { 7: { attempts: 3, zone_tries: { 1: 1 } } }, my_checkpoint_scores: {} }

    await store.dispatch(action, { compid: 7, problemid: 42, score: 25.25 })

    expect(store.state.competition.my_checkpoint_scores).toEqual({ 42: 25.25 })
    expect(store.state.competition.my_checkpoints).toEqual({ 7: 2 })
    expect(store.state.competition.my_checkpoint_tries).toEqual({ 7: { attempts: 3, zone_tries: { 1: 1 } } })
  })

  it('replaces an empty-array payload (PHP\'s empty map) with an object', async () => {
    api.saveCheckpoint.mockResolvedValue({ ok: true, score: 30 })
    store.state.competition = { my_checkpoints: [], my_checkpoint_scores: [] }

    await store.dispatch('saveCheckpoint', { compid: 7, problemid: 42, score: 30 })

    expect(store.state.competition.my_checkpoint_scores).toEqual({ 42: 30 })
    expect(store.state.competition.my_checkpoints).toEqual([])
  })
})
