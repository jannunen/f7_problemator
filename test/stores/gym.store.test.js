import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// gymid is seeded from localStorage at store creation, same as auth.store.js
// seeds accessToken/isAuthenticated from a stored token: a returning climber's
// last gym must read correctly on the very first render, not only after
// changeGym happens to run again.
const makeLocalStorageStub = (initial = {}) => {
  const data = { ...initial }
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}

import { useGymStore } from '../../src/js/stores/gym.store.js'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useGymStore initial state', () => {
  it('seeds gymid from a stored value', () => {
    globalThis.localStorage = makeLocalStorageStub({ gymid: '42' })
    const gymStore = useGymStore()
    expect(gymStore.gymid).toBe('42')
  })

  it('seeds gymid as null when nothing is stored', () => {
    globalThis.localStorage = makeLocalStorageStub()
    const gymStore = useGymStore()
    expect(gymStore.gymid).toBe(null)
  })

  it('tolerates an environment with no localStorage at all', () => {
    globalThis.localStorage = undefined
    expect(() => useGymStore()).not.toThrow()
    expect(useGymStore().gymid).toBe(null)
  })
})

describe('setGymid', () => {
  it('updates gymid reactively', () => {
    globalThis.localStorage = makeLocalStorageStub()
    const gymStore = useGymStore()

    gymStore.setGymid('7')

    expect(gymStore.gymid).toBe('7')
  })

  it('can clear the selected gym', () => {
    globalThis.localStorage = makeLocalStorageStub({ gymid: '42' })
    const gymStore = useGymStore()

    gymStore.setGymid(null)

    expect(gymStore.gymid).toBe(null)
  })
})
