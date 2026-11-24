import { isRegistrationOpen, parseBound } from './compWindow.js'

/** No cap (maxcontenders 0) is never full; otherwise the confirmed registrations decide. */
export const isCompFull = (comp) => comp.maxcontenders != 0 && comp.paidregistrations_count >= comp.maxcontenders

/**
 * Where the registration window stands: 'open', 'upcoming' (it has a start
 * that has not come yet) or 'ended'. A missing bound never restricts, as in
 * compWindow.js.
 */
export const registrationPhase = (comp, now) => {
  if (isRegistrationOpen(comp, now)) return 'open'
  const start = parseBound(comp?.registration_start)
  return start && !now.isAfter(start) ? 'upcoming' : 'ended'
}

/**
 * What one row of the competition list says, as two independent answers:
 *
 *   standing      am I in it — 'registered', 'unpaid', 'full', 'open' (I could
 *                 still register) or null when there is nothing to say
 *   registration  the window's phase, or null for a full competition, where
 *                 the dates no longer decide anything
 */
export const compListing = (comp, now) => {
  const full = isCompFull(comp)
  const phase = registrationPhase(comp, now)
  let standing = null
  if (comp.participates) standing = 'registered'
  else if (comp.participatesunpaid) standing = 'unpaid'
  else if (full) standing = 'full'
  else if (phase === 'open') standing = 'open'
  return { standing, registration: full ? null : phase }
}
