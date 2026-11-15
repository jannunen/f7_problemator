import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// The store reads localStorage while building its initial state (seeding
// isAuthenticated/accessToken from a stored token), same as store.js does.
const makeLocalStorageStub = (initial = {}) => {
  const data = { ...initial }
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}
vi.hoisted(() => { globalThis.localStorage = {} })

vi.mock('@js/api', () => ({
  default: {
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
    socialExchange: vi.fn(),
    getProfile: vi.fn(),
  },
}))
vi.mock('@helpers/socialAuth.js', () => ({
  signInWith: vi.fn(),
  clearSupabaseSession: vi.fn(),
}))

import api from '@js/api'
import { signInWith, clearSupabaseSession } from '@helpers/socialAuth.js'
import { useAuthStore } from '../../src/js/stores/auth.store.js'
import { useClimberStore } from '../../src/js/stores/climber.store.js'
import { useRankingsStore } from '../../src/js/stores/rankings.store.js'
import { pinia } from '../../src/js/stores/index.js'
import { queryClient } from '@js/queryClient'
import { queries } from '@js/queryKeys'

beforeEach(() => {
  globalThis.localStorage = makeLocalStorageStub()
  api.requestOtp.mockReset()
  api.verifyOtp.mockReset()
  api.socialExchange.mockReset()
  signInWith.mockReset()
  clearSupabaseSession.mockReset()
  // Resets the shared climber store, as a side effect making it Pinia's
  // active instance — so setActivePinia(createPinia()) runs after it, not
  // before, to restore the fresh local instance the bare useAuthStore()
  // calls below need for test isolation.
  useClimberStore(pinia).setFromProfile(null)
  setActivePinia(createPinia())
})

describe('useAuthStore initial state', () => {
  it('seeds isAuthenticated/accessToken as signed-out when no token is stored', () => {
    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.accessToken).toBe(null)
  })

  it('seeds isAuthenticated/accessToken from a stored token, not false/null', () => {
    globalThis.localStorage = makeLocalStorageStub({ token: 'stored-token' })
    const authStore = useAuthStore()
    expect(authStore.accessToken).toBe('stored-token')
    expect(authStore.isAuthenticated).toBe(true)
  })
})

describe('requestOtp', () => {
  it('calls api.requestOtp and sets authStep/authEmail/debugOtp', async () => {
    api.requestOtp.mockResolvedValue({ debug_code: '123456' })
    const authStore = useAuthStore()

    await authStore.requestOtp({ email: 'a@b.com', type: 'signin' })

    expect(api.requestOtp).toHaveBeenCalledWith({ email: 'a@b.com', type: 'signin' })
    expect(authStore.authEmail).toBe('a@b.com')
    expect(authStore.authType).toBe('signin')
    expect(authStore.authStep).toBe('otp_sent')
    expect(authStore.debugOtp).toBe('123456')
  })

  it('sets authError when the request fails', async () => {
    api.requestOtp.mockRejectedValue({ response: { data: { error: 'nope' } } })
    const authStore = useAuthStore()

    await authStore.requestOtp({ email: 'a@b.com', type: 'signin' })

    expect(authStore.authError).toBe('nope')
  })
})

describe('verifyOtp', () => {
  it('success sets isAuthenticated/user/accessToken', async () => {
    api.verifyOtp.mockResolvedValue({ access_token: 'tok-1', user: { id: 7 } })
    const authStore = useAuthStore()

    const ret = await authStore.verifyOtp({ email: 'a@b.com', code: '123456' })

    expect(ret).toEqual({ access_token: 'tok-1', user: { id: 7 } })
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user).toEqual({ id: 7 })
    expect(authStore.accessToken).toBe('tok-1')
    expect(authStore.authStep).toBe('idle')
  })

  it('failure sets authError and reverts authStep to otp_sent', async () => {
    api.verifyOtp.mockRejectedValue({ response: { data: { error: 'bad code' } } })
    const authStore = useAuthStore()

    await authStore.verifyOtp({ email: 'a@b.com', code: '000000' })

    expect(authStore.authError).toBe('bad code')
    expect(authStore.authStep).toBe('otp_sent')
    expect(authStore.isAuthenticated).toBe(false)
  })
})

describe('socialLogin', () => {
  it('returns null without calling the API when there is no supabase token yet', async () => {
    signInWith.mockResolvedValue(null)
    const authStore = useAuthStore()

    const ret = await authStore.socialLogin('google')

    expect(ret).toBe(null)
    expect(api.socialExchange).not.toHaveBeenCalled()
  })

  it('exchanges the supabase token and signs in, same as verifyOtp', async () => {
    signInWith.mockResolvedValue('supabase-tok')
    api.socialExchange.mockResolvedValue({ access_token: 'tok-2', user: { id: 9 } })
    const authStore = useAuthStore()

    const ret = await authStore.socialLogin('google')

    expect(api.socialExchange).toHaveBeenCalledWith('supabase-tok')
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user).toEqual({ id: 9 })
    expect(clearSupabaseSession).toHaveBeenCalled()
    expect(ret).toEqual({ access_token: 'tok-2', user: { id: 9 } })
  })
})

describe('completeSocialLogin', () => {
  it('does nothing when there is no pending token', async () => {
    const authStore = useAuthStore()
    const ret = await authStore.completeSocialLogin(null)
    expect(ret).toBe(null)
    expect(api.socialExchange).not.toHaveBeenCalled()
  })

  it('exchanges the token and signs in', async () => {
    api.socialExchange.mockResolvedValue({ access_token: 'tok-3', user: { id: 11 } })
    const authStore = useAuthStore()

    await authStore.completeSocialLogin('supabase-tok')

    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.accessToken).toBe('tok-3')
  })
})

describe('setToken', () => {
  it('updates accessToken and persists it via setAuthToken (localStorage)', () => {
    const authStore = useAuthStore()
    authStore.setToken('tok-4')
    expect(authStore.accessToken).toBe('tok-4')
    expect(localStorage.getItem('token')).toBe('tok-4')
  })
})

describe('logout', () => {
  it('resets auth fields and clears the Pinia climber store', () => {
    globalThis.localStorage = makeLocalStorageStub({ token: 'stored-token', gymid: '42' })
    const authStore = useAuthStore()
    authStore.user = { id: 1 }
    authStore.isAuthenticated = true
    authStore.authStep = 'otp_sent'
    authStore.authEmail = 'a@b.com'
    authStore.authError = 'oops'
    useClimberStore(pinia).setFromProfile({ id: 1 })

    authStore.logout()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.accessToken).toBe(null)
    expect(authStore.user).toBe(null)
    expect(authStore.authStep).toBe('idle')
    expect(authStore.authEmail).toBe('')
    expect(authStore.authError).toBe(null)
    expect(localStorage.getItem('gymid')).toBe(null)
    expect(useClimberStore(pinia).climber).toBe(null)
    expect(clearSupabaseSession).toHaveBeenCalled()
  })
})

describe('logout then a different climber signs in', () => {
  // Every cache entry below carries data about the climber who was signed
  // in. alltime-ticks is staleTime: Infinity, so nothing would ever refetch
  // it for the next climber; the competition entries carry userticks/
  // my_checkpoints; the rest are the archive and profile reads.
  const perClimberKeys = [
    ['profile', 42],
    ['alltime-ticks'],
    ['competition', 7],
    ['public-competition', 7],
    ['comp-results', 7],
    ['public-comp-results', 7],
    ['archive-dates'],
    ['archive-day', '2026-11'],
    ['climber-profile', 5],
  ]

  beforeEach(() => {
    queryClient.clear()
    api.getProfile.mockReset()
    useRankingsStore(pinia).reset()
  })

  it("drops the previous climber's cached data and ranking scope", async () => {
    globalThis.localStorage = makeLocalStorageStub({ token: 'climber-a', gymid: '42' })
    for (const key of perClimberKeys) queryClient.setQueryData(key, { owner: 'climber A' })
    // Not per-climber: logout must clear selectively, not wipe the cache.
    queryClient.setQueryData(['gyms'], ['gym list'])
    const rankings = useRankingsStore(pinia)
    rankings.seedFromProfile('fi')
    rankings.rankings = { data: ['climber A ranking page'] }

    useAuthStore(pinia).logout()

    for (const key of perClimberKeys) {
      expect(queryClient.getQueryData(key), JSON.stringify(key)).toBeUndefined()
    }
    expect(queryClient.getQueryData(['gyms'])).toEqual(['gym list'])
    expect(rankings.rankingTarget).toBe('global')
    expect(rankings.rankings).toBe(null)

    // Climber B signs in: their first profile fetch runs the real queryFn,
    // whose seedFromProfile must now take effect instead of being a no-op.
    api.getProfile.mockResolvedValue({
      profile: { settings: {} },
      climber: { id: 2 },
      gym: { country: 'se' },
    })
    await queries.profile(43).queryFn()

    expect(rankings.rankingTarget).toBe('se')
    expect(useClimberStore(pinia).climber).toEqual({ id: 2 })
  })
})

// Review Focus item 2: app.js's setLogoutHandler/setTokenRefreshHandler
// callbacks run at module scope, with no active component/setup() context.
// This exercises that exact access pattern: useAuthStore(pinia) with the
// explicit shared instance, called the way app.js really calls it.
describe('module-scope usage (no component context)', () => {
  it('useAuthStore(pinia).logout() succeeds when called outside any setup()', () => {
    globalThis.localStorage = makeLocalStorageStub({ token: 'stored-token' })
    // Seed signed-in state the same way the real app would: through the
    // shared `pinia` instance, not the per-test local one `useAuthStore()`
    // (no args) would attach to via setActivePinia.
    const authStore = useAuthStore(pinia)
    authStore.setToken('module-scope-token')
    authStore.isAuthenticated = true
    useClimberStore(pinia).setFromProfile({ id: 1 })

    expect(() => useAuthStore(pinia).logout()).not.toThrow()

    expect(useAuthStore(pinia).isAuthenticated).toBe(false)
    expect(useAuthStore(pinia).accessToken).toBe(null)
    expect(useClimberStore(pinia).climber).toBe(null)
  })

  it('useAuthStore(pinia).setToken(token) succeeds when called outside any setup()', () => {
    expect(() => useAuthStore(pinia).setToken('refreshed-token')).not.toThrow()
    expect(useAuthStore(pinia).accessToken).toBe('refreshed-token')
  })
})
