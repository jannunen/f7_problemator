/**
 * App version handling.
 *
 * One source of truth: the `version` field in package.json, injected at build
 * time by vite-plugin-package-version as `import.meta.env.PACKAGE_VERSION`.
 *
 * Three things were wrong before:
 *
 *  1. The "new version available" banner tested `serverVersion != version`.
 *     The backend advertised 0.8.10 while the app was 1.3.2, so the test was
 *     permanently true and every user saw an update prompt on every launch.
 *
 *  2. Even in sync, `!=` fires on a DOWNGRADE and on any formatting difference
 *     ("1.4.0" vs "1.4"). The real question is "is the server offering
 *     something newer", which means comparing numbers, not strings.
 *
 *  3. Nothing produced a build number. Play needs a monotonically increasing
 *     integer versionCode and the App Store needs CFBundleVersion; deriving
 *     both from the version keeps one number to bump.
 */

/** Parse "1.4.0" into [1, 4, 0]. Tolerates "v1.4", "1.4.0-beta.2", null. */
export function parseVersion(v) {
  if (typeof v !== 'string') return null
  const m = v.trim().replace(/^v/i, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
  if (!m) return null
  return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)]
}

/** -1 if a < b, 0 if equal, 1 if a > b. null if either cannot be parsed. */
export function compareVersions(a, b) {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (pa == null || pb == null) return null
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1
  }
  return 0
}

/**
 * Should the user be told an update is waiting?
 *
 * Only when the server advertises something strictly newer. A missing or
 * unparseable server version means "we do not know", which must stay silent —
 * that is precisely the state the app was stuck in.
 */
export function isUpdateAvailable(localVersion, serverVersion) {
  return compareVersions(serverVersion, localVersion) === 1
}

/**
 * Store build number, derived so there is still only one number to bump.
 * 1.4.0 -> 10400, 1.4.12 -> 10412, 2.0.0 -> 20000. Monotonic as long as minor
 * and patch stay below 100.
 */
export function buildNumber(v) {
  const p = parseVersion(v)
  if (p == null) return null
  const [major, minor, patch] = p
  if (minor > 99 || patch > 99) return null
  return major * 10000 + minor * 100 + patch
}

/**
 * The version this build was compiled from.
 *
 * No `?.` before `PACKAGE_VERSION`: vite-plugin-package-version injects it by
 * textually replacing the exact expression `import.meta.env.PACKAGE_VERSION`
 * at build time. `import.meta.env?.PACKAGE_VERSION` is a different
 * expression — it survives untouched and instead reads a property off
 * Vite's own bare `import.meta.env` replacement, which only carries MODE,
 * DEV, PROD, BASE_URL and SSR. The optional chaining silently produced
 * '0.0.0' in every production build; nothing had consumed APP_VERSION yet
 * to notice.
 */
export const APP_VERSION = import.meta.env.PACKAGE_VERSION ?? '0.0.0'
