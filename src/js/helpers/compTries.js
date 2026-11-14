// Try counts sent with a competition tick. A top always took at least one
// try, so anything that is not a positive integer becomes 1.
export const minOneTries = (v) => {
  const n = Math.trunc(Number(v))
  return Number.isFinite(n) && n >= 1 ? n : 1
}

const isMissing = (v) => v == null || (typeof v === 'number' && Number.isNaN(v))

/**
 * The try fields of a comp tick payload, from one row of the entry form's
 * local state (undefined when the row was never touched).
 *
 * - tries: always at least 1.
 * - tries_bonus: 0 still means "no bonus recorded", so a missing or 0 value
 *   stays 0; only a recorded bonus is held to at least 1.
 * - attempts_low_zone / attempts_high_zone: null means "not entered" and stays
 *   null; an entered value is at least 1.
 */
export const compTickTries = (row) => {
  const r = row ?? {}
  const bonus = Number(r.tries_bonus)
  return {
    tries: minOneTries(r.tries),
    tries_bonus: isMissing(r.tries_bonus) || !(bonus > 0) ? 0 : minOneTries(bonus),
    attempts_low_zone: isMissing(r.attempts_low_zone) ? null : minOneTries(r.attempts_low_zone),
    attempts_high_zone: isMissing(r.attempts_high_zone) ? null : minOneTries(r.attempts_high_zone),
  }
}

// PHP intval: the leading integer of a string, 0 when there is none.
const intval = (v) => (typeof v === 'number' ? Math.trunc(v) : parseInt(v, 10) || 0)

/**
 * A sport/lead height as climbers type it, parsed the way the backend's
 * SportPointsParser does: "33" plain, "33+" controlled (+0.25), "33-"
 * uncontrolled (-0.25), "TOP" = 1000, comma as the decimal separator.
 * Numbers come back as numbers; an empty entry as ''; anything else as typed.
 */
export const parseSportPoints = (raw) => {
  let p = String(raw ?? '').trim().replace(/,/g, '.')
  if (p === '') return p
  if (/\+/.test(p)) p = intval(p) + 0.25
  if (/-/.test(String(p))) p = intval(p) - 0.25
  if (p === 'TOP') p = 1000
  if (typeof p === 'string' && p !== '' && Number.isFinite(Number(p))) p = Number(p)
  return p
}
