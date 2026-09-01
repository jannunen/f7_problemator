import { describe, it, expect } from 'vitest'
import { shouldRegisterServiceWorker } from '../src/js/helpers/registerServiceWorker.js'

describe('shouldRegisterServiceWorker', () => {
  it('registers on a production web build that supports service workers', () => {
    expect(shouldRegisterServiceWorker({ native: false, hasServiceWorker: true, isProd: true })).toBe(true)
  })

  // The actual bug: workbox has emitted www/service-worker.js on every build
  // all along, but nothing ever called .register() — so the update handover
  // in update.js always found no registration to hand over from.
  it('skips native — the store listing is the update path there, not a service worker', () => {
    expect(shouldRegisterServiceWorker({ native: true, hasServiceWorker: true, isProd: true })).toBe(false)
  })

  it('skips a browser with no service worker support', () => {
    expect(shouldRegisterServiceWorker({ native: false, hasServiceWorker: false, isProd: true })).toBe(false)
  })

  // `npm run dev` never emits service-worker.js — registering there is a 404
  // on every reload and catches nothing real.
  it('skips outside a production build', () => {
    expect(shouldRegisterServiceWorker({ native: false, hasServiceWorker: true, isProd: false })).toBe(false)
  })
})
