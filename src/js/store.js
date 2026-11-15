import { createStore } from "vuex";
import { invalidateAfter, queryClient } from '@js/queryClient'
import api from './api'
import { useClimberStore } from './stores/climber.store.js'
import { useRankingsStore } from './stores/rankings.store.js'
import { pinia } from './stores/index.js'
import { asCompId } from '@js/queryKeyNames'

// The signed-in-or-public-point-entry climber's point_entry_key, if any —
// read from the Pinia climber store (Task 1 of the Activity-group migration
// plan moved climber identity off this Vuex store entirely). Only the
// public-comp-key actions below need this; everything else about climber
// identity now lives in useClimberStore.
const pointEntryKeyOf = () => useClimberStore(pinia).climber?.point_entry_key ?? null

// TEMPORARY bridge (Task 3 of the Activity-group migration plan added this;
// Task 5 removes it entirely when it migrates saveTick/deleteTick/
// deleteTickByProblem to mutations.js with their own onSuccess cache
// updates into the homes Task 3 built).
//
// A tick write used to patch state.competition.userticks via the
// addTickToCompetition/removeTickFromCompetition Vuex mutations just above.
// Task 3 moved state.competition to the ['competition', compid] (or
// ['public-competition', compid]) query cache and left those two mutations
// in place, guarded on state.competition — which no longer exists, so they
// silently became permanent no-ops. Without this bridge, ticking a route on
// a competition page would never update the on-screen "ticked" state, and a
// ladder Top would visibly revert once its optimistic local state yields
// back to the (stale) server state.
//
// setQueryData, not invalidateQueries: useCheckpointLadders.js's optimistic
// state falls back to serverState(prob) (which reads comp()?.userticks)
// the instant topBusy clears, right after this save resolves — an
// invalidate-and-refetch would leave a window, however short, where the
// cache still shows the old userticks and the Top visibly reverts before
// the refetch lands. A direct patch has no such window.
//
// Only callers that know which competition they're on
// (CompetitionEntry.vue/PublicCompetitionEntry.vue) pass payload.compid;
// every other saveTick/deleteTickByProblem caller (AddTick.vue,
// SearchHitItem.vue, NewProblemItem.vue, TickList.vue, ArchivePage.vue) has
// no competition context and doesn't, so this is a no-op for them — the
// same as the old addTickToCompetition/removeTickFromCompetition mutations'
// `if (state.competition && ...)` guard being falsy on those pages.
//
// compid goes through asCompId (queryKeyNames.js) before it builds either
// cache key: CompetitionEntry.vue/PublicCompetitionEntry.vue currently
// always send a Number here (props.comp.id, off the fetched competition
// JSON), but the query side of this same cache entry is keyed off a
// Framework7 route param — always a string. Without normalizing both sides
// the same way, this bridge would silently patch a cache entry the page's
// own useQuery never observes (exactly the bug a review caught in
// mutations.js's own cache patches — same fix, applied here too).
const patchTickIntoCompetitionCache = (queryKeyName, compid, tick) => {
  const id = asCompId(compid)
  if (id == null) return
  queryClient.setQueryData([queryKeyName, id], (old) => {
    if (old == null || old.userticks == null) return old
    return { ...old, userticks: { ...old.userticks, [tick.problemid]: tick } }
  })
}
const removeTickFromCompetitionCache = (queryKeyName, compid, problemid) => {
  const id = asCompId(compid)
  if (id == null) return
  queryClient.setQueryData([queryKeyName, id], (old) => {
    if (old == null || old.userticks == null) return old
    const userticks = { ...old.userticks }
    delete userticks[problemid]
    return { ...old, userticks }
  })
}

export default createStore({
  namespaced: true,
  state: {
    ticksLoaded : false,
    alltime : {
      ticks : [],
      tries : []
    },
    problems : [],
  },

  mutations: {
    ticksLoaded (state, payload) {
      state.ticksLoaded = payload
    },
    allTimeTicks(state, payload) {
      state.alltime = payload
    },
    addTriesAllTime(state, payload) {
      state.alltime.tries = [...state.alltime.tries,payload]
    },
    addTicksAllTime(state, payload) {
      state.alltime.ticks = [...state.alltime.ticks,payload]
    },
    // Still here for saveTick/deleteTick (Task 5's domain) to finish moving
    // and then remove — see this plan's Task 3/Task 5 coordination note.
    // state.competition no longer exists (Task 3 moved it to the
    // ['competition', compid] query cache), so these two mutations
    // themselves are now permanent no-ops — the actions below that commit
    // them also call patchTickIntoCompetitionCache/
    // removeTickFromCompetitionCache (defined above) as a temporary bridge
    // into that cache, since leaving these as silent no-ops would mean a
    // tick never updates the on-screen "ticked" state on a competition page.
    addTickToCompetition(state, payload) {
      if (state.competition && state.competition.userticks) {
        state.competition.userticks = {...state.competition.userticks, [payload.problemid] : payload}
      }
    },
    removeTickFromCompetition(state, payload) {
      if (state.competition && state.competition.userticks) {
        const newTicks = {...state.competition.userticks}
        delete newTicks[payload]
        state.competition.userticks = newTicks
      }
    },
    removeTick(state, pid) {
      state.alltime.ticks = state.alltime.ticks.filter(x => x.problemid != pid)
    },
    updateProblem(state, payload) {
      state.problems = {...state.problems,[payload.id] : payload}
    },
    isAbsolute (state, payload) {
      state.isAbsolute = payload
    },
    problems(state, payload) {
      state.problems = payload
    },
  },
  actions: {
    // These actions use the public comp key
    async publicSaveTick({ state, commit}, payload) {
      if (pointEntryKeyOf() != null) {
        payload.point_entry_key = pointEntryKeyOf()
      }
      // compid (see patchTickIntoCompetitionCache above) identifies the
      // cache entry to patch; it is not part of the API's own tick payload.
      const { compid, ...apiPayload } = payload
      const ret = await api.saveTick(apiPayload,'/compkey')
      commit('updateProblem', ret.problem)
      // Update also tries in profile
      if (payload.ticktype=='tick') {
        commit('addTicksAllTime',ret.tick)
        commit('addTickToCompetition',ret.tick)
        patchTickIntoCompetitionCache('public-competition', compid, ret.tick)
      } else {
        commit('addTriesAllTime',ret.tick)
      }
      useRankingsStore(pinia).fetchRankings()
      return ret
    },
     async publicDeleteTickByProblem({ state,commit}, payload) {
      const { compid, ...apiPayload } = payload
      const ret = await api.deleteTickByProblem(apiPayload,'/compkey')
      commit('removeTick',payload.problemid)
      commit('removeTickFromCompetition',payload.problemid)
      removeTickFromCompetitionCache('public-competition', compid, payload.problemid)
      return ret
    },
    // These actions use the normal oauth
    async requestSync({ state}, payload) {
      const ret = await api.requestSync(payload)
      return ret
    },
    // getProfile moved to queryKeys.js's `profile` query (Task 7). Its
    // `problems` commit moved with it, into that query's queryFn; its
    // climber bridge moved to the Pinia climber store directly (this plan's
    // Task 1), and its rankingTarget bridge to the Pinia rankings store's
    // seedFromProfile (this plan's Task 2) — both rather than through this
    // still-live Vuex store.
    async loadAllTimeTicks({ commit, state}, payload) {
      const ret = await api.loadAllTimeTicks(payload)
      commit('allTimeTicks', ret)
      commit('ticksLoaded',true)
    },
    async deleteProject({ commit, state}, payload) {
      const ret = await api.deleteProject(payload)
      commit('problems', {...state.problems,[ret.problem.id] : ret.problem})
      invalidateAfter('deleteProject')
      // Unlike deleteTick right below, this never returned its result —
      // every caller's `resp.message` read `.message` off undefined and
      // crashed before whatever came after it (ArchivePage.vue's post-delete
      // refetch) ever ran.
      return ret
    },
     async deleteTickByProblem({ state,commit}, payload) {
      const { compid, ...apiPayload } = payload
      const ret = await api.deleteTickByProblem(apiPayload)
      commit('removeTick',payload.problemid)
      commit('removeTickFromCompetition',payload.problemid)
      removeTickFromCompetitionCache('competition', compid, payload.problemid)
      invalidateAfter('deleteTickByProblem')
      return ret
    },
    async deleteTick({ state, commit}, payload) {
      const ret = await api.deleteTick(payload)
      commit('problems', {...state.problems,[ret.problem.id] : ret.problem})
      useRankingsStore(pinia).fetchRankings()
      invalidateAfter('deleteTick')

      return ret
    },
    async saveTick({ state, commit}, payload) {
      if (pointEntryKeyOf() != null) {
        payload.point_entry_key = pointEntryKeyOf()
      }
      // compid (see patchTickIntoCompetitionCache above) identifies the
      // cache entry to patch; it is not part of the API's own tick payload.
      const { compid, ...apiPayload } = payload
      const ret = await api.saveTick(apiPayload)
      commit('updateProblem', ret.problem)
      // Update also tries in profile
      if (payload.ticktype=='tick') {
        commit('addTicksAllTime',ret.tick)
        commit('addTickToCompetition',ret.tick)
        patchTickIntoCompetitionCache('competition', compid, ret.tick)
      } else {
        commit('addTriesAllTime',ret.tick)
      }
      useRankingsStore(pinia).fetchRankings()
      invalidateAfter('saveTick')
      return ret
    },
    async likeProblem({ state , commit}, payload) {
      const pid = payload.id
      const ret = await api.likeProblem(pid)
      // Update problem likes
      const problem = state.problems[pid]
      commit('problems' , { ...state.problems, [pid]: {...problem,['c_like'] : ret.likeCount, ['likeCount'] : ret.likeCount, ['c_dislike'] : ret.dislikeCount, ['dislikeCount'] : ret.dislikeCount } })
      invalidateAfter('likeProblem')
    },
    async dislikeProblem({ state , commit}, payload) {
      const pid = payload.id
      const ret = await api.dislikeProblem(pid)
      // Update problem dislikes
      const problem = state.problems[pid]
      commit('problems' , { ...state.problems, [pid]: {...problem,['likeCount'] : ret.likeCount, ['dislikeCount'] : ret.dislikeCount } })
      invalidateAfter('dislikeProblem')
    },
    async commentProblem({ state , commit}, payload) {
      const pid = payload.id
      const ret = await api.commentProblem(payload)
      // Update problem comments
      const problem = state.problems[pid]
      commit('problems' , { ...state.problems, [pid]: {...problem, ['messages'] : ret.messages, ['messageCount'] : ret.messages.length } })
    },
    async reportProblem({ state, commit }, payload) {
      const ret = await api.reportProblem(payload)
      // Keep the counts on the cached problem, so leaving the page and coming
      // back does not show the report as un-made.
      const problem = state.problems[payload.id]
      if (problem) {
        commit('problems', { ...state.problems, [payload.id]: { ...problem, reports: ret.reports } })
      }
      return ret.reports
    },
    // requestOtp, verifyOtp, socialLogin, completeSocialLogin, logout moved
    // to Pinia's useAuthStore (Task 6). login/setUser were dead (zero
    // dispatch sites) and were dropped rather than ported.
    async getProblemDetails({ state  , commit}, payload) {
      const ret = await api.getProblemDetails(payload);
      const problem = ret.problem
      const curProblem = state.problems[problem.id]
      const merged = {...curProblem, ...problem}
      if (problem) {
        commit('problems' , {...state.problems,[problem.id] : merged})
      }
      return problem
    },
    // changeGym and saveSettings moved to mutations.js (Task 7).
    // saveGymSettings dropped (Task 7): zero call sites, same as when it
    // was last checked. getClimberByKey moved to mutations.getClimberByKey
    // and getClimber dropped (zero dispatch sites, same as when it was last
    // checked) — both this plan's Task 1. getCompetition, getCompResults,
    // getPointsPerRoute, saveCheckpoint, deleteCheckpoint,
    // publicSaveCheckpoint, publicDeleteCheckpoint, publicGetCompetition,
    // publicGetCompResults, publicGetPointsPerRoute, addTopJudging,
    // addCheckpointJudging, removeCompAscent, registerToComp and
    // unRegisterToComp moved to queries.competition/compResults and
    // mutations.js (this plan's Task 3).
  },
  getters: {
  }
});
