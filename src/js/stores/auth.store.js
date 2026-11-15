import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@js/api'
import { signInWith, clearSupabaseSession } from '@helpers/socialAuth.js'
import { setAuthToken, readStoredToken } from '../authToken.js'
import { useUiStore } from './ui.store.js'
import { pinia } from './index.js'
import store from '../store.js'

/**
 * Auth/session state: OTP sign-in, social sign-in, token state, logout.
 *
 * Ported from the Vuex store 1:1 — no behavior change, apart from the
 * camelCase field names (`accessToken`, `expiresIn`) a Pinia setup store
 * uses in place of Vuex's `access_token`/`expires_in`.
 *
 * `isAuthenticated` and `accessToken` are seeded directly from storage here,
 * exactly as store.js's state initializer did (`access_token:
 * readStoredToken()`, `isAuthenticated: !!readStoredToken()`): a returning
 * climber with a stored token must read as signed in on the very first
 * render, not only after some later action happens to run.
 *
 * `login`/`setUser` are confirmed dead (zero dispatch sites) and are not
 * ported. `socialLogin`/`completeSocialLogin` are dead-but-wired — the
 * backend's Supabase-exchange route was removed months ago, so they
 * currently fail if ever invoked — but are ported faithfully anyway.
 *
 * `logout()` keeps calling into the still-live Vuex `store` for the two
 * pieces of state that remain Vuex's own domain and are out of scope for
 * this migration (`state.climber`, and `state.profile`/`state.profileLoaded`
 * — see the migration plan's Global Constraints "`state.climber` boundary"
 * and Task 7), plus the `ready` flag that already lives in the Pinia ui
 * store (bridged the same way `store.js`'s `getProfile`/`changeGym` already
 * bridge into it). This is the only way to drop logout's Vuex action
 * entirely without changing what climbers see on screen.
 */
export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(!!readStoredToken())
  const accessToken = ref(readStoredToken())
  const authStep = ref('idle') // idle, otp_sent, verifying
  const debugOtp = ref(null) // dev-only: the code, when the API runs with debug on
  const authEmail = ref('')
  const authType = ref('signin')
  const authError = ref(null)
  const user = ref(null)
  const expiresIn = ref(null)

  /**
   * Set or clear the token. Mirrors the old `setToken` mutation
   * (`state.access_token = payload; setAuthToken(payload)`). Exposed as its
   * own action, not just inlined in the other actions, because
   * `src/js/app.js`'s module-scope token-refresh handler calls it standalone
   * via `useAuthStore(pinia).setToken(token)`.
   */
  function setToken(token) {
    accessToken.value = token
    // Through setAuthToken, not localStorage directly: it is what anything
    // waiting on sign-in is watching, and it refuses to store the string
    // "null" the way this used to on logout.
    setAuthToken(token)
  }

  async function requestOtp(payload) {
    authError.value = null
    authEmail.value = payload.email
    authType.value = payload.type
    try {
      const ret = await api.requestOtp(payload)
      // Only ever present when the API runs with debug on outside
      // production; in every real build this is undefined.
      debugOtp.value = ret?.debug_code ?? null
      authStep.value = 'otp_sent'
    } catch (err) {
      authError.value = err.response?.data?.error || 'Failed to send code.'
    }
  }

  async function verifyOtp(payload) {
    authError.value = null
    authStep.value = 'verifying'
    try {
      const ret = await api.verifyOtp(payload)
      setToken(ret.access_token)
      user.value = ret.user
      isAuthenticated.value = true
      authStep.value = 'idle'
      return ret
    } catch (err) {
      authStep.value = 'otp_sent'
      authError.value = err.response?.data?.error || 'Verification failed.'
    }
  }

  /**
   * Apple / Google sign-in.
   *
   * Ends in exactly the same state as verifyOtp — same token, same user, same
   * flags — because it ends at the same API contract. The only extra step is
   * dropping the Supabase session afterwards, so nothing in the app has two
   * competing answers to whether someone is signed in.
   */
  async function socialLogin(provider) {
    authError.value = null
    authStep.value = 'verifying'
    try {
      const supabaseToken = await signInWith(provider)

      // Web only: the page is navigating away to the provider. There is no
      // token yet and nothing to fail — completion happens on the way back.
      if (!supabaseToken) return null

      const ret = await api.socialExchange(supabaseToken)
      setToken(ret.access_token)
      user.value = ret.user
      isAuthenticated.value = true
      authStep.value = 'idle'
      await clearSupabaseSession()
      return ret
    } catch (err) {
      authStep.value = 'idle'
      authError.value = err.response?.data?.error || err.message || 'Sign-in failed.'
      await clearSupabaseSession()
      return null
    }
  }

  /**
   * Finish a sign-in that started before a redirect or a trip out to the
   * system browser. Safe to call on every launch: with nothing pending it
   * does nothing.
   */
  async function completeSocialLogin(supabaseToken) {
    if (!supabaseToken) return null
    try {
      const ret = await api.socialExchange(supabaseToken)
      setToken(ret.access_token)
      user.value = ret.user
      isAuthenticated.value = true
      authStep.value = 'idle'
      await clearSupabaseSession()
      return ret
    } catch (err) {
      authStep.value = 'idle'
      authError.value = err.response?.data?.error || 'Sign-in failed.'
      await clearSupabaseSession()
      return null
    }
  }

  function logout() {
    localStorage.removeItem('gymid')
    setToken(null)
    user.value = null
    // state.climber is out of scope for this entire migration plan (see the
    // plan's Global Constraints) — keep writing it through the still-live
    // Vuex store exactly as the old action did.
    store.commit('climber', null)
    isAuthenticated.value = false
    // profile/profileLoaded belong to the Profile/bootstrap domain (a later
    // task), not Auth — same reasoning as climber above: keep writing them
    // through the still-live Vuex store so logging out still clears a now-
    // stale profile from screen, rather than silently dropping that behavior.
    store.commit('profile', { settings: null })
    store.commit('profileLoaded', false)
    authStep.value = 'idle'
    authEmail.value = ''
    authError.value = null
    // Mirrors the bridge store.js's getProfile/changeGym already use to
    // reach the Pinia ui store from old Vuex code.
    useUiStore(pinia).setReady(true)
    clearSupabaseSession()
  }

  return {
    isAuthenticated,
    accessToken,
    authStep,
    debugOtp,
    authEmail,
    authType,
    authError,
    user,
    expiresIn,
    setToken,
    requestOtp,
    verifyOtp,
    socialLogin,
    completeSocialLogin,
    logout,
  }
})
