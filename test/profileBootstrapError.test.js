import { describe, it, expect, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { QueryClient, useQuery } from '@tanstack/vue-query'
import {
  handleProfileBootstrapError,
  logoutOnProfileBootstrapFailure,
} from '../src/js/helpers/profileBootstrapError.js'

/**
 * Pins the behavior app.vue's old try/catch around `getProfile` had: ANY
 * profile-bootstrap fetch failure — not only an expired/invalid token —
 * logs the climber out. See the migration plan's review finding on Task 7:
 * moving to queries.profile(gymid) silently dropped this (TanStack has no
 * equivalent to a dispatch's own try/catch), and the fix wires this function
 * into a `watch(profileQuery.error, ...)` in app.vue instead.
 */
describe('handleProfileBootstrapError', () => {
  it('logs out when the profile query ends in an error', () => {
    const logout = vi.fn()

    handleProfileBootstrapError(new Error('network blip'), logout)

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('does nothing when there is no error', () => {
    const logout = vi.fn()

    handleProfileBootstrapError(null, logout)
    handleProfileBootstrapError(undefined, logout)

    expect(logout).not.toHaveBeenCalled()
  })
})

/**
 * The trigger app.vue wires, driven by a real TanStack query rather than a
 * bare error value. The earlier tests above only ever handed the helper an
 * `error`/`null`, never a state where cached data already existed — which is
 * exactly the case that logged climbers out: ~30 components observe the
 * profile query, so a background refetch (staleTime lapsing, reconnect) that
 * fails on gym wifi set `error` and the watcher logged out a climber whose
 * session was fine. Only a failure with NO data yet — the bootstrap never
 * succeeded — means the session cannot be used.
 */
describe('logoutOnProfileBootstrapFailure', () => {
  const settle = async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
    await nextTick()
  }

  const observe = (queryFn) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const scope = effectScope()
    const logout = vi.fn()
    let query
    scope.run(() => {
      query = useQuery({ queryKey: ['profile', 1], queryFn }, client)
      logoutOnProfileBootstrapFailure(query, logout)
    })
    return { query, logout, stop: () => scope.stop() }
  }

  it('logs out when the bootstrap fetch fails with no data cached', async () => {
    const { query, logout, stop } = observe(() => Promise.reject(new Error('500')))
    await settle()

    expect(query.data.value).toBeUndefined()
    expect(query.error.value).toBeInstanceOf(Error)
    expect(logout).toHaveBeenCalledTimes(1)
    stop()
  })

  it('does NOT log out when a background refetch fails while data is cached', async () => {
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce({ profile: {}, gym: { name: 'Boulderpaja' } })
      .mockRejectedValueOnce(new Error('network blip'))
    const { query, logout, stop } = observe(queryFn)
    await settle()
    expect(query.data.value).toEqual({ profile: {}, gym: { name: 'Boulderpaja' } })

    await query.refetch()
    await settle()

    // The refetch really did fail and surface its error...
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(query.error.value).toBeInstanceOf(Error)
    expect(query.isRefetchError.value).toBe(true)
    // ...but the climber still has a usable session and their data.
    expect(query.data.value).toEqual({ profile: {}, gym: { name: 'Boulderpaja' } })
    expect(logout).not.toHaveBeenCalled()
    stop()
  })
})
