import { supabase, redirectTo, socialAuthAvailable } from '@js/supabase.js'
import { isNative } from '@js/platform.js'

/**
 * Signing in with Apple or Google, on the web and in the native shells.
 *
 * The two differ in one respect only: where the provider's redirect lands. On
 * the web it lands back on our own origin and supabase-js picks the session up
 * off the URL. Native has no origin to land on, so the round trip goes out to
 * the system browser, comes back through the app's URL scheme, and we finish
 * the PKCE exchange by hand.
 *
 * The system browser is not a detail we could skip. Google refuses OAuth in an
 * embedded WebView outright, and running it in ours would also hand the page
 * the app's own storage.
 */

export const PROVIDERS = ['apple', 'google']

/** Resolves the pending native sign-in when the deep link arrives. */
let pendingNativeSignIn = null

/**
 * Start a sign-in and resolve with a Supabase access token.
 *
 * Rejects if the user backs out or the provider refuses.
 */
export async function signInWith(provider) {
  if (!socialAuthAvailable) {
    throw new Error('Social sign-in is not configured in this build.')
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      // On native we drive the browser ourselves; letting supabase-js navigate
      // would send the app's own WebView to the provider and leave nothing to
      // come back to.
      skipBrowserRedirect: isNative
    }
  })

  if (error) throw error

  if (!isNative) {
    // The page is on its way to the provider; the session is picked up on the
    // way back, by handleWebRedirect().
    return null
  }

  const { Browser } = await import('@capacitor/browser')
  const finished = new Promise((resolve, reject) => {
    pendingNativeSignIn = { resolve, reject }
  })

  await Browser.open({ url: data.url, presentationStyle: 'popover' })

  return finished
}

/**
 * Feed the deep link back in. Called from the appUrlOpen listener.
 *
 * Returns true when the link was ours, so the caller can leave unrelated deep
 * links alone.
 */
export async function handleNativeRedirect(url) {
  if (!url || !url.includes('auth-callback')) return false

  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.close()
  } catch {
    // Already dismissed by the user. Nothing to close, nothing to report.
  }

  const params = new URLSearchParams(url.split('?')[1] ?? '')
  const code = params.get('code')
  const errorDescription = params.get('error_description') ?? params.get('error')

  if (!code) {
    pendingNativeSignIn?.reject(new Error(errorDescription || 'Sign-in was cancelled.'))
    pendingNativeSignIn = null
    return true
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    pendingNativeSignIn?.reject(error)
  } else {
    pendingNativeSignIn?.resolve(data.session?.access_token ?? null)
  }
  pendingNativeSignIn = null

  return true
}

/**
 * On the web, the redirect lands back on our own page. supabase-js has already
 * consumed the URL by the time the app boots, so the session is simply there —
 * or it isn't, which is the ordinary case of a normal page load.
 */
export async function pendingWebSession() {
  if (isNative || !socialAuthAvailable) return null

  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/**
 * Drop the Supabase session once we hold a Problemator JWT.
 *
 * Local scope only: this is housekeeping so the app has exactly one notion of
 * being logged in, not a sign-out the user asked for, and it must not cost a
 * network round trip on a screen that has just finished waiting on two.
 */
export async function clearSupabaseSession() {
  if (!socialAuthAvailable) return
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // A stale local session is harmless; our JWT is what the app runs on.
  }
}
