import { createStore } from "vuex";
import api from './api'
import home from "./store/home.store.js"

export const filtersInitial = {
  gradeMin: 'min',
  gradeMax: 'max',
  sort: 'sector_asc',
  problemFilters : 'all',
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
    },
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
    gym : null,
    styles : [],
    grades : [],
    walls : [],
    profileLoaded : false,
    archive : {
      dates : {},
      dateDetails : {}
    },
  },
  mutations: {
    setSelectedSidePanelItem (state, payload) {
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
      state.isAuthenticated = true
    },
    setSidePanel (state, payload) {
      console.log("Sidepanel open",payload)
      state.sidePanelOpen = payload
    },
    setDarkMode(state, payload) {
      state.settings.darkMode = payload
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
    async getProfile({ commit, state } , payload) {
      commit('profileLoaded', false)
      if (state.gymid == null || state.gymid == "undefined") {
        // Don't load... Gym not selected.
        return null
      }
      const user = state.user
      if (user == null) {
        // Don't load, no user
        console.log("Cannot load profile, user is not set.")
        return null
      }
      console.log("Loading profile for gym id",state.gymid,user.email)
      const ret = await api.getProfile(state.gymid, user.email)
      if (ret!=null && ret.profile != null) {
        commit('profile', ret.profile)
        commit('gym', ret.gym)
        const problems = ret.gym.problems.reduce(( acc, prob) => {
          acc[prob.id] = prob
          return acc

        },{})
        commit('problems',problems)
        commit('styles',ret.styles)
        commit('grades',ret.grades)
        commit('walls', ret.walls)
        commit('climber', ret.climber)
        commit('profileLoaded', true )
        return state.profile
      }
      return null
    },
    async loadAllTimeTicks({ commit, state}, payload) {
      const ret = await api.loadAllTimeTicks(payload)
      commit('allTimeTicks', ret)
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
     async deleteTickByProblem({ state}, payload) {
      const ret = await api.deleteTickByProblem(payload.problemid)
      return ret
    },
    async deleteTick({ state, commit}, payload) {
      const ret = await api.deleteTick(payload)
      commit('problems', {...state.problems,[ret.problem.id] : ret.problem})
      return ret
    },
    async saveTick({ state, commit}, payload) {
      const ret = await api.saveTick(payload)
      commit('updateProblem', ret)
      // Update also tries in profile
      if (payload.ticktype=='pretick') {
        commit('addTriesAllTime',ret.tick) 
      } else {
        commit('addTicksAllTime',ret.tick) 
      }
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
    async login({ state , commit}, payload) {
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
      localStorage.gymid = gymid
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
      commit('archive' , {...state.archive, ['dateDetails'] : {...state.archive.dateDetails, [payload.date] : ret.day} })
      console.log("Fetched single day",state.archive.dateDetails[payload.date])
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
