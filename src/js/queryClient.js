import { QueryClient } from '@tanstack/vue-query'
import { keysInvalidatedBy } from '@js/invalidation'

/**
 * One QueryClient, configured on purpose.
 *
 * app.js used to call `app.use(VueQueryPlugin)` with nothing, which meant
 * every default: staleTime 0, refetch on window focus, refetch on mount. Data
 * was stale the instant it arrived, so every screen change and every return
 * to the app re-asked for everything. That masked the real gap — no write
 * invalidated anything — by refetching so often that staleness rarely showed.
 *
 * It is a bad trade on the device this app runs on. Climbers use it on a phone,
 * in a gym, often on poor signal, with the screen coming in and out of focus
 * between attempts. Refetching the world on every focus costs battery and data
 * to re-fetch data that mostly has not changed.
 *
 * Now that writes invalidate precisely, the aggressive defaults can go.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Long enough that moving between screens does not re-ask, short enough
      // that something changed by another device shows up soon. Writes made
      // on THIS device no longer wait for it — they invalidate.
      staleTime: 30_000,

      // The app is backgrounded constantly mid-session. Refetching everything
      // each time it comes back is the single most expensive default here.
      refetchOnWindowFocus: false,

      // Reconnecting IS worth a refetch: it usually means signal came back and
      // the climber has been away from the network, not just the screen.
      refetchOnReconnect: true,

      // Gym wifi drops requests. Two retries with backoff covers that without
      // making a genuine failure take ages to surface.
      retry: 2,
    },
  },
})

/**
 * Mark every cached read a write made stale.
 *
 * Called by the Vuex write actions rather than from components. The actions
 * do real local work — saveTick alone commits four mutations and dispatches
 * rankings — that components still read, so replacing the call sites with
 * bare useMutation would have quietly dropped it. Invalidating from inside
 * the action means all nine tick call sites get this without changing any of
 * them, and the local state updates survive untouched.
 *
 * Never throws: a write that succeeded must not be reported as failed because
 * the cache could not be told about it.
 */
export function invalidateAfter(action) {
  try {
    for (const queryKey of keysInvalidatedBy(action)) {
      queryClient.invalidateQueries({ queryKey })
    }
  } catch (e) {
    // Worst case the data stays stale until staleTime lapses, which is the
    // behaviour this app had before invalidation existed at all.
    console.warn(`[query] could not invalidate after ${action}`, e)
  }
}
