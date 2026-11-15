import api from '@js/api'
import { queryClient } from '@js/queryClient'
import { useClimberStore } from '@js/stores/climber.store.js'
import { useGymStore } from '@js/stores/gym.store.js'
import { useRankingsStore } from '@js/stores/rankings.store.js'
import { pinia } from '@js/stores/index.js'
import { asCompId, invalidate } from '@js/queryKeyNames'

/**
 * Every server write the app makes through TanStack Query, in one place.
 *
 * Mirrors queryKeys.js's shape: each factory returns the options object
 * `useMutation` takes. Preferring invalidation over hand-merging a response
 * into the cache means a write and a read can never quietly disagree about
 * what the cache should hold.
 */

/**
 * Invalidate a fixed list of query-key prefixes after a write.
 *
 * Replaces the old invalidateAfter/keysInvalidatedBy indirection (an
 * action-name -> key-list lookup that existed only because these calls used
 * to arrive from Vuex actions identified by name). Every call site below IS
 * the mutation now, so there is nothing left to look up by name — each one
 * just lists the keys it dirties directly.
 */
const invalidateKeys = (keys) => {
  for (const queryKey of keys) {
    queryClient.invalidateQueries({ queryKey })
  }
}

/**
 * What a send/un-send dirties: the feed shows it to followers, the
 * new-problems list marks it climbed, badges may be earned, rankings move,
 * and it's visible publicly. Shared by saveTick/deleteTick/deleteTickByProblem
 * below, matching the old INVALIDATES map's identical entries for all three.
 */
const tickInvalidationKeys = () => [
  invalidate.feed(),
  invalidate.newProblems(),
  invalidate.badges(),
  invalidate.rankings(),
  invalidate.publicAscents(),
]

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

/**
 * Patches the cached profile payload's `gym.problems` — an ARRAY, exactly
 * as the backend returns it and as `queries.profile`'s queryFn now leaves
 * it untouched (the old `store.commit('problems', ...)` bridge that
 * reshaped it into an id-keyed object has moved to useProfileSlice.js's
 * `useProfileProblems` selector, which runs fresh on every render — so a
 * patch made here to the raw array needs no separate id-keyed copy kept in
 * sync).
 *
 * `updateProblems` gets the current array and returns the next one; it is
 * a no-op (returns `old` unchanged) when the profile payload is not cached
 * yet, same safety every other setQueryData updater in this file has.
 *
 * gymid is read from the Pinia gym store HERE, at call time, rather than
 * threaded through each mutation's payload or captured when the mutation
 * factory runs (`mutations.likeProblem()`, once per component). Two reasons:
 *
 *   - Every current caller of `queries.profile(gymid)` already builds gymid
 *     the same way, with `computed(() => useGymStore().gymid)` (see
 *     GymCompletionPage.vue, ProblemList.vue, GymMapPage.vue, etc.). Reading
 *     the exact same store here, the exact same way, is what guarantees this
 *     patch's key and the query's key can never drift apart — which is
 *     exactly how Task 3's compid bug happened (a route-param string on one
 *     side, a fetched object's numeric id on the other). Requiring callers
 *     to pass gymid in the mutate() payload instead would add a SECOND path
 *     by which gymid reaches a cache key, with no guarantee every call site
 *     (LeftDetails.vue, ReportProblem.vue, Problem.vue, TickList.vue,
 *     ArchivePage.vue) sources it identically.
 *   - Reading it inside onSuccess (not once when the factory runs) means a
 *     gym switch mid-session patches the NEW gym's cache entry — the same
 *     one a currently-mounted component's own `queries.profile(gymid)` call
 *     would be keyed on right now, not whatever gym was selected when the
 *     component first mounted.
 */
const patchGymProblems = (updateProblems) => {
  const gymid = useGymStore(pinia).gymid
  queryClient.setQueryData(['profile', gymid], (old) => {
    if (old?.gym?.problems == null) return old
    return { ...old, gym: { ...old.gym, problems: updateProblems(old.gym.problems) } }
  })
}

/**
 * Attaches the signed-in (or public point-entry) climber's point_entry_key
 * to a tick-save payload — the precondition saveTick/publicSaveTick's old
 * actions both ran before calling the API:
 * `if (state.climber?.point_entry_key != null) payload.point_entry_key = ...`.
 *
 * Reads Task 1's climber store directly (not threaded through the payload):
 * every current saveTick/publicSaveTick caller already builds its own
 * payload without this field, the same way the old action's callers did —
 * this is the one place that attaches it, not each of the nine call sites.
 *
 * Returns the original payload unchanged (same reference) when there is no
 * key to attach, so a mutation with no climber yet sends exactly the
 * payload it was given.
 */
const withPointEntryKey = (payload) => {
  const key = useClimberStore(pinia).climber?.point_entry_key
  return key != null ? { ...payload, point_entry_key: key } : payload
}

/**
 * Ported from store.js's patchProblemIntoProfileCache (the Task 4 bridge
 * this task absorbs and removes): replaces the cached problem wholesale
 * when found — matching the old `updateProblem`/`deleteTick` commits' own
 * semantics, a plain replace, not a merge — and upserts it when not already
 * cached, matching deleteProject's own patchGymProblems use just above.
 */
const patchTickedProblem = (problem) => {
  if (problem == null) return
  patchGymProblems((problems) => {
    const idx = problems.findIndex((p) => p.id == problem.id)
    if (idx === -1) return [...problems, problem]
    return problems.map((p, i) => (i === idx ? problem : p))
  })
}

/**
 * Patches the cached `['alltime-ticks']` payload — `queries.allTimeTicks`'s
 * own cache entry, replacing the Vuex `addTicksAllTime`/`addTriesAllTime`/
 * `removeTick` mutations. `updateAllTime` gets the current `{ticks, tries}`
 * and returns the next one; a no-op (returns `old` unchanged) while the
 * query has not fetched yet, same safety every other setQueryData updater
 * in this file has.
 */
const patchAllTimeTicks = (updateAllTime) => {
  queryClient.setQueryData(['alltime-ticks'], (old) => (old == null ? old : updateAllTime(old)))
}

/**
 * Ported from store.js's patchTickIntoCompetitionCache (the Task 3 bridge
 * this task absorbs and removes): patches a tick into a cached
 * competition's `userticks`, by problem id. `compid` goes through asCompId
 * first — see queryKeyNames.js's own doc comment for why (a route-param
 * string and an already-fetched competition's numeric `.id` must hash to
 * the same cache entry).
 *
 * Only CompetitionEntry.vue/PublicCompetitionEntry.vue pass a compid; every
 * other saveTick/publicSaveTick caller doesn't, and `asCompId(undefined)` is
 * `undefined`, so this is a no-op for them.
 */
const patchCompetitionUserTick = (queryKeyName, compid, tick) => {
  const id = asCompId(compid)
  if (id == null) return
  queryClient.setQueryData([queryKeyName, id], (old) => {
    if (old == null || old.userticks == null) return old
    return { ...old, userticks: { ...old.userticks, [tick.problemid]: tick } }
  })
}

/** Ported from store.js's removeTickFromCompetitionCache — the other half of patchCompetitionUserTick above. */
const removeCompetitionUserTick = (queryKeyName, compid, problemid) => {
  const id = asCompId(compid)
  if (id == null) return
  queryClient.setQueryData([queryKeyName, id], (old) => {
    if (old == null || old.userticks == null) return old
    const userticks = { ...old.userticks }
    delete userticks[problemid]
    return { ...old, userticks }
  })
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
      queryClient.setQueryData(['competition', asCompId(payload.compid)], (old) => patchSavedCheckpoint(old, payload.problemid, data)),
  }),

  /** Same, through the public comp-key route. `payload` already carries point_entry_key (the caller attaches it). */
  publicSaveCheckpoint: () => ({
    mutationFn: (payload) => api.saveCheckpoint(payload, '/compkey'),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['public-competition', asCompId(payload.compid)], (old) => patchSavedCheckpoint(old, payload.problemid, data)),
  }),

  /** Deletes a route's checkpoint row outright (the ladder's 'clear' action). */
  deleteCheckpoint: () => ({
    mutationFn: (payload) => api.deleteCheckpoint(payload),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['competition', asCompId(payload.compid)], (old) => patchRemovedCheckpoint(old, payload.problemid)),
  }),

  /** Same, through the public comp-key route. */
  publicDeleteCheckpoint: () => ({
    mutationFn: (payload) => api.deleteCheckpoint(payload, '/compkey'),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['public-competition', asCompId(payload.compid)], (old) => patchRemovedCheckpoint(old, payload.problemid)),
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
      queryClient.setQueryData(['competition', asCompId(payload.compid)], (old) => (old == null ? old : { ...old, points_per_route: data })),
  }),

  /** Same, through the public comp-key route. */
  publicGetPointsPerRoute: () => ({
    mutationFn: (payload) => api.getPointsPerRoute(payload, '/compkey'),
    onSuccess: (data, payload) =>
      queryClient.setQueryData(['public-competition', asCompId(payload.compid)], (old) => (old == null ? old : { ...old, points_per_route: data })),
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
      queryClient.setQueryData(['competition', asCompId(payload.compid)], (old) => {
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
      queryClient.setQueryData(['competition', asCompId(payload.compid)], (old) => {
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

  /**
   * Like a route. The endpoint answers with the route's fresh like/dislike
   * counts (both, since liking can clear a previous dislike server-side).
   * Ported verbatim from store.js's likeProblem action: patches BOTH the
   * legacy `c_like`/`c_dislike` fields (read by older templates) and the
   * newer `likeCount`/`dislikeCount` fields with the same fresh counts.
   */
  likeProblem: () => ({
    mutationFn: (id) => api.likeProblem(id),
    onSuccess: (data, id) => {
      patchGymProblems((problems) =>
        problems.map((p) =>
          p.id == id
            ? { ...p, c_like: data.likeCount, likeCount: data.likeCount, c_dislike: data.dislikeCount, dislikeCount: data.dislikeCount }
            : p
        )
      )
      invalidateKeys([invalidate.publicAscents(), invalidate.newProblems()])
    },
  }),

  /**
   * Dislike a route. Unlike likeProblem, the old dislikeProblem action never
   * touched `c_like`/`c_dislike` — only `likeCount`/`dislikeCount`.
   */
  dislikeProblem: () => ({
    mutationFn: (id) => api.dislikeProblem(id),
    onSuccess: (data, id) => {
      patchGymProblems((problems) => problems.map((p) => (p.id == id ? { ...p, likeCount: data.likeCount, dislikeCount: data.dislikeCount } : p)))
      invalidateKeys([invalidate.publicAscents(), invalidate.newProblems()])
    },
  }),

  /**
   * Comment on a route. `payload` is `{id, comment}` — api.commentProblem
   * needs both, so unlike likeProblem/dislikeProblem this cannot take a bare
   * id. The response carries the full messages list; messageCount is
   * derived from it, same as the old action (there is no separate count
   * field from the server).
   */
  commentProblem: () => ({
    mutationFn: (payload) => api.commentProblem(payload),
    onSuccess: (data, payload) =>
      patchGymProblems((problems) =>
        problems.map((p) => (p.id == payload.id ? { ...p, messages: data.messages, messageCount: data.messages.length } : p))
      ),
  }),

  /**
   * Flag a route as dirty/dangerous. `payload` is `{id, type, note}`
   * (api.reportProblem's own shape). Ported verbatim from store.js's
   * `if (problem) { commit(...) }` guard: unlike the other problem patches
   * here, a report for a problem not already in the cached array is
   * skipped outright, not inserted.
   */
  reportProblem: () => ({
    mutationFn: (payload) => api.reportProblem(payload),
    onSuccess: (data, payload) =>
      patchGymProblems((problems) => problems.map((p) => (p.id == payload.id ? { ...p, reports: data.reports } : p))),
  }),

  /**
   * One route's full detail payload (messages, grade opinions, reports...),
   * fetched when a climber opens its page. Resolves with `ret.problem`
   * (not the full `ret`), matching the old action's own return value —
   * Problem.vue's `.then((prob) => ...)` reads the problem directly.
   *
   * onSuccess merges `{...curProblem, ...problem}` — detail-endpoint-only
   * fields land ON TOP of whatever list-endpoint fields were already
   * cached, never replacing them outright. This is why this patches the
   * cache directly instead of invalidating: a plain refetch of the profile
   * query would bring back the LIST shape, dropping every detail-only
   * field this merge just added, undoing itself the moment the refetch
   * landed. Also ported verbatim: the old action committed unconditionally
   * even when the problem was not already in `state.problems` (unlike
   * reportProblem's guard above) — this upserts (inserts) rather than
   * skipping when the row is missing.
   */
  getProblemDetails: () => ({
    mutationFn: async (id) => {
      const ret = await api.getProblemDetails(id)
      return ret.problem
    },
    onSuccess: (problem) => {
      if (problem == null) return
      patchGymProblems((problems) => {
        const idx = problems.findIndex((p) => p.id == problem.id)
        if (idx === -1) return [...problems, problem]
        return problems.map((p, i) => (i === idx ? { ...p, ...problem } : p))
      })
    },
  }),

  /**
   * Delete a project (a pretick — a route marked as being worked on, not
   * yet sent). `id` is the pretick's own id, not the problem's — see
   * api.deleteProject. Resolves with the full response (not just
   * `.problem`): every caller reads `resp.message` for a toast.
   *
   * Ported verbatim from store.js's deleteProject action: the cached
   * problem is REPLACED wholesale with `ret.problem`, not merged with
   * whatever fields were already there.
   */
  deleteProject: () => ({
    mutationFn: (id) => api.deleteProject(id),
    onSuccess: (data) => {
      if (data?.problem == null) return
      patchGymProblems((problems) => {
        const idx = problems.findIndex((p) => p.id == data.problem.id)
        if (idx === -1) return [...problems, data.problem]
        return problems.map((p, i) => (i === idx ? data.problem : p))
      })
      invalidateKeys([invalidate.newProblems()])
    },
  }),

  /**
   * Log a send or a try/project. `payload` carries `ticktype` ('tick' for a
   * send, anything else — 'pretick', or absent — for a try/project),
   * `problemid`, and optionally `compid` when the caller is a competition
   * page (CompetitionEntry.vue) rather than a plain route page. `compid`
   * identifies which cached competition's `userticks` to patch below; it is
   * not part of the API's own tick payload, so it is stripped before the
   * call, exactly as the old action's `const {compid, ...apiPayload} = payload`
   * did.
   *
   * onSuccess does everything the old saveTick action's four commits plus
   * its two Task 3/Task 4 bridge calls did, now as this mutation's own
   * permanent cache writes:
   *   - patches the ticked problem into the profile cache (replaces
   *     store.js's updateProblem commit + its patchProblemIntoProfileCache
   *     bridge)
   *   - pushes the new tick onto `['alltime-ticks']`'s ticks array (a send)
   *     or tries array (a try/project) (replaces addTicksAllTime/
   *     addTriesAllTime)
   *   - for a send with a compid, patches it into the cached competition's
   *     userticks (replaces addTickToCompetition + its
   *     patchTickIntoCompetitionCache bridge)
   *   - refetches rankings (replaces dispatch('rankings', {country: ...}))
   *   - invalidates feed/newProblems/badges/rankings/publicAscents
   */
  saveTick: () => ({
    mutationFn: (payload) => {
      const { compid: _compid, ...rest } = withPointEntryKey(payload)
      return api.saveTick(rest)
    },
    onSuccess: (data, payload) => {
      patchTickedProblem(data.problem)
      if (payload.ticktype === 'tick') {
        patchAllTimeTicks((old) => ({ ...old, ticks: [...old.ticks, data.tick] }))
        patchCompetitionUserTick('competition', payload.compid, data.tick)
      } else {
        patchAllTimeTicks((old) => ({ ...old, tries: [...old.tries, data.tick] }))
      }
      useRankingsStore(pinia).fetchRankings()
      invalidateKeys(tickInvalidationKeys())
    },
  }),

  /**
   * Same, through the public comp-key route (the anonymous point-entry
   * flow). Unlike `saveTick`, the old `publicSaveTick` action never called
   * `invalidateAfter` — preserved as-is here, not newly added.
   */
  publicSaveTick: () => ({
    mutationFn: (payload) => {
      const { compid: _compid, ...rest } = withPointEntryKey(payload)
      return api.saveTick(rest, '/compkey')
    },
    onSuccess: (data, payload) => {
      patchTickedProblem(data.problem)
      if (payload.ticktype === 'tick') {
        patchAllTimeTicks((old) => ({ ...old, ticks: [...old.ticks, data.tick] }))
        patchCompetitionUserTick('public-competition', payload.compid, data.tick)
      } else {
        patchAllTimeTicks((old) => ({ ...old, tries: [...old.tries, data.tick] }))
      }
      useRankingsStore(pinia).fetchRankings()
    },
  }),

  /**
   * Delete a tick by its own id (TickList.vue/ArchivePage.vue, where the
   * climber is looking at a list of their own ticks and already has the
   * tick id). `payload` is the bare tick id — api.deleteTick's own shape.
   *
   * Ported verbatim from store.js's deleteTick action: unlike
   * deleteTickByProblem below, this never touched `['alltime-ticks']` even
   * in the old action (no `removeTick` commit here) — not a regression to
   * add now. It does patch the profile cache (replacing the old action's
   * dead `commit('problems', ...)` — there was no `problems` mutation left
   * for it to hit — plus its patchProblemIntoProfileCache bridge) and
   * refetch rankings.
   */
  deleteTick: () => ({
    mutationFn: (payload) => api.deleteTick(payload),
    onSuccess: (data) => {
      patchTickedProblem(data?.problem)
      useRankingsStore(pinia).fetchRankings()
      invalidateKeys(tickInvalidationKeys())
    },
  }),

  /**
   * Delete a tick by problem id instead (competition ladders/steppers,
   * where only the route is known, not a specific tick id — see
   * CompetitionEntry.vue). `payload` is `{problemid, compid?}`; `compid`
   * is stripped before the API call, same as saveTick above.
   *
   * Ported verbatim from store.js's deleteTickByProblem action: unlike
   * saveTick/deleteTick, this never refetched rankings in the old action
   * either — preserved as-is. Does remove the problem from
   * `['alltime-ticks']` (replacing the old `removeTick` commit) and from
   * the cached competition's userticks (replacing removeTickFromCompetition
   * + its removeTickFromCompetitionCache bridge).
   */
  deleteTickByProblem: () => ({
    mutationFn: (payload) => {
      const { compid: _compid, ...rest } = payload
      return api.deleteTickByProblem(rest)
    },
    onSuccess: (data, payload) => {
      patchAllTimeTicks((old) => ({ ...old, ticks: old.ticks.filter((t) => t.problemid != payload.problemid) }))
      removeCompetitionUserTick('competition', payload.compid, payload.problemid)
      invalidateKeys(tickInvalidationKeys())
    },
  }),

  /**
   * Same, through the public comp-key route. Like publicSaveTick, the old
   * `publicDeleteTickByProblem` action never called `invalidateAfter`.
   */
  publicDeleteTickByProblem: () => ({
    mutationFn: (payload) => {
      const { compid: _compid, ...rest } = payload
      return api.deleteTickByProblem(rest, '/compkey')
    },
    onSuccess: (data, payload) => {
      patchAllTimeTicks((old) => ({ ...old, ticks: old.ticks.filter((t) => t.problemid != payload.problemid) }))
      removeCompetitionUserTick('public-competition', payload.compid, payload.problemid)
    },
  }),

  /**
   * A climber with no ticks asks to have their pre-OTP (Auth0/social-login)
   * ascent history re-linked to their account by email (ShowTickHelp.vue).
   * No onSuccess: ShowTickHelp.vue reads the response itself (the message to
   * show, before logging the climber out) and nothing else observes this
   * mutation's pending/success state, so there is nothing for a cache patch
   * or invalidation to do here — same as removeCompAscent/addCheckpointJudging
   * above.
   */
  requestSync: () => ({
    mutationFn: (payload) => api.requestSync(payload),
  }),
}
