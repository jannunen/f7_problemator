import { describe, it, expect } from 'vitest'
import { shouldRegisterServiceWorker, isMeaningfulWaitingWorker, watchForWaitingWorker } from '../src/js/helpers/registerServiceWorker.js'

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

describe('isMeaningfulWaitingWorker', () => {
  it('is meaningful once something waits and an earlier worker already controlled the page', () => {
    expect(isMeaningfulWaitingWorker({ waiting: {}, controller: {} })).toBe(true)
  })

  it('is not meaningful with nothing waiting', () => {
    expect(isMeaningfulWaitingWorker({ waiting: null, controller: {} })).toBe(false)
  })

  // The first-visit case: a worker installs and waits, but nothing has ever
  // controlled this page before, so there is no earlier version to update
  // *from*. Prompting here would just be noise on someone's first visit.
  it('is not meaningful on a first-ever registration, even if something is waiting', () => {
    expect(isMeaningfulWaitingWorker({ waiting: {}, controller: null })).toBe(false)
  })
})

describe('watchForWaitingWorker', () => {
  // A tiny fake EventTarget: register handlers per event name, fire them on
  // demand. Mirrors the `workerEnv` fake in update.test.js.
  function fakeEventTarget() {
    const listeners = {}
    return {
      addEventListener: (event, handler) => {
        (listeners[event] ||= []).push(handler)
      },
      emit: (event) => {
        (listeners[event] || []).forEach((h) => h())
      },
    }
  }

  function fakeRegistration({ waiting = null } = {}) {
    const target = fakeEventTarget()
    return { waiting, installing: null, ...target }
  }

  function fakeNav({ controller = null } = {}) {
    const target = fakeEventTarget()
    return { serviceWorker: { controller, ...target } }
  }

  it('reports immediately when a worker is already waiting with an earlier controller in place', () => {
    const registration = fakeRegistration({ waiting: {} })
    const nav = fakeNav({ controller: {} })
    const seen = []
    watchForWaitingWorker(registration, { nav, onWaitingChange: (v) => seen.push(v) })
    expect(seen).toEqual([true])
  })

  it('stays quiet on a first-ever registration even if a worker is already waiting', () => {
    const registration = fakeRegistration({ waiting: {} })
    const nav = fakeNav({ controller: null })
    const seen = []
    watchForWaitingWorker(registration, { nav, onWaitingChange: (v) => seen.push(v) })
    expect(seen).toEqual([false])
  })

  it('reports true once a newly found worker finishes installing over an existing controller', () => {
    const registration = fakeRegistration()
    const nav = fakeNav({ controller: {} })
    const seen = []
    watchForWaitingWorker(registration, { nav, onWaitingChange: (v) => seen.push(v) })

    const installing = fakeEventTarget()
    installing.state = 'installing'
    registration.installing = installing
    registration.emit('updatefound')

    installing.state = 'installed'
    installing.emit('statechange')

    expect(seen).toEqual([false, true])
  })

  // The scenario the previous agent flagged as unconfirmed: someone's very
  // first visit, where a worker installs with nothing previously controlling
  // the page. This must never flip the banner on.
  it('never reports true for a worker installing on a first-ever visit', () => {
    const registration = fakeRegistration()
    const nav = fakeNav({ controller: null })
    const seen = []
    watchForWaitingWorker(registration, { nav, onWaitingChange: (v) => seen.push(v) })

    const installing = fakeEventTarget()
    installing.state = 'installing'
    registration.installing = installing
    registration.emit('updatefound')

    installing.state = 'installed'
    installing.emit('statechange')

    expect(seen).toEqual([false, false])
  })

  it('reports false again once the waiting worker takes over', () => {
    const registration = fakeRegistration({ waiting: {} })
    const nav = fakeNav({ controller: {} })
    const seen = []
    watchForWaitingWorker(registration, { nav, onWaitingChange: (v) => seen.push(v) })

    nav.serviceWorker.emit('controllerchange')

    expect(seen).toEqual([true, false])
  })
})
