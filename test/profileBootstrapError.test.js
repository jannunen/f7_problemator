import { describe, it, expect, vi } from 'vitest'
import { handleProfileBootstrapError } from '../src/js/helpers/profileBootstrapError.js'

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
