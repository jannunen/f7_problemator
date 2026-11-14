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
