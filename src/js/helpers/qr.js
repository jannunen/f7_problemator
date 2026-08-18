/**
 * QR scanning helpers.
 *
 * Kept out of the component so they can be tested without mounting a camera,
 * and so the parsing rules live in one place.
 */

/**
 * Pull the problem id out of a scanned code.
 *
 * Our QR codes encode a URL ending in the id, e.g.
 * https://pwa.problemator.fi/#!/problem/67243
 *
 * Returns null for anything else. The previous version ran a regex and then
 * indexed [1] on the result without checking it matched, so pointing the
 * camera at any other QR code threw inside the detect handler.
 */
export function extractProblemId(value) {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null
  const matches = String(value).match(/(\d+)\s*$/)
  return matches ? matches[1] : null
}

/**
 * Turn a getUserMedia failure into something a climber can act on.
 *
 * Every branch of the original handler was empty, so a camera that failed to
 * start produced no message at all — which is why a failed second scan looked
 * like the reader simply not recognising the code.
 */
export function describeCameraError(error, t = (k) => k) {
  const byName = {
    NotAllowedError: ['qr_err_denied_title', 'qr_err_denied_hint'],
    NotFoundError: ['qr_err_nocamera_title', 'qr_err_nocamera_hint'],
    NotSupportedError: ['qr_err_insecure_title', 'qr_err_insecure_hint'],
    NotReadableError: ['qr_err_inuse_title', 'qr_err_inuse_hint'],
    OverconstrainedError: ['qr_err_nocamera_title', 'qr_err_nocamera_hint'],
    StreamApiNotSupportedError: ['qr_err_unsupported_title', 'qr_err_unsupported_hint'],
  }
  const [titleKey, hintKey] =
    byName[error?.name] ?? ['qr_err_generic_title', 'qr_err_generic_hint']
  return { title: t(`searchprob.${titleKey}`), hint: t(`searchprob.${hintKey}`) }
}
