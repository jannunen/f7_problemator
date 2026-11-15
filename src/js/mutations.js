import api from '@js/api'
import { queryClient } from '@js/queryClient'
import store from '@js/store.js'

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

  /**
   * Switch the selected gym. Local-only — there is no API call, today's
   * changeGym action is `localStorage.setItem` plus a `getProfile`
   * re-dispatch — and the re-dispatch is now unnecessary: the caller sets
   * the Pinia gym store's `gymid` alongside this mutation, which changes
   * `queries.profile(gymid)`'s key and makes Query refetch on its own.
   *
   * Invalidates nothing, matching today's `INVALIDATES.changeGym: () => []`:
   * every gym-scoped key already carries the gym id, so the key change
   * alone is what makes each of them refetch.
   */
  changeGym: () => ({
    mutationFn: (gymid) => {
      localStorage.setItem('gymid', gymid)
      return Promise.resolve(gymid)
    },
    onSuccess: () => {},
  }),

  /**
   * A climber's own settings (name, units, etc.) — distinct from a gym's
   * settings (saveGymSettings, dropped: zero call sites).
   *
   * Invalidates the profile query broadly rather than hand-merging the
   * response: saveSettings changing something that feeds back into the
   * profile payload is plausible, and invalidation is the trade this
   * migration already prefers everywhere else (see the file doc above).
   *
   * climber is out of scope for this migration plan (see the plan's
   * "climber boundary") — kept as the one bridge into the still-live Vuex
   * store, same as today's action and the same pattern queries.profile's
   * queryFn uses for the same field.
   */
  saveSettings: () => ({
    mutationFn: (payload) => api.saveSettings(payload),
    onSuccess: (data) => {
      store.commit('climber', data.climber)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  }),
}
