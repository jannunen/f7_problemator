import api from '@js/api'
import { queryClient } from '@js/queryClient'
import { useClimberStore } from '@js/stores/climber.store.js'
import { pinia } from '@js/stores/index.js'

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
   */
  saveSettings: () => ({
    mutationFn: (payload) => api.saveSettings(payload),
    onSuccess: (data) => {
      useClimberStore(pinia).setFromProfile(data.climber)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  }),

  /**
   * The anonymous public point-entry identity, looked up by a competition
   * key (the compkey flow: a climber opens a comp's standalone entry page
   * from an emailed link, with no sign-in).
   *
   * `payload` is `{compid, key}`, matching api.getClimberByKey's actual
   * signature — `compid` is required, this is not simplifiable to a bare
   * `key`.
   *
   * The endpoint can answer with either a real climber object or a plain
   * string error message (e.g. "You do not have access to this comp.");
   * onSuccess guards against writing that string into the climber store as
   * if it were climber data. PublicSingleCompetitionPage.vue separately
   * re-checks the same string shape on the mutation's own result to decide
   * whether to show its "not authorized" message — the UI decision, as
   * opposed to this guard, which protects the shared climber identity.
   */
  getClimberByKey: () => ({
    mutationFn: (payload) => api.getClimberByKey(payload, '/compkey'),
    onSuccess: (data) => {
      if (typeof data === 'string' && data.match(/access.to.this.comp/i)) return
      useClimberStore(pinia).setFromPublicKey(data)
    },
  }),
}
