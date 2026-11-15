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

import api from '@js/api'
import { queryClient } from '@js/queryClient'
import { mutations } from '@js/mutations'
import { useClimberStore } from '@js/stores/climber.store.js'
import { pinia } from '@js/stores/index.js'

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
  useClimberStore(pinia).setFromProfile(null)
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

  it('invalidates the profile query and writes climber into the Pinia climber store on success', () => {
    mutations.saveSettings().onSuccess({ climber: { id: 9 } })

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile'] })
    expect(useClimberStore(pinia).climber).toEqual({ id: 9 })
  })
})
