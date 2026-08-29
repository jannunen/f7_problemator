import { describe, it, expect, beforeEach } from 'vitest'
import { shouldToast, resetToastCooldown, userMessage, TOAST_COOLDOWN_MS } from '@helpers/reportError'

beforeEach(() => resetToastCooldown())

describe('shouldToast', () => {
  it('shows a message the first time', () => {
    expect(shouldToast('boom', 0)).toBe(true)
  })

  // A poll failing every few seconds must not toast every few seconds.
  it('suppresses the same message during the cooldown', () => {
    expect(shouldToast('boom', 0)).toBe(true)
    expect(shouldToast('boom', 1_000)).toBe(false)
    expect(shouldToast('boom', TOAST_COOLDOWN_MS - 1)).toBe(false)
  })

  it('shows it again once the cooldown lapses', () => {
    expect(shouldToast('boom', 0)).toBe(true)
    expect(shouldToast('boom', TOAST_COOLDOWN_MS)).toBe(true)
  })

  it('does not let one noisy message mute a different one', () => {
    expect(shouldToast('boom', 0)).toBe(true)
    expect(shouldToast('a different failure', 1_000)).toBe(true)
  })
})

describe('userMessage', () => {
  it('names a connection problem, which the user can act on', () => {
    for (const raw of ['Network Error', 'Failed to fetch', 'timeout of 5000ms exceeded']) {
      expect(userMessage(new Error(raw))).toContain('Lost connection')
    }
  })

  it('falls back to something honest for anything else', () => {
    expect(userMessage(new TypeError("Cannot read properties of null (reading 'categories')")))
      .toBe('Something went wrong. The screen may not be up to date.')
  })

  it('reads the reason of a rejected promise', () => {
    expect(userMessage({ reason: { message: 'Network Error' } })).toContain('Lost connection')
  })

  it('survives being handed nothing useful', () => {
    expect(userMessage(null)).toBeTruthy()
    expect(userMessage(undefined)).toBeTruthy()
    expect(userMessage('a bare string')).toBeTruthy()
  })
})
