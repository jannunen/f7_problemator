const pad = (n) => String(n).padStart(2, '0')

/** The last ten minutes are shown as urgent. */
export const URGENT_SECONDS = 10 * 60

/**
 * A countdown as its parts: whole days, then a HH:MM:SS clock for the rest.
 * `ms` is what is left (compWindow's msUntilEnd); null means there is no end
 * to count down to, and gives null. A started second counts as a whole one,
 * so 00:00:00 is shown only once the time is up, and time that has run out
 * stays there rather than counting on into negative numbers.
 */
export const countdown = (ms) => {
  if (ms == null) return null
  const total = Math.max(0, Math.ceil(ms / 1000))
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
