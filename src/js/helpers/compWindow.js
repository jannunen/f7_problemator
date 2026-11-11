import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

/**
 * Competition time windows. A bound that is missing means NO LIMIT on that
 * side: start missing = already open, end missing = never closes. "Missing"
 * is null/undefined/'', MySQL zero dates ('0000-00-00 ...'), and anything
 * dayjs cannot parse ('Invalid Date', garbage). Real values behave exactly
 * as the old inline code did (both bounds exclusive).
 */

/** Parsed UTC dayjs for a real bound, or null when the bound is missing. */
export const parseBound = (value) => {
  if (value == null) return null
  if (typeof value === 'string') {
    const s = value.trim()
    if (s === '' || s.startsWith('0000-00-00') || s === 'Invalid Date') return null
  }
  const d = dayjs.utc(value)
  return d.isValid() ? d : null
}

export const hasBound = (value) => parseBound(value) !== null

/** True when `now` is inside the window; missing bounds never restrict. */
export const isWithinWindow = (start, end, now) => {
  const n = now == null ? dayjs().utc() : now
  const s = parseBound(start)
  const e = parseBound(end)
  if (s && !n.isAfter(s)) return false
  if (e && !n.isBefore(e)) return false
  return true
}

/** Tick window ("is the comp running"). */
export const isCompRunning = (comp, now) =>
  isWithinWindow(comp?.timespan_start, comp?.timespan_end, now)

/** Registration window (only the time condition; callers keep other checks). */
export const isRegistrationOpen = (comp, now) =>
  isWithinWindow(comp?.registration_start, comp?.registration_end, now)

/**
 * Milliseconds until the tick window ends (negative when past), or null when
 * there is no end. Parsed like the old code did, with dayjs(end) in local
 * mode, so real values keep their exact behaviour.
 */
export const msUntilEnd = (comp, now) => {
  if (!hasBound(comp?.timespan_end)) return null
  return dayjs(comp.timespan_end).diff(now == null ? dayjs() : now)
}

/**
 * "start - end" text; formatter turns a real bound into display text.
 * Both missing -> noLimitText; one missing -> open-ended range.
 */
export const windowLabel = (start, end, formatter, noLimitText) => {
  const hs = hasBound(start)
  const he = hasBound(end)
  if (!hs && !he) return noLimitText
  return `${hs ? formatter(start) : ''} - ${he ? formatter(end) : ''}`.trim()
}
