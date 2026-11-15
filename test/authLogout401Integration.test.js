import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

/**
 * Review Focus item 2 of the Pinia migration plan: `src/js/app.js`'s
 * `setLogoutHandler`/`setTokenRefreshHandler` callbacks run at module scope —
 * no active component `setup()` — and call `useAuthStore(pinia)` with the
 * explicit shared instance. `test/stores/auth.store.test.js` already checks
 * that calling pattern directly (`useAuthStore(pinia).logout()` outside any
 * setup()), but that only proves the store itself tolerates being called
 * that way. It does not prove the real wiring: that a genuine 401 from axios
 * actually reaches that callback.
 *
 * This test exercises the real thing end-to-end: it installs the real
 * `jwtInterceptor()` response interceptor, registers the *same* callback
 * body `app.js` registers (the Pinia half of it — the router navigation
 * that follows is pre-existing routing plumbing this task does not change),
 * fires a request through a stubbed axios adapter that always answers 401,
 * and checks the shared `pinia` instance's auth store actually flips to
 * signed-out. Not just "it compiles" — the store state is asserted after a
 * real, unrecoverable 401 round-trips through axios.
 */
vi.hoisted(() => { globalThis.localStorage = {} })

const makeLocalStorageStub = () => {
  const data = {}
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}

// logout()'s one allowed call into the still-live Vuex store (`commit('climber', null)`)
// — mocked the same way test/stores/auth.store.test.js does, so this test does not
// need to pull in the real Vuex store.
vi.mock('../src/js/store.js', () => ({ default: { commit: vi.fn() } }))
vi.mock('@helpers/socialAuth.js', () => ({ signInWith: vi.fn(), clearSupabaseSession: vi.fn() }))
vi.mock('@js/api', () => ({
  default: { requestOtp: vi.fn(), verifyOtp: vi.fn(), socialExchange: vi.fn() },
  webendpoint: 'https://api.test',
  endpoint: 'https://api.test/api/v03',
}))

import store from '../src/js/store.js'
import { jwtInterceptor, setLogoutHandler, setTokenRefreshHandler } from '@js/helpers/jwt.interceptor.js'
import { endpoint } from '@js/api.js'
import { useAuthStore } from '../src/js/stores/auth.store.js'
import { pinia } from '../src/js/stores/index.js'

const REFRESH_URL = endpoint + '/auth/otp/refresh'
const originalAdapter = axios.defaults.adapter

// Installed exactly once, the same as app.js installs it exactly once at
// module scope — axios.interceptors has no public way to eject every
// handler between tests, and re-running jwtInterceptor() per test would
// stack a second pair of interceptors on the shared axios module.
// setLogoutHandler/setTokenRefreshHandler each keep only their most recent
// registration, so re-registering them per test (below) is enough to keep
// the two tests independent.
jwtInterceptor()

beforeEach(() => {
  globalThis.localStorage = makeLocalStorageStub()
  store.commit.mockReset()
})

afterEach(() => {
  axios.defaults.adapter = originalAdapter
})

describe('a real 401 through the real interceptor logs out via the module-scope pattern', () => {
  it('useAuthStore(pinia) flips to signed-out after an unrecoverable 401', async () => {
    const authStore = useAuthStore(pinia)
    // Start signed in, exactly as a climber using the app would be.
    authStore.setToken('a.real.jwt')
    authStore.isAuthenticated = true

    // The exact callback app.js registers for the 401 path, minus the
    // f7 router navigation that follows it (unrelated routing plumbing,
    // untouched by this task) — same explicit-instance call app.js makes.
    setLogoutHandler(() => {
      useAuthStore(pinia).logout()
    })
    setTokenRefreshHandler((token) => useAuthStore(pinia).setToken(token))

    // Every request 401s, including the refresh attempt itself — an
    // unrecoverable session, same as an expired/invalidated refresh token.
    axios.defaults.adapter = async (config) => {
      return Promise.reject({
        config,
        isAxiosError: true,
        response: { status: 401, data: {}, config },
      })
    }

    await expect(axios.get(endpoint + '/some-protected-endpoint')).rejects.toBeTruthy()

    expect(useAuthStore(pinia).isAuthenticated).toBe(false)
    expect(useAuthStore(pinia).accessToken).toBe(null)
    expect(store.commit).toHaveBeenCalledWith('climber', null)
  })
})

describe('a successful token refresh updates the auth store via the module-scope pattern', () => {
  it('useAuthStore(pinia).accessToken picks up the refreshed token', async () => {
    const authStore = useAuthStore(pinia)
    authStore.setToken('old.jwt')
    authStore.isAuthenticated = true

    setLogoutHandler(() => {
      useAuthStore(pinia).logout()
    })
    setTokenRefreshHandler((token) => useAuthStore(pinia).setToken(token))

    axios.defaults.adapter = async (config) => {
      if (config.url === REFRESH_URL) {
        return { config, status: 200, data: { access_token: 'new.jwt' }, headers: {} }
      }
      if (config.headers?.Authorization === 'Bearer new.jwt') {
        return { config, status: 200, data: { ok: true }, headers: {} }
      }
      return Promise.reject({
        config,
        isAxiosError: true,
        response: { status: 401, data: {}, config },
      })
    }

    const res = await axios.get(endpoint + '/some-protected-endpoint')

    expect(res.data).toEqual({ ok: true })
    expect(useAuthStore(pinia).accessToken).toBe('new.jwt')
    expect(useAuthStore(pinia).isAuthenticated).toBe(true)
    expect(localStorage.getItem('token')).toBe('new.jwt')
    // Logout must not have fired on the recoverable path.
    expect(store.commit).not.toHaveBeenCalledWith('climber', null)
  })
})
