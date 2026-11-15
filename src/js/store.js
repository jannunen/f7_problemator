import { createStore } from "vuex";
import { invalidateAfter } from '@js/queryClient'
import api from './api'
import { useClimberStore } from './stores/climber.store.js'
import { pinia } from './stores/index.js'

// The signed-in-or-public-point-entry climber's point_entry_key, if any —
// read from the Pinia climber store (Task 1 of the Activity-group migration
// plan moved climber identity off this Vuex store entirely). Only the
// public-comp-key actions below need this; everything else about climber
// identity now lives in useClimberStore.
const pointEntryKeyOf = () => useClimberStore(pinia).climber?.point_entry_key ?? null

// The server keeps the highest checkpoint: show what it stored, not what was tapped.
const commitSavedCheckpoint = (commit, problemid, ret) => {
  // sport: a partial height, stored as the route's score. It has no checkpoint.
  if (ret.score != null) {
    commit('setMyCheckpointScore', { problemid, score: ret.score })
    return
  }
  if (ret.attempts != null && ret.zone_tries != null) {
    // A zone tries write. checkpoint 0 + attempts 0 means the row is gone (undo back to empty).
    if (!(parseInt(ret.checkpoint) > 0) && !(parseInt(ret.attempts) > 0)) {
      commit('removeMyCheckpoint', problemid)
      return
    }
    commit('setMyCheckpointTries', { problemid, attempts: ret.attempts, zone_tries: ret.zone_tries })
  }
  commit('setMyCheckpoint', { problemid, checkpoint: ret.checkpoint })
}

export default createStore({
  namespaced: true,
  state: {
    rankings : null,
    rankingTarget : 'global',
    competition : null,
    compResults : null,
    ticksLoaded : false,
    alltime : {
      ticks : [],
      tries : []
    },
    problems : [],
  },

  mutations: {
    rankingTarget(state, payload) {
      state.rankingTarget = payload
    },
    rankings (state, payload) {
      state.rankings = payload
    },
    ticksLoaded (state, payload) {
      state.ticksLoaded = payload
    },
    compResults(state, payload) {
      state.compResults = payload
    },
    updatePointsPerRoute(state, payload) {
      state.competition.points_per_route = payload.points
    },
    removeParticipation(state, payload) {
        state.competition.paidregistrations = state.competition.paidregistrations
        .filter(x => x.id != payload.contenderid && x.pivot.serieid != payload.category) 
        state.competition.unpaidregistrations = state.competition.unpaidregistrations
        .filter(x => x.id != payload.contenderid && x.pivot.serieid != payload.category) 

    },
    updatecompparticipates(state, payload) {
      if (payload.pivot.paid) {
        state.competition.paidregistrations = [...state.competition.paidregistrations, payload] 
      } else {
        state.competition.unpaidregistrations = [...state.competition.unpaidregistrations, payload] 
      }
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
    addTickToCompetition(state, payload) {
      if (state.competition && state.competition.userticks) {
        state.competition.userticks = {...state.competition.userticks, [payload.problemid] : payload}
      }
    },
    setMyCheckpoint(state, payload) {
      if (state.competition) {
        const mine = Array.isArray(state.competition.my_checkpoints) ? {} : { ...(state.competition.my_checkpoints ?? {}) }
        mine[payload.problemid] = payload.checkpoint
        state.competition.my_checkpoints = mine
      }
    },
    removeMyCheckpoint(state, payload) {
      if (state.competition) {
        const mine = Array.isArray(state.competition.my_checkpoints) ? {} : { ...(state.competition.my_checkpoints ?? {}) }
        delete mine[payload]
        state.competition.my_checkpoints = mine
        const tries = Array.isArray(state.competition.my_checkpoint_tries) ? {} : { ...(state.competition.my_checkpoint_tries ?? {}) }
        delete tries[payload]
        state.competition.my_checkpoint_tries = tries
        const scores = Array.isArray(state.competition.my_checkpoint_scores) ? {} : { ...(state.competition.my_checkpoint_scores ?? {}) }
        delete scores[payload]
        state.competition.my_checkpoint_scores = scores
      }
    },
    // sport's partial height for one route, as the server stored it.
    setMyCheckpointScore(state, payload) {
      if (state.competition) {
        const scores = Array.isArray(state.competition.my_checkpoint_scores) ? {} : { ...(state.competition.my_checkpoint_scores ?? {}) }
        scores[payload.problemid] = payload.score
        state.competition.my_checkpoint_scores = scores
      }
    },
    // Zone tries for one route ({attempts, zone_tries}), as the server stored them.
    setMyCheckpointTries(state, payload) {
      if (state.competition) {
        const tries = Array.isArray(state.competition.my_checkpoint_tries) ? {} : { ...(state.competition.my_checkpoint_tries ?? {}) }
        tries[payload.problemid] = { attempts: payload.attempts, zone_tries: payload.zone_tries }
        state.competition.my_checkpoint_tries = tries
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
    competition(state, payload) {
      state.competition = payload
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
     async publicGetPointsPerRoute({ commit }, payload) {
      const ret = await api.getPointsPerRoute(payload,'/compkey')
      commit('updatePointsPerRoute',{ compid : payload.compid, points : ret})
      return ret
    },
     async publicGetCompResults({ state, commit }, payload) {
      const ret = await api.getCompResults(payload,'/compkey')
      // A slow response can land after the climber has navigated to a
      // different competition; committing it then hands ShowResults a
      // results shape that doesn't match the now-displayed comp's type
      // (eg. a flat points table under type 'ifsc_2024_bouldering'),
      // which crashes on result.climber.id.
      if (state.competition == null || ret?.comp?.id == state.competition.id) {
        commit('compResults',ret)
      }
      return ret
    },
    async publicSaveTick({ state, commit, dispatch}, payload) {
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
      dispatch('rankings', { country: state.rankingTarget })
      return ret
    },
     async publicDeleteTickByProblem({ state,commit}, payload) {
      const ret = await api.deleteTickByProblem(payload,'/compkey')
      commit('removeTick',payload.problemid)
      commit('removeTickFromCompetition',payload.problemid)
      return ret
    },
    async publicGetCompetition({state, commit }, payload) {
      const ret = await api.getCompetition(payload,'/compkey')
      commit('competition' , ret)
      return ret
    },
    // These actions use the normal oauth
    async rankings({commit},payload) {
      const ret = await api.ranking(payload)
      commit('rankings',ret)
      return ret
    },
    async requestSync({ state}, payload) {
      const ret = await api.requestSync(payload)
      return ret
    },
    // getProfile moved to queryKeys.js's `profile` query (Task 7). Its
    // rankingTarget/problems commits moved with it, into that query's
    // queryFn; its climber bridge moved to the Pinia climber store directly
    // (this plan's Task 1) rather than through this still-live Vuex store.
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
     async getCompResults({ state, commit }, payload) {
      const ret = await api.getCompResults(payload)
      // See publicGetCompResults above: discard a response that arrives
      // after the climber has navigated to a different competition.
      if (state.competition == null || ret?.comp?.id == state.competition.id) {
        commit('compResults',ret)
      }
      return ret
    },
     async getPointsPerRoute({ commit }, payload) {
      const ret = await api.getPointsPerRoute(payload)
      commit('updatePointsPerRoute',{ compid : payload.compid, points : ret})
      return ret
    },
     async deleteTickByProblem({ state,commit}, payload) {
      const ret = await api.deleteTickByProblem(payload)
      commit('removeTick',payload.problemid)
      commit('removeTickFromCompetition',payload.problemid)
      invalidateAfter('deleteTickByProblem')
      return ret
    },
    async deleteTick({ state, commit, dispatch}, payload) {
      const ret = await api.deleteTick(payload)
      commit('problems', {...state.problems,[ret.problem.id] : ret.problem})
      dispatch('rankings', { country: state.rankingTarget })
      invalidateAfter('deleteTick')

      return ret
    },
    async saveTick({ state, commit, dispatch}, payload) {
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
      dispatch('rankings', { country: state.rankingTarget })
      invalidateAfter('saveTick')
      return ret
    },
    async saveCheckpoint({ commit }, payload) {
      const ret = await api.saveCheckpoint(payload)
      commitSavedCheckpoint(commit, payload.problemid, ret)
      return ret
    },
    async deleteCheckpoint({ commit }, payload) {
      const ret = await api.deleteCheckpoint(payload)
      commit('removeMyCheckpoint', payload.problemid)
      return ret
    },
    async publicSaveCheckpoint({ state, commit }, payload) {
      if (pointEntryKeyOf() != null) {
        payload.point_entry_key = pointEntryKeyOf()
      }
      const ret = await api.saveCheckpoint(payload, '/compkey')
      commitSavedCheckpoint(commit, payload.problemid, ret)
      return ret
    },
    async publicDeleteCheckpoint({ state, commit }, payload) {
      if (pointEntryKeyOf() != null) {
        payload.point_entry_key = pointEntryKeyOf()
      }
      const ret = await api.deleteCheckpoint(payload, '/compkey')
      commit('removeMyCheckpoint', payload.problemid)
      return ret
    },
    async addTopJudging(_ctx, payload) {
      const ret = await api.addTopAscent(payload)
      // The controller answers 200 with {error:true,message} for refusals.
      if (ret && ret.error) {
        throw new Error(ret.message || 'Could not record the top')
      }
      return ret
    },
    async addCheckpointJudging(_ctx, payload) {
      return await api.addCheckpointAscent(payload)
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
    async removeCompAscent({state, dispatch}, payload) {
      const ret = await api.removeCompAscent(payload)
      return ret
    },
    async unRegisterToComp({state, commit, dispatch}, payload) {
      const ret = await api.unRegisterToComp(payload)
      // Remove these from the state
      commit('removeParticipation', payload)
      return ret
    },
    async registerToComp({state, commit, dispatch}, payload) {
      const ret = await api.registerToComp(payload)
      commit('updatecompparticipates',ret.participates)
      return ret
    },
    async getCompetition({state, commit }, payload) {
      const ret = await api.getCompetition(payload)
      commit('competition' , ret)
      return ret
    },
    // saveGymSettings dropped (Task 7): zero call sites, same as when it
    // was last checked. getClimberByKey moved to mutations.getClimberByKey
    // and getClimber dropped (zero dispatch sites, same as when it was last
    // checked) — both this plan's Task 1.
  },
  getters: {
  }
});
