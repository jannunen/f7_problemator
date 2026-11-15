import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { pinia } from '../../src/js/stores/index.js'

describe('pinia instance', () => {
  it('exports a usable Pinia instance', () => {
    expect(pinia).toBeTruthy()
    expect(typeof pinia.use).toBe('function')
  })

  it('supports a Composition-API setup store called with an explicit pinia instance (module-scope usage)', () => {
    // Mirrors the pattern later tasks will rely on: defineStore(name, () => {...})
    // plus calling the resulting useXStore(piniaInstance) at module scope, instead
    // of relying on an active pinia from a component setup() context.
    const useCounterStore = defineStore('counter-explicit-instance', () => {
      const count = ref(0)
      function increment() {
        count.value++
      }
      return { count, increment }
    })

    const store = useCounterStore(pinia)
    expect(store.count).toBe(0)
    store.increment()
    expect(store.count).toBe(1)
  })
})
