import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * `ready` moved to the Pinia ui store (Task 2), but getProfile/logout/changeGym
 * are still-live Vuex actions (other domains, migrated later) that used to flip
 * it via `commit('setReady', ...)`. That mutation is gone now, so these three
 * actions call `useUiStore(pinia).setReady(...)` directly instead — a deliberate
 * temporary bridge from old Vuex code into the new Pinia store, mirroring the
 * bridge pattern already used elsewhere in this migration (there: new code
 * reading old Vuex state; here: old Vuex code writing new Pinia state).
 *
 * This covers changeGym, the simplest of the three to exercise in isolation.
 */
const makeLocalStorageStub = () => {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}
vi.hoisted(() => { globalThis.localStorage = {} })

vi.mock('../src/js/api.js', () => ({
  default: {
    getProfile: vi.fn(),
  },
}))
vi.mock('@js/queryClient', () => ({ invalidateAfter: vi.fn() }))
vi.mock('@helpers/socialAuth.js', () => ({ signInWith: vi.fn(), clearSupabaseSession: vi.fn() }))

import api from '../src/js/api.js'
import store from '../src/js/store.js'
import { useUiStore } from '../src/js/stores/ui.store.js'
import { pinia } from '../src/js/stores/index.js'

beforeEach(() => {
  globalThis.localStorage = makeLocalStorageStub()
  api.getProfile.mockReset().mockResolvedValue(null)
})

describe('changeGym bridges ready into the ui store', () => {
  it('sets uiStore.ready to false as soon as the gym switch starts', () => {
    const uiStore = useUiStore(pinia)
    uiStore.setReady(true)
    expect(uiStore.ready).toBe(true)

    store.dispatch('changeGym', 42)

    expect(uiStore.ready).toBe(false)
  })
})
