import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useClimberStore } from '../../src/js/stores/climber.store.js'
import { pinia } from '../../src/js/stores/index.js'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useClimberStore initial state', () => {
  it('defaults climber to null', () => {
    const climberStore = useClimberStore()
    expect(climberStore.climber).toBe(null)
  })
})

describe('setFromProfile', () => {
  it('sets climber', () => {
    const climberStore = useClimberStore()

    climberStore.setFromProfile({ id: 1, etunimi: 'Aino' })

    expect(climberStore.climber).toEqual({ id: 1, etunimi: 'Aino' })
  })
})

describe('setFromPublicKey', () => {
  it('sets climber', () => {
    const climberStore = useClimberStore()

    climberStore.setFromPublicKey({ id: 9, point_entry_key: 'k' })

    expect(climberStore.climber).toEqual({ id: 9, point_entry_key: 'k' })
  })
})

describe('the overload: both actions write the same field', () => {
  it('a later setFromPublicKey overwrites an earlier setFromProfile', () => {
    const climberStore = useClimberStore()

    climberStore.setFromProfile({ id: 1, etunimi: 'Aino' })
    climberStore.setFromPublicKey({ id: 9, point_entry_key: 'k' })

    expect(climberStore.climber).toEqual({ id: 9, point_entry_key: 'k' })
  })

  it('a later setFromProfile overwrites an earlier setFromPublicKey', () => {
    const climberStore = useClimberStore()

    climberStore.setFromPublicKey({ id: 9, point_entry_key: 'k' })
    climberStore.setFromProfile({ id: 1, etunimi: 'Aino' })

    expect(climberStore.climber).toEqual({ id: 1, etunimi: 'Aino' })
  })
})

// Review Focus-style check: the module-scope-explicit-instance pattern
// auth.store.js/ui.store.js already use (called outside any component
// setup(), via the shared `pinia` instance) — this is how mutations.js and
// queryKeys.js reach this store from a queryFn/onSuccess.
describe('module-scope usage (no component context)', () => {
  it('useClimberStore(pinia).setFromProfile succeeds when called outside any setup()', () => {
    expect(() => useClimberStore(pinia).setFromProfile({ id: 3 })).not.toThrow()
    expect(useClimberStore(pinia).climber).toEqual({ id: 3 })
  })

  it('useClimberStore(pinia).setFromPublicKey succeeds when called outside any setup()', () => {
    expect(() => useClimberStore(pinia).setFromPublicKey({ id: 4, point_entry_key: 'k' })).not.toThrow()
    expect(useClimberStore(pinia).climber).toEqual({ id: 4, point_entry_key: 'k' })
  })
})
