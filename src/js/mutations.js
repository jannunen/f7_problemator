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

// An empty map that arrived from PHP as `[]` (json_encode of an empty
// associative array) reads back as an Array, not an Object — same guard the
// old setMyCheckpoint*/removeMyCheckpoint Vuex mutations each made before
// spreading one of these three maps.
const asObj = (v) => (Array.isArray(v) ? {} : (v ?? {}))

/**
 * Ported from store.js's commitSavedCheckpoint, verbatim: the single
 * highest-risk piece of logic in this migration. The server keeps the
 * highest checkpoint, so this patches the cached competition object with
 * what IT stored, not what was tapped. Three branches:
 *
 *   - a sport score (`ret.score`): a partial height, stored as the route's
 *     score. It has no checkpoint, and leaves my_checkpoints/
 *     my_checkpoint_tries exactly as they were.
 *   - a zone-tries write (`ret.attempts`/`ret.zone_tries` both present)
 *     whose checkpoint and attempts are both <= 0: the row was undone back
 *     to empty — clears my_checkpoints/my_checkpoint_tries/
 *     my_checkpoint_scores for this problem (see patchRemovedCheckpoint).
 *   - otherwise: stores the tries (when this was a zone-tries write) AND
 *     the checkpoint — a plain checkpoint-only write (no attempts/zone_tries
 *     in the response) only ever touches my_checkpoints.
 *
 * my_checkpoint-prefixed/userticks state has always lived nested inside the same
 * getCompetition payload as everything else on a competition — it has no
 * existence of its own as a separately cacheable resource — so this patches
 * the `['competition', compid]` (or `['public-competition', compid]`) query
 * cache directly via setQueryData, in place of the three Vuex mutations
 * (setMyCheckpoint, setMyCheckpointScore, setMyCheckpointTries) this
 * replaces.
 */
const patchSavedCheckpoint = (old, problemid, ret) => {
  if (old == null) return old
  if (ret.score != null) {
    return { ...old, my_checkpoint_scores: { ...asObj(old.my_checkpoint_scores), [problemid]: ret.score } }
  }
  if (ret.attempts != null && ret.zone_tries != null) {
    if (!(parseInt(ret.checkpoint) > 0) && !(parseInt(ret.attempts) > 0)) {
      return patchRemovedCheckpoint(old, problemid)
    }
    return {
      ...old,
      my_checkpoint_tries: { ...asObj(old.my_checkpoint_tries), [problemid]: { attempts: ret.attempts, zone_tries: ret.zone_tries } },
      my_checkpoints: { ...asObj(old.my_checkpoints), [problemid]: ret.checkpoint },
    }
  }
  return { ...old, my_checkpoints: { ...asObj(old.my_checkpoints), [problemid]: ret.checkpoint } }
}

/** Ported from store.js's removeMyCheckpoint: clears a problem's checkpoint, tries and score. */
const patchRemovedCheckpoint = (old, problemid) => {
  if (old == null) return old
  const my_checkpoints = { ...asObj(old.my_checkpoints) }
  delete my_checkpoints[problemid]
  const my_checkpoint_tries = { ...asObj(old.my_checkpoint_tries) }
  delete my_checkpoint_tries[problemid]
  const my_checkpoint_scores = { ...asObj(old.my_checkpoint_scores) }
  delete my_checkpoint_scores[problemid]
  return { ...old, my_checkpoints, my_checkpoint_tries, my_checkpoint_scores }
}

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

  /**
   * A checkpoint or sport-score write for one route in one competition.
   * `payload` is `{compid, problemid, checkpoint}`, optionally with
   * `attempts`/`zone_tries`/`replace` (a zone-tries write) or `score` (a
   * sport partial height) — see api.saveCheckpoint. onSuccess patches the
   * cached competition payload per patchSavedCheckpoint's three branches
   * above, rather than invalidating: the ladder UI (useCheckpointLadders.js)
   * reads this cache synchronously right after the write resolves to decide
   * its next optimistic state, and a round trip through invalidation would
   * both be slower and race the next tap.
   */
  saveCheckpoint: () => ({
    mutationFn: (payload) => api.saveCheckpoint(payload),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['competition', payload.compid], (old) => patchSavedCheckpoint(old, payload.problemid, data)),
  }),

  /** Same, through the public comp-key route. `payload` already carries point_entry_key (the caller attaches it). */
  publicSaveCheckpoint: () => ({
    mutationFn: (payload) => api.saveCheckpoint(payload, '/compkey'),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['public-competition', payload.compid], (old) => patchSavedCheckpoint(old, payload.problemid, data)),
  }),

  /** Deletes a route's checkpoint row outright (the ladder's 'clear' action). */
  deleteCheckpoint: () => ({
    mutationFn: (payload) => api.deleteCheckpoint(payload),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['competition', payload.compid], (old) => patchRemovedCheckpoint(old, payload.problemid)),
  }),

  /** Same, through the public comp-key route. */
  publicDeleteCheckpoint: () => ({
    mutationFn: (payload) => api.deleteCheckpoint(payload, '/compkey'),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['public-competition', payload.compid], (old) => patchRemovedCheckpoint(old, payload.problemid)),
  }),

  /**
   * Points-per-route, for the `variable_points` comp type (where the
   * organiser can change a route's points mid-comp). Polled on a timer by
   * the caller, not cached as its own query: nothing reads its result
   * except through `comp.points_per_route`, the same field the old
   * `updatePointsPerRoute` Vuex mutation patched onto `state.competition`.
   */
  getPointsPerRoute: () => ({
    mutationFn: (payload) => api.getPointsPerRoute(payload),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['competition', payload.compid], (old) => (old == null ? old : { ...old, points_per_route: data })),
  }),

  /** Same, through the public comp-key route. */
  publicGetPointsPerRoute: () => ({
    mutationFn: (payload) => api.getPointsPerRoute(payload, '/compkey'),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['public-competition', payload.compid], (old) => (old == null ? old : { ...old, points_per_route: data })),
  }),

  /**
   * Join a competition category. `payload` is `{compid, category}`; the
   * response's `participates` row (with its `pivot.paid`) is what decides
   * which of the cached competition's two registration lists it joins —
   * same split `updatecompparticipates` made. Patched via setQueryData
   * rather than invalidated: the register page reads this cache right back
   * to decide whether to keep showing the Register button.
   */
  registerToComp: () => ({
    mutationFn: (payload) => api.registerToComp(payload),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['competition', payload.compid], (old) => {
        if (old == null) return old
        const row = data.participates
        return row.pivot.paid
          ? { ...old, paidregistrations: [...old.paidregistrations, row] }
          : { ...old, unpaidregistrations: [...old.unpaidregistrations, row] }
      }),
  }),

  /**
   * Leave a competition category. `payload` is `{compid, category,
   * contenderid}` — unlike registerToComp, the old `removeParticipation`
   * commit filtered straight off the payload, not the response, and this
   * keeps that.
   */
  unRegisterToComp: () => ({
    mutationFn: (payload) => api.unRegisterToComp(payload),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['competition', payload.compid], (old) => {
        if (old == null) return old
        return {
          ...old,
          paidregistrations: old.paidregistrations.filter((x) => x.id != payload.contenderid && x.pivot.serieid != payload.category),
          unpaidregistrations: old.unpaidregistrations.filter((x) => x.id != payload.contenderid && x.pivot.serieid != payload.category),
        }
      }),
  }),

  /**
   * A judge removes one recorded ascent by tick id. The Vuex action this
   * replaces committed nothing to state either (and has zero dispatch sites
   * today — SportJudging.vue calls api.removeCompAscent directly, bypassing
   * the store); kept for parity since the plan calls for it.
   */
  removeCompAscent: () => ({
    mutationFn: (payload) => api.removeCompAscent(payload),
  }),

  /**
   * A judge records a contender's top ascent. The controller answers 200
   * with `{error:true,message}` for refusals rather than a 4xx, so this
   * mirrors the old action's throw — otherwise useMutation would resolve
   * these as a success.
   */
  addTopJudging: () => ({
    mutationFn: async (payload) => {
      const ret = await api.addTopAscent(payload)
      if (ret && ret.error) throw new Error(ret.message || 'Could not record the top')
      return ret
    },
  }),

  /** A judge records one checkpoint for a contender. */
  addCheckpointJudging: () => ({
    mutationFn: (payload) => api.addCheckpointAscent(payload),
  }),
}
