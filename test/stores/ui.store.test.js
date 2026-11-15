import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// setTipShowStatus writes through to localStorage, same as the Vuex action it replaces.
const makeLocalStorageStub = () => {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}
vi.hoisted(() => { globalThis.localStorage = {} })

vi.mock('@js/api', () => ({
  default: {
    version: vi.fn(),
  },
}))

import api from '@js/api'
import { useUiStore, filtersInitial } from '../../src/js/stores/ui.store.js'

beforeEach(() => {
  setActivePinia(createPinia())
  globalThis.localStorage = makeLocalStorageStub()
  api.version.mockReset()
})

describe('useUiStore initial state', () => {
  it('starts dark mode on', () => {
    const store = useUiStore()
    expect(store.darkMode).toBe(true)
  })

  it('starts filters at filtersInitial', () => {
    const store = useUiStore()
    expect(store.filters).toEqual(filtersInitial)
  })
})

describe('setFilterSort', () => {
  it('updates filters.sort only', () => {
    const store = useUiStore()
    store.setFilterSort('name_asc')
    expect(store.filters).toEqual({ ...filtersInitial, sort: 'name_asc' })
  })
})

describe('resetFilters', () => {
  it('restores filtersInitial after other filters were changed', () => {
    const store = useUiStore()
    store.setFilterSort('name_asc')
    store.setFilterGradeMin({ id: 1, score: 100 })
    store.setNameFilter('crimpy')

    store.resetFilters()

    expect(store.filters).toEqual(filtersInitial)
  })
})

describe('setTipShowStatus', () => {
  it('writes through to localStorage and updates state', () => {
    const store = useUiStore()
    store.setTipShowStatus({ welcome_home: true })

    expect(JSON.parse(localStorage.getItem('tipShowStatus'))).toEqual({ welcome_home: true })
    expect(store.tipShowStatus).toEqual({ welcome_home: true })
  })

  it('does not read from localStorage on init (write-only persistence)', () => {
    localStorage.setItem('tipShowStatus', JSON.stringify({ welcome_home: true }))
    const store = useUiStore()
    expect(store.tipShowStatus).toEqual({})
  })
})

describe('fetchVersion', () => {
  it('calls api.version() and sets serverVersion', async () => {
    api.version.mockResolvedValue({ version: '1.2.3' })
    const store = useUiStore()

    await store.fetchVersion()

    expect(api.version).toHaveBeenCalled()
    expect(store.serverVersion).toBe('1.2.3')
  })
})
