import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    saveSettings: vi.fn(),
  },
}))

vi.mock('@js/queryClient', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}))

// store.js is the still-live Vuex store; saveSettings' one allowed call into
// it (commit('climber', ...)) is out of scope for this migration plan (see
// the plan's "climber boundary") and is mocked the same way
// test/mutations.followUnFollow.test.js and test/stores/auth.store.test.js
// mock the one Vuex call each of those leaves behind.
vi.mock('../src/js/store.js', () => ({
  default: { commit: vi.fn() },
}))

import api from '@js/api'
import store from '../src/js/store.js'
import { queryClient } from '@js/queryClient'
import { mutations } from '@js/mutations'

const makeLocalStorageStub = () => {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}

beforeEach(() => {
  api.saveSettings.mockReset()
  queryClient.invalidateQueries.mockReset()
  store.commit.mockReset()
  globalThis.localStorage = makeLocalStorageStub()
})

describe('mutations.changeGym', () => {
  it('writes the chosen gym id to localStorage and resolves it', async () => {
    const ret = await mutations.changeGym().mutationFn(42)

    expect(localStorage.getItem('gymid')).toBe('42')
    expect(ret).toBe(42)
  })

  // Matches today's INVALIDATES.changeGym: () => [] — every gym-scoped key
  // carries the gym id, so the key change alone makes Query refetch; nothing
  // here needs to be told to.
  it('invalidates nothing', () => {
    mutations.changeGym().onSuccess()

    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })
})

describe('mutations.saveSettings', () => {
  it('calls api.saveSettings with the payload', async () => {
    api.saveSettings.mockResolvedValue({ climber: { id: 1 } })

    await mutations.saveSettings().mutationFn({ etunimi: 'A' })

    expect(api.saveSettings).toHaveBeenCalledWith({ etunimi: 'A' })
  })

  it('invalidates the profile query and bridges climber into the still-live Vuex store on success', () => {
    mutations.saveSettings().onSuccess({ climber: { id: 9 } })

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile'] })
    expect(store.commit).toHaveBeenCalledWith('climber', { id: 9 })
  })
})
