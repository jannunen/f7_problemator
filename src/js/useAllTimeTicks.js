import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'

/**
 * This climber's all-time ticks/tries payload, never undefined.
 *
 * Same safe-default convention as useProfileSlice.js: TanStack never calls
 * `select` (or hands back real data) while there is no data yet — on a cold
 * start, and for every one of the ~17 components that reads this before the
 * first fetch resolves. The Vuex `state.alltime` this replaces always held
 * `{ ticks: [], tries: [] }`, and every call site still destructures
 * `.ticks`/`.tries` off it unconditionally; without a default here they would
 * throw during render the same way useProfileSlice's own consumers did
 * before it existed.
 */
export function useAllTimeTicks() {
  const { data } = useQuery(queries.allTimeTicks())
  return computed(() => data.value ?? { ticks: [], tries: [] })
}
