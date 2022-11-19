import { createStore } from "vuex";
import api from './api'
import home from "./store/home.store.js"

export const filtersInitial = {
  gradeMin: 'min',
  gradeMax: 'max',
  sort: 'sector_asc',
  problemFilters : 'all',
  routetypes :['boulder','sport'],
  styles: [],
  walls: [],
  problemStates: ['all'], // all, ticked, projects
}

const getFromLocalStorage = (key, defaultValue) => {
  return localStorage[key] ? JSON.parse(localStorage[key]) : defaultValue;
};

export default createStore({
  modules : {
    home,
  },
  state: {
    routetypes : ['boulder','sport'],
    rankings : null,
    rankingTarget : 'global',
    settings : {
      darkMode : true,
    },
    competition : null,
    compResults : null,
    upcomingcomps : {
      loaded : false,
      upcoming : [],
      ongoing : [],
    },
    tipShowStatus : {},
    searchQuery: '',
    searchState: 'idle',
    initializing : true,
    ready : false,
    searchResults: [],
    sidePanelOpen : false,
    selectedLeftPanelItem : 'home',
    backlog: getFromLocalStorage('backlog', []),
    wishlist: getFromLocalStorage('wishlist', []),
    isAuthenticated : false,
    gymid : null,
    profile : {
      settings : null,
    },
    ticksLoaded : false,
    alltime : {
      ticks : [],
      tries : []
    },
    user : null,
    climber : null,
    access_token : null,
    filters : {...filtersInitial},
    gyms : [],
    problems : [],
    gym : { 
      problems :[],
    },
    styles : [],
    grades : [],
    walls : [],
    profileLoaded : false,
    archive : {
      dates : {},
      dateDetails : {}
    },
    version : "",
    server_version : "",
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
    serverVersion(state, payload) {
      state.server_version = payload
    },
    setVersion(state, payload) {
      state.version = payload
    },
    setTipShowStatus (state, payload) {
      state.tipShowStatus = payload
    },
    setSelectedLeftPanelItem (state, payload) {
      state.selectedLeftPanelItem = payload
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
    removeTick(state, pid) {
      state.alltime.ticks = state.alltime.ticks.filter(x => x.problemid != pid)
    },
    expires_in(state, payload) {
      state.expires_in = payload
    },
    setInitializing(state, payload) {
      state.initializing = payload
    },
    user(state, payload) {
      state.user = payload
    },
    competition(state, payload) {
      state.competition = payload
    },
    upcomingcomps(state, payload) {
      state.upcomingcomps = payload
    },
    archive(state, payload) {
      state.archive = payload
    },
    updateProblem(state, payload) {
      state.problems = {...state.problems,[payload.id] : payload}
    },
    gymid(state, payload) {
      state.gymid = payload
    },
    gyms(state, payload) {
      state.gyms = payload
    },
    gym(state, payload) {
      state.gym = payload
    },
    setReady(state, payload) {
      state.ready = payload
    },
    profile(state, payload) {
      state.profile = payload
    },
    setToken( state  , payload) {
      state.access_token = payload
      localStorage.setItem('token', payload)
    },
    setSidePanel (state, payload) {
      state.sidePanelOpen = payload
    },
    setDarkMode(state, payload) {
      state.settings.darkMode = payload
    },
    setFilterRoutetype(state, payload) {
      state.filters = { ...state.filters, ['routetypes']: payload }
    },
    setFilterProblems(state, payload) {
      state.filters = { ...state.filters, ['problemFilters']: payload }
    },
    setFilterStyles(state, payload) {
      state.filters = { ...state.filters, ['styles']: payload }
    },
    setFilterGradeMin(state, payload) {
      state.filters = { ...state.filters, ['gradeMin']: payload }
    },
    setFilterGradeMax(state, payload) {
      state.filters = { ...state.filters, ['gradeMax']: payload }
    },
    setFilterWalls(state, payload) {
      state.filters = { ...state.filters, ['walls']: payload }
    },
    setFilterSort(state, payload) {
      console.log("Changing sorting to",payload)
      state.filters = { ...state.filters, ['sort']: payload }
    },
    resetFilters( state) {
      state.filters = {...filtersInitial}
    },
    setIsAuthenticated (state, payload) {
      state.isAuthenticated = payload
    },
    isAbsolute (state, payload) {
      state.isAbsolute = payload
    },
    profileLoaded(state, payload) {
      state.profileLoaded = payload
    },
    problems(state, payload) {
      state.problems = payload
    },
    styles(state, payload) {
      state.styles = payload
    },
    grades(state, payload) {
      state.grades = payload
    },
    walls(state, payload) {
      state.walls = payload
    },
    climber(state, payload) {
      state.climber = payload
    }
  },
  actions: {
    async rankings({commit},payload) {
      const ret = await api.ranking(payload)
      commit('rankings',ret)
      return ret

    },
    async version({commit}) {
      const ret = await api.version()
      commit('serverVersion',ret.version)
      return ret
    },
    async requestSync({ state}, payload) {
      const ret = await api.requestSync(payload)
      return ret
    },
    tipShowStatus({commit, state}, payload) {
      // When status change, save to localStorage and 
      // update state.
      localStorage.setItem('tipShowStatus', JSON.stringify(payload))
      commit('setTipShowStatus', payload)
    },
    async getProfile({ commit, state } , payload) {
      commit('profileLoaded', false)
      const user = state.user
      if (user == null) {
        // Don't load, no user
        console.log("User is null, argh, fail. exit.")
        return null
      }
      const gymid = localStorage.gymid
      commit('gymid',gymid)
      const ret = await api.getProfile(gymid, user.email, user.sub)
      if (ret!=null && ret.profile != null) {
        commit('profile', ret.profile)
        commit('gym', ret.gym)
        commit('rankingTarget',ret.gym.country)
        if (ret.gym.problems != null) {
          const problems = ret.gym.problems.reduce(( acc, prob) => {
            acc[prob.id] = prob
            return acc

          },{})
          commit('problems',problems)
        }
        commit('styles',ret.styles)
        commit('grades',ret.grades)
        commit('walls', ret.gym.walls)
        commit('climber', ret.climber)
        commit('profileLoaded', true )
        commit('setIsAuthenticated', true )
        commit('setReady',true)
        commit('serverVersion',ret.version)
        return state.profile
      }
      return null
    },
    async loadAllTimeTicks({ commit, state}, payload) {
      const ret = await api.loadAllTimeTicks(payload)
      commit('allTimeTicks', ret)
      commit('ticksLoaded',true)
    },
    async deleteProject({ commit, state}, payload) {
      const ret = await api.deleteProject(payload)
      commit('problems', {...state.problems,[ret.problem.id] : ret.problem})
    },
     async getCompResults({ commit }, payload) {
      const ret = await api.getCompResults(payload.compid)
      commit('compResults',ret)
      return ret
    },
     async getPointsPerRoute({ commit }, payload) {
      const ret = await api.getPointsPerRoute(payload.compid)
      commit('updatePointsPerRoute',{ compid : payload.compid, points : ret})
      return ret
    },
     async deleteTickByProblem({ state,commit}, payload) {
      const ret = await api.deleteTickByProblem(payload.problemid)
      commit('removeTick',payload.problemid)
      return ret
    },
    async deleteTick({ state, commit, dispatch}, payload) {
      const ret = await api.deleteTick(payload)
      commit('problems', {...state.problems,[ret.problem.id] : ret.problem})
      dispatch('rankings', { country: state.rankingTarget })

      return ret
    },
    async saveTick({ state, commit, dispatch}, payload) {
      const ret = await api.saveTick(payload)
      commit('updateProblem', ret.problem)
      // Update also tries in profile
      if (payload.ticktype=='tick') {
        commit('addTicksAllTime',ret.tick) 
      } else {
        commit('addTriesAllTime',ret.tick) 
      }
      dispatch('rankings', { country: state.rankingTarget })
      return ret
    },
    async likeProblem({ state , commit}, payload) {
      const pid = payload.id
      const ret = await api.likeProblem(pid)
      // Update problem likes
      const problem = state.problems[pid]
      commit('problems' , { ...state.problems, [pid]: {...problem,['c_like'] : ret.likeCount, ['likeCount'] : ret.likeCount, ['c_dislike'] : ret.dislikeCount, ['dislikeCount'] : ret.dislikeCount } })
    },
    async dislikeProblem({ state , commit}, payload) {
      const pid = payload.id
      const ret = await api.dislikeProblem(pid)
      // Update problem dislikes
      const problem = state.problems[pid]
      commit('problems' , { ...state.problems, [pid]: {...problem,['likeCount'] : ret.likeCount, ['dislikeCount'] : ret.dislikeCount } })
    },
    setUser({  commit}, payload) {
      commit('user' , payload)
      return payload
    },
    async login({  commit}, payload) {
      const ret = await api.login(payload)
      if (ret.user != null) {
        // Login ok
        commit('user' , ret.user)
        commit('setToken' , ret.access_token)
        commit('expires_in',  ret.expires_in)
        return ret
      } else {
        return {error : true, message : 'Incorrect login'}
      }

    },
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
    async changeGym({state, commit, dispatch}, gymid) {
      localStorage.setItem('gymid', gymid)
      commit('setReady',false)
      commit('gymid' ,gymid)
      dispatch('getProfile')
    },
    async getGyms({commit}, payload) {
      const ret = await api.getGyms()
      commit('gyms' , ret.gyms)
      return ret
    },
    async saveSettings({state, dispatch}, payload) {
      return await api.saveSettings(payload)
    },
    async removeCompAscent({state, dispatch}, payload) {
      const ret = await api.removeCompAscent(payload)
      return ret
    },
    async fetchArchiveDate({state, commit, dispatch}, payload) {
      const ret = await api.getArchiveDay(payload)
      //commit('archive' , {...state.archive, ['dateDetails'] : {...state.archive.dateDetails, [payload.span] : ret.day} })
      commit('archive' , {...state.archive, ['dateDetails'] : {...state.archive.dateDetails, [payload.span] : ret.day} })
      return ret.day
    },
    async getTickDates({state, commit, dispatch}, payload) {
      const ret = await api.getTickDates(payload)
      commit('archive' , {...state.archive, ['dates']:  ret.dates })
      console.log("Setting archive dates",state.archive.dates)
      return ret.dates
    },
    async unRegisterToComp({state, commit, dispatch}, payload) {
      const ret = await api.unRegisterToComp(payload)
      // Remove these from the state
      commit('removeParticipation', payload)
    },
    async registerToComp({state, commit, dispatch}, payload) {
      const ret = await api.registerToComp(payload)
      // Update the status of participation status
      let newData = {
        ...state.upcomingcomps
      } 
      newData.upcoming = newData.upcoming.map(comp => {
        if (comp.id == payload.compid) {
          return {...comp,
            participates : true,
          }
        }
        return comp
      })
      newData.ongoing = newData.ongoing.map(comp => {
        if (comp.id == payload.compid) {
          return {...comp,
            participates : true,
          }
        }
        return comp
      })
      commit('updatecompparticipates',ret.participates)
      commit('upcomingcomps' , newData)
      return ret
    },
    async getCompetition({state, commit, dispatch}, payload) {
      const ret = await api.getCompetition(payload)
      commit('competition' , ret)
      return ret
    },
    async getUpcomingCompetitions ({commit}, payload) {
      const comps = await api.getUpcomingCompetitions(payload)
      commit('upcomingcomps' , {
        upcoming : comps.upcoming,
        ongoing : comps.ongoing,
        loaded : true
      })
      return comps
    },
    async  saveGymSettings({ commit } ,payload) {
      const ret = await api.saveGymSettings(payload)
      commit('gym',ret)
      return ret
    },
  },
  getters: {
  }
});
