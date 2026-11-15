import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@js/api', () => ({
  default: {
    getClimberByKey: vi.fn(),
  },
}))

import api from '@js/api'
import { mutations } from '@js/mutations'
import { useClimberStore } from '@js/stores/climber.store.js'
import { pinia } from '@js/stores/index.js'

// mutations.js's onSuccess writes through the explicit shared `pinia`
// instance (the module-scope-explicit-instance pattern), so assertions read
// it back the same way rather than through a bare useClimberStore() tied to
// whatever happens to be Pinia's active instance.
beforeEach(() => {
  setActivePinia(createPinia())
  api.getClimberByKey.mockReset()
  useClimberStore(pinia).setFromProfile(null)
})

describe('mutations.getClimberByKey', () => {
  it('calls api.getClimberByKey with {compid, key} and the /compkey prefix', async () => {
    api.getClimberByKey.mockResolvedValue({ id: 5 })

    await mutations.getClimberByKey().mutationFn({ compid: 7, key: 'abc' })

    expect(api.getClimberByKey).toHaveBeenCalledWith({ compid: 7, key: 'abc' }, '/compkey')
  })

  it('writes a real climber response into the climber store', () => {
    mutations.getClimberByKey().onSuccess({ id: 5, point_entry_key: 'abc' })

    expect(useClimberStore(pinia).climber).toEqual({ id: 5, point_entry_key: 'abc' })
  })

  it('does not write a string error response into the climber store', () => {
    mutations.getClimberByKey().onSuccess('You do not have access to this comp.')

    expect(useClimberStore(pinia).climber).toBe(null)
  })
})
