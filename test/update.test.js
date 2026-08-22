import { describe, it, expect } from 'vitest'
import { updateTarget, performUpdate, activateWaitingWorker } from '../src/js/helpers/update.js'

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
  it('calls reload on web and never opens a URL', async () => {
    let reloaded = false
    let opened = null
    await performUpdate({
      target: { kind: 'reload' },
      activate: async () => true,
      reload: () => { reloaded = true },
      open: (u) => { opened = u },
    })
    expect(reloaded).toBe(true)
    expect(opened).toBeNull()
  })

  it('opens the store on native and never reloads', async () => {
    let reloaded = false
    let opened = null
    await performUpdate({
      target: { kind: 'store', url: 'https://example.store/app' },
      reload: () => { reloaded = true },
      open: (u) => { opened = u },
    })
    expect(reloaded).toBe(false)
    expect(opened).toBe('https://example.store/app')
  })
})

describe('handing over to a waiting service worker', () => {
  const workerEnv = ({ waiting, onMessage }) => ({
    serviceWorker: {
      getRegistration: async () => ({
        update: async () => {},
        waiting: waiting ? { postMessage: onMessage } : null,
      }),
      addEventListener: (event, handler) => {
        // The browser fires this once the new worker controls the page.
        if (event === 'controllerchange') setTimeout(handler, 0)
      },
    },
  })

  it('asks a waiting worker to take over', async () => {
    let asked = null
    const took = await activateWaitingWorker({
      nav: workerEnv({ waiting: true, onMessage: (m) => { asked = m } }),
    })
    expect(took).toBe(true)
    expect(asked).toEqual({ type: 'SKIP_WAITING' })
  })

  it('does nothing when no worker is waiting', async () => {
    // Nothing to hand over to: reloading is still correct, but there is no
    // message to send and no controllerchange to wait for.
    const took = await activateWaitingWorker({ nav: workerEnv({ waiting: false }) })
    expect(took).toBe(false)
  })

  it('survives a browser with no service worker at all', async () => {
    expect(await activateWaitingWorker({ nav: {} })).toBe(false)
  })

  it('hands over before reloading, not after', async () => {
    // Reloading first re-serves the old precache, and the button looks broken.
    const order = []
    await performUpdate({
      target: { kind: 'reload' },
      activate: async () => { order.push('activate') },
      reload: () => { order.push('reload') },
      open: () => {},
    })
    expect(order).toEqual(['activate', 'reload'])
  })
})
