import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSSRApp, effectScope } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

vi.mock('@js/api', () => ({
  default: {
    loadAllTimeTicks: vi.fn(),
    climber: { allTimeTicks: vi.fn() },
  },
}))

import api from '@js/api'
import { setAuthToken } from '@js/authToken.js'
import { useAllTimeTicks } from '@js/useAllTimeTicks.js'

beforeEach(() => {
  api.loadAllTimeTicks.mockReset()
  api.climber.allTimeTicks.mockReset()
  setAuthToken(null)
})

// Runs a composable inside an app context, so useQuery finds the client —
// same helper test/useProfileSlice.test.js uses.
const inApp = (client, fn) => {
  let out
  const app = createSSRApp({ render: () => null })
  app.use(VueQueryPlugin, { queryClient: client })
  app.runWithContext(() => effectScope().run(() => (out = fn())))
  return out
}

/**
 * Mirrors useProfileSlice.js's safe-default pattern (see its own test file):
 * TanStack never calls `select` while `data` is undefined — cold start, or
 * any page that mounts before the first fetch resolves — so the Vuex
 * `state.alltime` default this replaces (`{ ticks: [], tries: [] }`) has to
 * come from somewhere other than the query itself. Every one of the 17
 * consumer components still destructures `.ticks`/`.tries` unconditionally.
 */
describe('useAllTimeTicks', () => {
  it('returns the fallback {ticks: [], tries: []} while the query has no data', () => {
    // No token in the test env, so queries.allTimeTicks is disabled: data
    // stays undefined, exactly as on a cold start.
    const client = new QueryClient()
    const allTime = inApp(client, () => useAllTimeTicks())

    expect(allTime.value).toEqual({ ticks: [], tries: [] })
  })

  it('returns the cached payload once data lands', () => {
    const client = new QueryClient()
    client.setQueryData(['alltime-ticks'], { ticks: [{ id: 1 }], tries: [{ id: 2 }] })

    const allTime = inApp(client, () => useAllTimeTicks())

    expect(allTime.value).toEqual({ ticks: [{ id: 1 }], tries: [{ id: 2 }] })
  })

  /**
   * ClimberProfilePage passes a climberId to read someone else's ticks.
   * This must hit the separate /climber/{id}/ticks cache entry and call,
   * never the "me" one, and the no-argument call sites above must keep
   * working exactly as before.
   */
  it('with a climberId, reads the climber-specific cache entry instead', () => {
    const client = new QueryClient()
    client.setQueryData(['climber-alltime-ticks', 42], { ticks: [{ id: 9 }], tries: [] })

    const allTime = inApp(client, () => useAllTimeTicks(42))

    expect(allTime.value).toEqual({ ticks: [{ id: 9 }], tries: [] })
    expect(api.climber.allTimeTicks).not.toHaveBeenCalled()
    expect(api.loadAllTimeTicks).not.toHaveBeenCalled()
  })
})
