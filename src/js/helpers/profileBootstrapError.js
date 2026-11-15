/**
 * What a failed profile-bootstrap fetch means for the session.
 *
 * Mirrors the old getProfile dispatch's try/catch in app.vue: ANY rejection —
 * a network error, a 500, not only an expired/invalid token — logged the
 * climber out. That is broader than the old comment's "Session expired or
 * invalid token" framing suggests (a 401 that cannot be refreshed already
 * logs out on its own, via the jwt interceptor's forceLogout — see
 * jwt.interceptor.js), but it is the behavior climbers saw before this
 * migration, and porting Profile/bootstrap to TanStack Query is not licence
 * to quietly narrow it.
 *
 * Pulled out of app.vue's watch callback rather than inlined: app.vue is a
 * Vue SFC, and this test suite has no jsdom/@vue/test-utils to mount one, so
 * the only way to pin this behavior with a test is a plain function a test
 * can call directly — the same reason jwt.interceptor.js pulls
 * classifyAuthError out of the interceptor itself.
 */
export function handleProfileBootstrapError(error, logout) {
  if (error == null) return
  console.warn('Profile could not be loaded, redirecting to login', error)
  logout()
}
