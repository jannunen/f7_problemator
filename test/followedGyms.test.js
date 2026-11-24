import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'

// followedGyms.js reads localStorage at module import time, so each test
// needs its own fresh module instance (vi.resetModules + dynamic import)
// seeded with its own stub — the shared module-level ref otherwise survives
// across tests the same way it survives across remounts in the app.
const makeLocalStorageStub = () => {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}
vi.hoisted(() => { globalThis.localStorage = {} })

describe('followedGyms', () => {
  it('starts empty when nothing is stored', async () => {
    vi.resetModules()
    globalThis.localStorage = makeLocalStorageStub()
    const { followedGyms } = await import('../src/js/followedGyms.js')
    expect(followedGyms.value).toEqual([])
  })

  it('starts with whatever gym ids were previously stored', async () => {
    vi.resetModules()
    const storage = makeLocalStorageStub()
    storage.setItem('feed.followedGyms', JSON.stringify([3, 7]))
    globalThis.localStorage = storage
    const { followedGyms } = await import('../src/js/followedGyms.js')
    expect(followedGyms.value).toEqual([3, 7])
  })

  it('persists a whole-array replacement, same as v-model on a multi-select', async () => {
    vi.resetModules()
    const storage = makeLocalStorageStub()
    globalThis.localStorage = storage
    const { followedGyms } = await import('../src/js/followedGyms.js')
    followedGyms.value = [1, 2]
    await nextTick()
    expect(JSON.parse(storage.getItem('feed.followedGyms'))).toEqual([1, 2])
  })

  it('persists an in-place mutation too, not just a full reassignment', async () => {
    vi.resetModules()
    const storage = makeLocalStorageStub()
    globalThis.localStorage = storage
    const { followedGyms } = await import('../src/js/followedGyms.js')
    followedGyms.value.push(5)
    await nextTick()
    expect(JSON.parse(storage.getItem('feed.followedGyms'))).toEqual([5])
  })
})
