import { describe, it, expect, vi } from 'vitest'
import { runArchiveDayClick } from '@js/helpers/archiveThrottle'

// Regression for: ArchivePage's calendar click-throttle (newClickPossible)
// could get stuck forever. Two different days in the same month/year share
// one [start,end] span, and a literal re-click repeats the exact span too —
// in either case TanStack's 30s global staleTime (src/js/queryClient.js)
// serves the cached entry and never calls the queryFn, so an unlock gated on
// an `isFetching` true->false transition never fires. See git history on
// this file for the earlier, buggy version of runArchiveDayClick that
// watched isFetching directly and a real failing run of this same
// assertion against it (RED), before it was replaced with the version
// below that awaits refetch() directly instead (GREEN).
describe('runArchiveDayClick', () => {
  it('reopens the throttle even when the fetch is a cache hit that would never show as fetching', async () => {
    // A refetch that resolves without any externally observable "isFetching"
    // transition at all — exactly the cache-hit condition that caused the
    // calendar to lock up for good.
    const refetch = vi.fn().mockResolvedValue(undefined)

    vi.useFakeTimers()
    let settled = false
    runArchiveDayClick(refetch, { unlockDelayMs: 2000 }).then(() => {
      settled = true
    })

    // refetch() is awaited first; let its resolved promise settle before
    // advancing past the unlock delay.
    await vi.advanceTimersByTimeAsync(0)
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(2000)
    expect(settled).toBe(true)

    vi.useRealTimers()
  })

  it('always calls refetch, even when the computed span repeats', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)

    await runArchiveDayClick(refetch, { unlockDelayMs: 0 })
    await runArchiveDayClick(refetch, { unlockDelayMs: 0 })

    expect(refetch).toHaveBeenCalledTimes(2)
  })
})
