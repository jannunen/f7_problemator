import { createClient } from '@supabase/supabase-js'
import { isNative } from '@js/platform.js'

/**
 * Supabase, used for exactly one thing: proving who somebody is when they sign
 * in with Apple or Google.
 *
 * It is not this app's session. The moment Supabase vouches for a user we hand
 * that token to our own API, get a Problemator JWT back, and drop the Supabase
 * session on the floor — so there is only ever one answer to "am I logged in",
 * and every other request in the app works exactly as it did before.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Whether social sign-in can work in this build at all.
 *
 * The buttons key off this rather than always rendering: a build without keys
 * showing an Apple button that fails on tap is worse than a build that shows
 * only the email form it can actually deliver.
 */
export const socialAuthAvailable = Boolean(url && anonKey)

/**
 * Where the provider sends the user back to.
 *
 * Native has no http origin to return to, so it returns through the app's own
 * URL scheme and Capacitor hands us the link. Both of these must be listed as
 * redirect URLs in the Supabase dashboard or the provider refuses the round
 * trip.
 */
export const redirectTo = isNative
  ? 'fi.problemator.app://auth-callback'
  : `${window.location.origin}/`

export const supabase = socialAuthAvailable
  ? createClient(url, anonKey, {
      auth: {
        // PKCE, and on native we parse the returned link ourselves — the
        // WebView never navigates to the redirect URL, so there is no URL for
        // Supabase to detect a session in.
        flowType: 'pkce',
        detectSessionInUrl: !isNative,
        persistSession: true,
        autoRefreshToken: false
      }
    })
  : null
