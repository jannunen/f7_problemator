import api from '@js/api'
import { queryClient } from '@js/queryClient'

/**
 * Every server write the app makes through TanStack Query, in one place.
 *
 * Mirrors queryKeys.js's shape: each factory returns the options object
 * `useMutation` takes. Preferring invalidation over hand-merging a response
 * into the cache (as queryClient.invalidateAfter already does for the Vuex
 * write actions) means a write and a read can never quietly disagree about
 * what the cache should hold.
 */
export const mutations = {
  /** Follow or unfollow a climber; the endpoint itself toggles the state. */
  followUnFollow: () => ({
    mutationFn: (id) => api.climber.followUnFollow(id),
    onSuccess: (data, id) => queryClient.invalidateQueries({ queryKey: ['climber-profile', id] }),
  }),
}
