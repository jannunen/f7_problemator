import { isNative, isAndroid } from '@js/platform.js'

/**
 * Native shell behaviour.
 *
 * Everything here is a no-op on the web, so it can be called unconditionally
 * from app startup without the caller needing to know where it is running.
 */

/**
 * Android's hardware back button.
 *
 * Without this, back exits the app from anywhere — including from three pages
 * deep — which reads as a crash. Framework7 owns the navigation stack, so back
 * should pop it, and only exit when there is nothing left to pop.
 */
export async function registerBackButton(f7) {
  if (!isNative || !isAndroid) return
  const { App } = await import('@capacitor/app')
  App.addListener('backButton', ({ canGoBack }) => {
    const router = f7?.views?.main?.router
    // Prefer Framework7's own history: `canGoBack` describes the WebView, which
    // has no history at all here because browser history is off on native.
    if (router && router.history.length > 1) {
      router.back()
      return
    }
    if (canGoBack) {
      window.history.back()
      return
    }
    App.exitApp()
  })
}

/**
 * Status bar and splash.
 *
 * The app's own header sits at the top, so the status bar must not overlay it,
 * and the splash has to be dismissed explicitly or it stays up.
 */
export async function setupChrome() {
  if (!isNative) return
  try {
    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
    ])
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setStyle({ style: Style.Dark })
    await SplashScreen.hide()
  } catch (e) {
    // A missing plugin must not stop the app booting — worst case the splash
    // lingers, which is visible and harmless.
    console.warn('native chrome setup skipped:', e?.message ?? e)
  }
}
