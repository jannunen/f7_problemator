import { describe, it, expect } from 'vitest'
import { queries } from '../src/js/queryKeys.js'

describe('queries.rankingTop10', () => {
  it('puts the gym id in the key so gyms never share a cache entry', () => {
    const a = queries.rankingTop10(1, 2, null, 7).queryKey
    const b = queries.rankingTop10(1, 2, null, 8).queryKey
    const c = queries.rankingTop10(1, 2, 'FI').queryKey
    expect(a).not.toEqual(b)
    expect(a).not.toEqual(c)
  })
})
