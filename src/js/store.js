import { createStore } from "vuex";
import { invalidateAfter } from '@js/queryClient'
import api from './api'
import { useClimberStore } from './stores/climber.store.js'
import { useRankingsStore } from './stores/rankings.store.js'
import { pinia } from './stores/index.js'

// The signed-in-or-public-point-entry climber's point_entry_key, if any —
// read from the Pinia climber store (Task 1 of the Activity-group migration
// plan moved climber identity off this Vuex store entirely). Only the
// public-comp-key actions below need this; everything else about climber
// identity now lives in useClimberStore.
const pointEntryKeyOf = () => useClimberStore(pinia).climber?.point_entry_key ?? null

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
    // ['competition', compid] query cache), so these are inert no-ops
    // until Task 5 rewires them: harmless, since nothing reads
    // state.competition any more either.
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
      const ret = await api.saveTick(payload,'/compkey')
      commit('updateProblem', ret.problem)
      // Update also tries in profile
      if (payload.ticktype=='tick') {
        commit('addTicksAllTime',ret.tick) 
        commit('addTickToCompetition',ret.tick)
      } else {
        commit('addTriesAllTime',ret.tick)
      }
      useRankingsStore(pinia).fetchRankings()
      return ret
    },
     async publicDeleteTickByProblem({ state,commit}, payload) {
      const ret = await api.deleteTickByProblem(payload,'/compkey')
      commit('removeTick',payload.problemid)
      commit('removeTickFromCompetition',payload.problemid)
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
      const ret = await api.deleteTickByProblem(payload)
      commit('removeTick',payload.problemid)
      commit('removeTickFromCompetition',payload.problemid)
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
      const ret = await api.saveTick(payload)
      commit('updateProblem', ret.problem)
      // Update also tries in profile
      if (payload.ticktype=='tick') {
        commit('addTicksAllTime',ret.tick)
        commit('addTickToCompetition',ret.tick)
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
