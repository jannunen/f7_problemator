import { describe, it, expect } from 'vitest'
import { updateTarget, performUpdate } from '../src/js/helpers/update.js'

describe('updateTarget', () => {
  it('reloads on the web, where that is genuinely how a PWA updates', () => {
    expect(updateTarget({ native: false })).toEqual({ kind: 'reload' })
  })

  // The bug this prevents: a reload inside a shipped binary re-runs the same
  // bundled app, so "update now" appears to do nothing, forever.
  it('sends a native build to its store listing, not a reload', () => {
    expect(updateTarget({ native: true, ios: true }).kind).toBe('store')
    expect(updateTarget({ native: true, ios: true }).url).toContain('apps.apple.com')
    expect(updateTarget({ native: true, ios: false }).url).toContain('play.google.com')
  })

  it('uses the right store per platform', () => {
    expect(updateTarget({ native: true, ios: false }).url).toContain('fi.problemator.app')
  })
})

describe('performUpdate', () => {
  it('calls reload on web and never opens a URL', () => {
    let reloaded = false
    let opened = null
    performUpdate({
      target: { kind: 'reload' },
      reload: () => { reloaded = true },
      open: (u) => { opened = u },
    })
    expect(reloaded).toBe(true)
    expect(opened).toBeNull()
  })

  it('opens the store on native and never reloads', () => {
    let reloaded = false
    let opened = null
    performUpdate({
      target: { kind: 'store', url: 'https://example.store/app' },
      reload: () => { reloaded = true },
      open: (u) => { opened = u },
    })
    expect(reloaded).toBe(false)
    expect(opened).toBe('https://example.store/app')
  })
})
