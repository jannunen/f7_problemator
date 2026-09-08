/**
 * The invariant this whole check exists to enforce: index.html and the
 * entry bundle it references must never be able to disagree about what
 * build a visitor gets. Either both are precached (so an offline visit
 * still gets a consistent pair) or neither is (so navigations always ask
 * the network and get a fresh HTML pointing at whatever bundle the server
 * actually has). Precaching the HTML while silently dropping the bundle it
 * points at — workbox's default 2 MB precache size cap did exactly that —
 * is what pinned every user to an old build with no new deploy ever taking
 * effect. See fix/service-worker-serves-stale-app.
 *
 * Split into pure functions so this is testable without a real build:
 * extraction (regex over build output) from judgment (is this consistent).
 */

/**
 * Pull the entry bundle path out of the built index.html's module script
 * tag, e.g. "assets/index.189c91a1.js".
 */
export function entryBundleFromHtml(indexHtml) {
  const match = indexHtml.match(/<script[^>]+type="module"[^>]+src="\.?\/?(assets\/index\.[^"]+\.js)"/)
  return match ? match[1] : null
}

/**
 * Pull the list of URLs workbox actually precached out of the generated
 * service worker's `precacheAndRoute([...])` call. Returns null if the
 * shape of workbox's output doesn't match what this was written against —
 * callers should treat that as "can't verify" and fail loudly, not as
 * "nothing precached".
 */
export function precachedUrlsFromServiceWorker(swSource) {
  const manifestMatch = swSource.match(/precacheAndRoute\(\[(.*?)\],\{/s)
  if (!manifestMatch) return null
  return [...manifestMatch[1].matchAll(/url:"([^"]+)"/g)].map((m) => m[1])
}

/**
 * The judgment call itself: given what's actually precached, is index.html
 * consistent with its own entry bundle? Returns an error message describing
 * the problem, or null when it's fine either way (both precached, or
 * neither).
 */
export function precacheConsistencyIssue({ entryBundle, precachedUrls }) {
  const htmlPrecached = precachedUrls.includes('index.html')
  const bundlePrecached = precachedUrls.includes(entryBundle)

  if (htmlPrecached && !bundlePrecached) {
    return `index.html is precached but its entry bundle (${entryBundle}) is not. ` +
      'A precached index.html always points at whatever bundle existed at build ' +
      'time — if that bundle is not precached too (e.g. it exceeds ' +
      'maximumFileSizeToCacheInBytes in workbox-config.js), visitors get stuck on ' +
      'that HTML forever while the bundle it references keeps changing underneath ' +
      'it. Either exclude index.html from the precache (let navigations hit the ' +
      'network, as workbox-config.js does today) or raise ' +
      'maximumFileSizeToCacheInBytes so the entry bundle is precached too.'
  }

  return null
}
