const pad = (n) => String(n).padStart(2, '0')

/** The last ten minutes are shown as urgent. */
export const URGENT_SECONDS = 10 * 60

/**
 * A countdown as its parts: whole days, then a HH:MM:SS clock for the rest.
 * `ms` is what is left (compWindow's msUntilEnd); null means there is no end
 * to count down to, and gives null. Time that has run out reads 00:00:00
 * rather than counting on into negative numbers.
 */
export const countdown = (ms) => {
  if (ms == null) return null
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return {
    days,
    clock: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    urgent: total <= URGENT_SECONDS,
    over: total === 0,
  }
}
