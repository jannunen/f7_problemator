import { ref } from 'vue'
import { isNative } from '@js/platform.js'

/**
 * Whether this session should try to register the app's service worker.
 *
 * `npm run build` runs `workbox generateSW` and has always emitted
 * www/service-worker.js — but nothing in the app ever called
 * `navigator.serviceWorker.register`, so it has never actually been
 * installed on a single device. That, not the lack of `skipWaiting`, is why
 * a deploy landing on the server never reached anyone: the handover logic in
 * update.js (`activateWaitingWorker`) has been dead code, always finding no
 * registration to hand over from.
 *
 * Pure so the decision is testable without a browser. The registration call
 * itself is not: `navigator.serviceWorker.register` has no meaningful fake
 * short of reimplementing the API.
 */
export function shouldRegisterServiceWorker({ native = isNative, hasServiceWorker, isProd } = {}) {
  // Native: "update now" already sends people to the store (see
  // helpers/update.js), and a Capacitor shell has no CI deploy for a service
  // worker to catch — nothing for it to do there.
  if (native) return false
  // No support, or not the file `npm run build` actually emits. `npm run dev`
  // serves no service-worker.js at all — registering it there is a 404 on
  // every reload and never anything caught in production.
  if (!hasServiceWorker || !isProd) return false
  return true
}

/**
 * Whether the app should tell the user an update is ready.
 *
 * The banner in LeftSidepanel.vue reads this directly. It flips true once a
 * worker sits in `registration.waiting` with an existing controller — i.e.
 * this device already had an older worker serving the page, and a newer one
 * has since installed and is holding back for `activateWaitingWorker` (see
 * update.js) to hand it the page.
 *
 * It stays false on this device's very first registration: a worker installs
 * there too, but with nothing previously controlling the page there is
 * nothing to update *from*, and prompting on someone's first visit is noise.
 * See isMeaningfulWaitingWorker below for that check.
 */
export const waitingWorkerAvailable = ref(false)

/**
 * Whether a waiting worker is one worth telling the user about — see
 * waitingWorkerAvailable above. Split out as a pure function so the decision
 * is testable without a browser; `controller` is `navigator.serviceWorker.
 * controller`, non-null only once some worker has already served this page.
 */
export function isMeaningfulWaitingWorker({ waiting, controller }) {
  return !!waiting && !!controller
}

/**
 * Wire up `registration` so `onWaitingChange` fires whenever the answer to
 * "is a meaningful update waiting" changes.
 *
 * A worker reaches `waiting` two ways, both covered here:
 *  - It already was, by the time this session's `.register()` resolved — a
 *    previous tab, or an earlier visit, left it there.
 *  - It gets there while this page is open: `updatefound` fires, the new
 *    worker is `registration.installing`, and (workbox's `skipWaiting: false`
 *    keeps it from going further) it settles in `waiting` after reaching the
 *    `installed` state.
 *
 * `controllerchange` fires once activateWaitingWorker (update.js) hands the
 * page to that worker, at which point there is no longer anything waiting.
 */
export function watchForWaitingWorker(registration, { nav, onWaitingChange }) {
  const controller = () => nav.serviceWorker.controller

  onWaitingChange(isMeaningfulWaitingWorker({ waiting: registration.waiting, controller: controller() }))

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing
    if (!installing) return
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed') {
        onWaitingChange(isMeaningfulWaitingWorker({ waiting: true, controller: controller() }))
      }
    })
  })

  nav.serviceWorker.addEventListener('controllerchange', () => onWaitingChange(false))
}

/**
 * Register the workbox-generated worker so a deploy has something to hand
 * off to. Deliberately does not decide *when* to activate it — `skipWaiting`
 * stays off in workbox-config.js so nothing swaps under a page mid-session;
 * see activateWaitingWorker in update.js and the update banner in
 * LeftSidepanel.vue for the explicit "a new version is ready" handover this
 * makes possible.
 */
export async function registerServiceWorker(deps = {}) {
  const {
    nav = typeof navigator === 'undefined' ? null : navigator,
    isProd = import.meta.env?.PROD,
  } = deps

  if (!shouldRegisterServiceWorker({ hasServiceWorker: !!nav && 'serviceWorker' in nav, isProd })) {
    return null
  }

  try {
    const registration = await nav.serviceWorker.register('/service-worker.js')
    watchForWaitingWorker(registration, {
      nav,
      onWaitingChange: (waiting) => { waitingWorkerAvailable.value = waiting },
    })
    return registration
  } catch {
    // A failed registration should not be fatal — the app still works, just
    // without the update handover, and without offline caching.
    return null
  }
}
