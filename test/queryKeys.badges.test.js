import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    getBadges: vi.fn(),
  },
}))

import api from '@js/api'
import { queries } from '@js/queryKeys'

beforeEach(() => {
  api.getBadges.mockReset()
})

describe('queries.badges', () => {
  it('calls api.getBadges with the gym id', async () => {
    api.getBadges.mockResolvedValue({ earned: [], definitions: [] })

    await queries.badges(42).queryFn()

    expect(api.getBadges).toHaveBeenCalledWith(42)
  })

  it('is disabled until a gym is given', () => {
    expect(queries.badges(null).enabled.value).toBe(false)
    expect(queries.badges(42).enabled.value).toBe(true)
  })
})
