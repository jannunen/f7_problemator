import { Capacitor } from '@capacitor/core'

/**
 * Where the app is running.
 *
 * One module so the handful of native/web differences are decided in a single
 * place rather than scattered as ad-hoc checks. The list of things that differ
 * is deliberately short — if it grows, that is worth noticing rather than
 * absorbing, because a long list means the WebView approach is fighting the
 * platform.
 */

/** Running inside a Capacitor shell (an installed app), rather than a browser. */
export const isNative = Capacitor.isNativePlatform()

/** 'ios' | 'android' | 'web' */
export const platform = Capacitor.getPlatform()

export const isIOS = platform === 'ios'
export const isAndroid = platform === 'android'

/**
 * Framework7's browser history.
 *
 * On the web pushState gives real URLs and a working back button. Inside a
 * Capacitor shell the page is served from capacitor://localhost (iOS) or
 * https://localhost (Android), and there is no address bar for it to serve.
 */
export const useBrowserHistory = !isNative

/**
 * The root Framework7 pushes history against.
 *
 * Derived from wherever the page is actually being served, never configured.
 * pushState refuses any URL whose origin differs from the document's, so a
 * root that is even slightly wrong does not degrade — every navigation throws
 * SecurityError and the app stops moving.
 *
 * It used to come from VITE_REDIRECT_URI, pinned to https://localhost:3002/.
 * vite.config.js asks for port 3002 but did not insist on it, so a second dev
 * server — or yesterday's, still running — took 3003 and every route broke
 * against a root pointing at the other instance. An origin written down by
 * hand has to be kept in step with where the app really is, and this is what
 * happens the first time it is not.
 *
 * Only correct while the app is served from the root of its host, which it is
 * on localhost and at its public domain. Served from a subpath, this needs
 * that subpath appended.
 */
export function historyRootFrom(origin) {
  if (!origin) return '/'

  return origin.endsWith('/') ? origin : `${origin}/`
}

export const browserHistoryRoot = historyRootFrom(
  typeof window !== 'undefined' ? window.location?.origin : ''
)

/**
 * Where "update now" should send someone.
 *
 * On the web a reload picks up the new service worker and is genuinely how you
 * update. In a shipped binary a reload just reloads the same bundled app
 * forever — the update lives in the store.
 */
export const STORE_URLS = {
  ios: 'https://apps.apple.com/app/problemator/id0000000000',
  android: 'https://play.google.com/store/apps/details?id=fi.problemator.app',
}
