/**
 * Runs one calendar-click fetch cycle for ArchivePage.vue and reports when
 * its click throttle (`newClickPossible`) may reopen.
 *
 * Deliberately does NOT key the unlock off the query's `isFetching` flag.
 * Two different days in the same month/year span (showSpan: 'month'/'year')
 * reduce to the same [start, end] pair, and a literal re-click repeats the
 * exact span too. Either way TanStack's query key hashes the same as what is
 * already cached, so — within the 30s global staleTime in
 * src/js/queryClient.js — it serves the cached entry and never calls the
 * queryFn: `isFetching` never transitions true->false. A caller gating the
 * unlock on that transition stays locked forever; the calendar becomes
 * unclickable until a full reload.
 *
 * `refetch()` (TanStack's own, not a plain re-render of the key) always
 * issues a real request regardless of staleness, so awaiting it directly —
 * rather than watching a flag it may or may not move — always resolves.
 * That matches what the Vuex action this replaced always did: a real
 * network call on every single click, no exceptions.
 */
export async function runArchiveDayClick(refetch, { unlockDelayMs = 2000 } = {}) {
  await refetch()
  await new Promise((resolve) => setTimeout(resolve, unlockDelayMs))
}
