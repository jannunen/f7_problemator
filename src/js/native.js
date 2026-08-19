import { isNative, isAndroid } from '@js/platform.js'
import { handleNativeRedirect } from '@helpers/socialAuth.js'

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

  // Status bar and splash are handled separately, and setOverlaysWebView is
  // guarded by platform. It is an Android-only method: on iOS it rejects with
  // UNIMPLEMENTED, and when all three were chained in one try/catch that
  // rejection skipped SplashScreen.hide() too. The splash then stayed up over
  // the app on every single iOS launch until Capacitor's own timeout pulled
  // it — which is not the harmless case the old comment claimed.
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    if (isAndroid) {
      await StatusBar.setOverlaysWebView({ overlay: false })
    }
    await StatusBar.setStyle({ style: Style.Dark })
  } catch (e) {
    console.warn('status bar setup skipped:', e?.message ?? e)
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch (e) {
    console.warn('splash hide skipped:', e?.message ?? e)
  }
}

/**
 * Deep links back into the app.
 *
 * Social sign-in leaves the app for the system browser and has to be let back
 * in; the URL scheme that carries it is registered in the iOS and Android
 * projects. Links we do not recognise are ignored rather than swallowed, so
 * adding another one later is a matter of adding a handler here.
 */
export async function registerDeepLinks() {
  if (!isNative) return
  const { App } = await import('@capacitor/app')
  App.addListener('appUrlOpen', async ({ url }) => {
    await handleNativeRedirect(url)
  })
}
