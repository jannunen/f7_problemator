/**
 * A build identifier, distinct from the hand-managed semver in version.js.
 *
 * package.json's `version` means what it always meant — a release, bumped by
 * hand. It does not mean "this build" — every build since 1.5.0 read as
 * exactly that, "1.5.0", with nothing to tell a CI deploy apart from the one
 * before it. This adds a stamp that changes on every build without touching
 * that number.
 *
 * BUILD_SHA is `git rev-parse --short HEAD`, baked in at build time
 * (vite.config.js) the same way PACKAGE_VERSION is. A build with no `.git`
 * around — a tarball, a machine with no git installed — has nothing to
 * offer; the stamp falls back to the version alone rather than printing
 * "undefined" or failing the build.
 */

import { APP_VERSION } from '@js/version.js'

/** "1.5.0 (a3f9c21)" with a build id, plain "1.5.0" without one. */
export function formatBuildStamp(version, buildId) {
  return buildId ? `${version} (${buildId})` : version
}

/**
 * Short git SHA of the commit this build was compiled from, or null.
 *
 * No `?.` before BUILD_SHA — see the note on APP_VERSION in version.js.
 * Vite replaces the exact expression `import.meta.env.BUILD_SHA`; anything
 * else falls through to Vite's own bare `import.meta.env` object, which
 * does not carry this key and would silently read as undefined forever.
 */
export const BUILD_SHA = import.meta.env.BUILD_SHA ?? null

/** What a human should see: version plus, when known, the exact build. */
export const BUILD_STAMP = formatBuildStamp(APP_VERSION, BUILD_SHA)
