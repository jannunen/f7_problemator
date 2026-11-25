import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    climber: {
      allTimeTicks: vi.fn(),
    },
  },
}))

import api from '@js/api'
import { queries } from '@js/queryKeys'

beforeEach(() => {
  api.climber.allTimeTicks.mockReset()
})

/**
 * The /climber/{id}/ticks counterpart to queries.allTimeTicks, for viewing
 * another climber's stats (ClimberProfilePage) rather than the signed-in
 * one's own. Same {ticks, tries} shape, same never-stale caching, keyed by
 * climber id so it never collides with the "me" cache entry.
 */
describe('queries.climberAllTimeTicks', () => {
  it('calls api.climber.allTimeTicks with the climber id', async () => {
    api.climber.allTimeTicks.mockResolvedValue({ ticks: [], tries: [] })

    await queries.climberAllTimeTicks(7).queryFn()

    expect(api.climber.allTimeTicks).toHaveBeenCalledWith(7)
  })

  it('resolves with the raw {ticks, tries} payload', async () => {
    const payload = { ticks: [{ id: 1 }], tries: [{ id: 2 }] }
    api.climber.allTimeTicks.mockResolvedValue(payload)

    const result = await queries.climberAllTimeTicks(7).queryFn()

    expect(result).toBe(payload)
  })

  it('is disabled until an id is given', () => {
    expect(queries.climberAllTimeTicks(null).enabled.value).toBe(false)
    expect(queries.climberAllTimeTicks(7).enabled.value).toBe(true)
  })

  it('never goes stale on its own', () => {
    expect(queries.climberAllTimeTicks(7).staleTime).toBe(Infinity)
  })
})
