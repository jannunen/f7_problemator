import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    loadAllTimeTicks: vi.fn(),
  },
}))

import api from '@js/api'
import { queries } from '@js/queryKeys'
import { setAuthToken } from '@js/authToken.js'

beforeEach(() => {
  api.loadAllTimeTicks.mockReset()
  setAuthToken(null)
})

/**
 * `loadAllTimeTicks` is a read (every date this climber has ever ticked or
 * tried, across all gyms) that used to live in store.js's `actions` block
 * despite never writing anything of its own — it belongs in `queries`, not
 * `mutations`, per the TanStack-vs-Pinia dividing line this migration plan
 * draws.
 */
describe('queries.allTimeTicks', () => {
  it('calls api.loadAllTimeTicks with no arguments', async () => {
    api.loadAllTimeTicks.mockResolvedValue({ ticks: [], tries: [] })

    await queries.allTimeTicks().queryFn()

    expect(api.loadAllTimeTicks).toHaveBeenCalledWith()
  })

  it('resolves with the raw {ticks, tries} payload', async () => {
    const payload = { ticks: [{ id: 1 }], tries: [{ id: 2 }] }
    api.loadAllTimeTicks.mockResolvedValue(payload)

    const result = await queries.allTimeTicks().queryFn()

    expect(result).toBe(payload)
  })

  it('is behind auth:api, like gyms/competitions/feed/virtualCoach', () => {
    expect(queries.allTimeTicks().enabled.value).toBe(false)

    setAuthToken('a.real.jwt')

    expect(queries.allTimeTicks().enabled.value).toBe(true)
  })

  // Fetched once per sign-in, like the old loadAllTimeTicks action it
  // replaces (guarded there on both arrays being empty) — mutations.js's
  // saveTick/deleteTickByProblem patch this cache directly via setQueryData,
  // the same "patches, not refetches" precedent queries.profile already set.
  it('never goes stale on its own', () => {
    expect(queries.allTimeTicks().staleTime).toBe(Infinity)
  })
})
