import { createStore } from "vuex";
import api from './api'
import home from "./store/home.store.js"
import climbers from './store/climber.store.js'

export const filtersInitial = {
  gradeMin: 'min',
  gradeMax: 'max',
  sort: 'sector_asc',
  problemFilters : 'all',
  routetypes :['boulder','sport'],
  nameFilter : null,
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
    climbers,
  },
  namespaced: true,
  state: {
    routetypes : ['boulder','sport'],
    rankings : null,
    rankingTarget : 'global',
    rankingtop10 : null, // This holds ranking top 10 per selected climber
    feed : [],
    feedLoading : true,
    newProblems : [],
    settings : {
      darkMode : true,
    },
    competition : null,
    compResults : null,
    upcomingcomps : {
      loaded : false,
      upcoming : [],
      ongoing : [],
      past : [],
    },
    tipShowStatus : {},
    public_ascents : {},
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
    pointEntryKey : null,
    access_token : null,
    authStep: 'idle', // idle, otp_sent, verifying
    authEmail: '',
    authType: 'signin',
    authError: null,
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
    set_public_ascents(state, payload) {
      /*
      state.public_ascents = state.public_ascents.map(asc => {
        if (asc.id == payload.id) {
          return {...asc,payload}
        }
        return asc
      })
      */

      state.public_ascents = {...state.public_ascents, [payload.problemid] : payload.ascents}
    },
    rankingtop10(state, payload) {
      state.rankingtop10= payload
    },
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
    setNameFilter(state, payload) {
      state.filters = { ...state.filters, ['nameFilter']: payload }
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
    setAuthStep(state, payload) {
      state.authStep = payload
    },
    setAuthEmail(state, payload) {
      state.authEmail = payload
    },
    setAuthType(state, payload) {
      state.authType = payload
    },
    setAuthError(state, payload) {
      state.authError = payload
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
    },
    pointEntryKey(state, payload) {
      state.pointEntryKey = payload
    },
    feed(state, payload) {
      state.feed = payload
    },
    feedLoading(state, payload) {
      state.feedLoading = payload
    },
    newProblems(state, payload) {
      state.newProblems = payload
    },
  },
  actions: {
    // These actions use the public comp key
    async getClimberByKey({state, commit}, payload) {
      const ret = await api.getClimberByKey(payload,'/compkey')
      commit('climber', ret)
      if (ret.id != null) {
        commit('pointEntryKey', payload.key)
      }
      return ret
    },
     async publicGetPointsPerRoute({ commit }, payload) {
      const ret = await api.getPointsPerRoute(payload,'/compkey')
      commit('updatePointsPerRoute',{ compid : payload.compid, points : ret})
      return ret
    },
     async publicGetCompResults({ state, commit }, payload) {
      const ret = await api.getCompResults(payload,'/compkey')
      commit('compResults',ret)
      return ret
    },
    async publicSaveTick({ state, commit, dispatch}, payload) {
      if (state.climber != null && state.climber.point_entry_key != null) {
        payload.point_entry_key = state.climber.point_entry_key  
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
    async newProblems({ commit }, payload) {
      const ret = await api.newProblems(payload)
      commit('newProblems', ret)
      return ret
    },
    async getFeed({ commit }, payload) {
      commit('feedLoading',true)
      const ret = await api.getFeed(payload)
      commit('feed', ret.feed)
      commit('feedLoading',false)
      return ret
    },
    async getPublicAscents({ commit }, payload) {
      const ret = await api.getPublicAscents(payload)
      //commit('set_public_ascents', { problemid: payload, ascents: ret.ascents })
      return ret
    },
    async getRankingTop10({commit},payload) {
      const ret = await api.rankingtop10(payload)
      commit('rankingtop10',ret)
      return ret

    },
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
      const gymid = localStorage.gymid
      commit('gymid',gymid)
      const ret = await api.getProfile(gymid)
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
     async getCompResults({ state, commit }, payload) {
      const ret = await api.getCompResults(payload)
      commit('compResults',ret)
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
      return ret
    },
    async deleteTick({ state, commit, dispatch}, payload) {
      const ret = await api.deleteTick(payload)
      commit('problems', {...state.problems,[ret.problem.id] : ret.problem})
      dispatch('rankings', { country: state.rankingTarget })

      return ret
    },
    async saveTick({ state, commit, dispatch}, payload) {
      if (state.climber != null && state.climber.point_entry_key != null) {
        payload.point_entry_key = state.climber.point_entry_key  
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
    async commentProblem({ state , commit}, payload) {
      const pid = payload.id
      const ret = await api.commentProblem(payload)
      // Update problem comments
      const problem = state.problems[pid]
      commit('problems' , { ...state.problems, [pid]: {...problem, ['messages'] : ret.messages, ['messageCount'] : ret.messages.length } })
    },
    async requestOtp({ commit }, payload) {
      commit('setAuthError', null)
      commit('setAuthEmail', payload.email)
      commit('setAuthType', payload.type)
      try {
        await api.requestOtp(payload)
        commit('setAuthStep', 'otp_sent')
      } catch (err) {
        commit('setAuthError', err.response?.data?.error || 'Failed to send code.')
      }
    },
    async verifyOtp({ commit }, payload) {
      commit('setAuthError', null)
      commit('setAuthStep', 'verifying')
      try {
        const ret = await api.verifyOtp(payload)
        commit('setToken', ret.access_token)
        commit('user', ret.user)
        commit('setIsAuthenticated', true)
        commit('setAuthStep', 'idle')
        return ret
      } catch (err) {
        commit('setAuthStep', 'otp_sent')
        commit('setAuthError', err.response?.data?.error || 'Verification failed.')
      }
    },
    logout({ commit }) {
      localStorage.removeItem('token')
      localStorage.removeItem('gymid')
      commit('setToken', null)
      commit('user', null)
      commit('climber', null)
      commit('setIsAuthenticated', false)
      commit('profile', { settings: null })
      commit('profileLoaded', false)
      commit('setAuthStep', 'idle')
      commit('setAuthEmail', '')
      commit('setAuthError', null)
      commit('setReady', true)
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
    async saveSettings({state, commit, dispatch}, payload) {
      const ret =  await api.saveSettings(payload)
      commit('climber', ret.climber)
      return ret
      
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
      return ret
    },
    async registerToComp({state, commit, dispatch}, payload) {
      const ret = await api.registerToComp(payload)
      // Update the status of participation status for UPCOMING comps
      commit('updatecompparticipates',ret.participates)
      let newData = {
        ...state.upcomingcomps
      } 
      newData.upcoming = newData.upcoming.map(comp => {
        if (comp.id == payload.compid) {
          return {...comp,
            ['paidregistrations'] : [...comp.paidregistrations, ret.participates]
          }
        }
        return comp
      })
      commit('upcomingcomps' , ret.participates)
      return ret
    },
    async getCompetition({state, commit }, payload) {
      const ret = await api.getCompetition(payload)
      commit('competition' , ret)
      return ret
    },
    async getClimber({state, commit}, payload) {
      const ret = await api.getClimber(payload)
      commit('climber', ret)
      return ret
    },
    async getUpcomingCompetitions ({commit}, payload) {
      const comps = await api.getUpcomingCompetitions(payload)
      commit('upcomingcomps' , {
        upcoming : comps.upcoming,
        ongoing : comps.ongoing,
        past : comps.past,
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
