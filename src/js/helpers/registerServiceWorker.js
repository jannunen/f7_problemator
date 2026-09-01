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
    return await nav.serviceWorker.register('/service-worker.js')
  } catch {
    // A failed registration should not be fatal — the app still works, just
    // without the update handover, and without offline caching.
    return null
  }
}
