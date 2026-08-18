import { isNative, isIOS, STORE_URLS } from '@js/platform.js'

/**
 * What "update now" should actually do.
 *
 * On the web, reloading fetches the new service worker and its precache, which
 * is genuinely how a PWA updates.
 *
 * In a shipped binary a reload re-runs the same bundled app forever. The new
 * version is in the store, so that is where the button has to go. Getting this
 * wrong produces the worst kind of bug report — "I pressed update and nothing
 * happened", repeatedly, with nothing in any log.
 */
export function updateTarget({ native = isNative, ios = isIOS } = {}) {
  if (!native) return { kind: 'reload' }
  return { kind: 'store', url: ios ? STORE_URLS.ios : STORE_URLS.android }
}

/** Perform it. Split from updateTarget so the decision is testable on its own. */
export function performUpdate(deps = {}) {
  const {
    target = updateTarget(),
    reload = () => window.location.reload(),
    open = (url) => window.open(url, '_system'),
  } = deps
  if (target.kind === 'reload') {
    reload()
    return target
  }
  open(target.url)
  return target
}
