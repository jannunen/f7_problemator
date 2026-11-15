import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    climber: {
      profile: vi.fn(),
    },
  },
}))

import api from '@js/api'
import { queries } from '@js/queryKeys'

beforeEach(() => {
  api.climber.profile.mockReset()
})

describe('queries.climberProfile', () => {
  it('calls api.climber.profile with the climber id', async () => {
    api.climber.profile.mockResolvedValue({ id: 7 })

    await queries.climberProfile(7).queryFn()

    expect(api.climber.profile).toHaveBeenCalledWith(7)
  })

  it('is disabled until an id is given', () => {
    expect(queries.climberProfile(null).enabled.value).toBe(false)
    expect(queries.climberProfile(7).enabled.value).toBe(true)
  })
})
