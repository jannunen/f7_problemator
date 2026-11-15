import { describe, it, expect } from 'vitest'
import { pinia } from '../../src/js/stores/index.js'

describe('pinia instance', () => {
  it('exports a usable Pinia instance', () => {
    expect(pinia).toBeTruthy()
    expect(typeof pinia.use).toBe('function')
  })
})
