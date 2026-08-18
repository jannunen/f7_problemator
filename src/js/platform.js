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
 * On the web the app lives at pwa.problemator.fi and pushState gives real URLs
 * and a working back button. Inside a Capacitor shell the page is served from
 * capacitor://localhost (iOS) or https://localhost (Android), so pushing state
 * against a root of https://pwa.problemator.fi does not match the actual
 * origin. There is also no address bar for it to serve.
 */
export const useBrowserHistory = !isNative

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
