import { createStore } from 'framework7';
import api from './api.js';
import { f7 } from 'framework7-vue'
import { useAuth0 } from '@auth0/auth0-vue';
const apihost = import.meta.env.VITE_API_HOST
const apiprefix = "/api/v03"

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

const store = createStore({
  state: {
    settings : {
      darkMode : true,
    },
    competition : null,
    upcomingcomps : {
      loaded : false,
      upcoming : [],
      ongoing : [],
    },
    searchQuery: '',
    searchState: 'idle',
    initializing : true,
    searchResults: [],
    searchRecent: getFromLocalStorage('searchRecent', []),
    searchNext: true,
    searchNextLoading: false,
    sidePanelOpen : false,
    selectedLeftPanelItem : 'home',
    backlog: getFromLocalStorage('backlog', []),
    wishlist: getFromLocalStorage('wishlist', []),
    isAuthenticated : false,
    topGames: [],
    recentGames: [],
    upcomingGames: [],
    gymid : null,
    profile : null,
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
    },
  },
  getters: {
    tickDates: ({ state }) =>  state.archive.dates ,
    climber: ({ state }) => state.climber,
    competition: ({ state }) => state.competition,
    upcomingcompetitions: ({ state }) => state.upcomingcomps,
    profileLoaded: ({ state }) => state.profileLoaded,
    filters: ({ state }) => state.filters,
    problems: ({ state }) => state.problems,
    gym: ({ state }) => state.gym,
    styles: ({ state }) => state.styles,
    initializing: ({ state }) => state.initializing,
    grades: ({ state }) => state.grades,
    walls: ({ state }) => state.walls,
    gyms: ({ state }) => state.gyms,
    gymid: ({ state }) => state.gymid,
    isAuthenticated: ({ state }) => state.isAuthenticated,
    profile: ({ state }) => state.profile,
    user: ({ state }) => state.user,
    access_token: ({ state }) => state.access_token,
    searchResults: ({ state }) => state.searchResults,
    searchState: ({ state }) => state.searchState,
    searchRecent: ({ state }) => state.searchRecent,
    searchNext: ({ state }) => state.searchNext,
    searchNextLoading: ({ state }) => state.searchNextLoading,
    sidePanelOpen: ({ state }) => state.sidePanelOpen,
    selectedLeftPanelItem: ({ state }) => state.selectedLeftPanelItem,
    backlog: ({ state }) => state.backlog,
    archive: ({ state }) => state.archive,
    wishlist: ({ state }) => state.wishlist,
    darkMode: ({ state }) => state.settings.darkMode,
  },
  actions: {
    async getTickDates({state, dispatch}, payload) {
      const ret = await api.getTickDates(payload)
      state.archive = {...state.archive, ['dates']:  ret.dates }
      console.log("Setting archive dates",state.archive.dates)
      return ret.dates
    },
    async registerToComp({state, dispatch}, payload) {
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
      state.upcomingcomps = newData
      return ret
    },
    async getCompetition({state, dispatch}, payload) {
      const ret = await api.getCompetition(payload)
      state.competition = ret
      return ret
    },
    async getUpcomingCompetitions ({state, dispatch}, payload) {
      const comps = await api.getUpcomingCompetitions(payload)
      state.upcomingcomps = {
        upcoming : comps.upcoming,
        ongoing : comps.ongoing,
        loaded : true
      }
      return comps
    },
    async saveSettings({state, dispatch}, payload) {
      return await api.saveSettings(payload)
    },
    setInitializing({state, dispatch}, payload) {
      state.initializing = payload
    },
    setSelectedLeftPanelItem({state, dispatch}, payload) {
      state.selectedLeftPanelItem = payload
    },
    setIsAuthenticated ({state, dispatch}, payload) {
      state.isAuthenticated = payload
    },
    setAccessToken ({state, dispatch}, payload) {
      state.access_token = payload
    },
    setSidePanel ({state, dispatch}, payload) {
      console.log("Sidepanel open",payload)
      state.sidePanelOpen = payload
    },
    async changeGym({state, dispatch}, gymid) {
      localStorage.gymid = gymid
      state.gymid =gymid
      dispatch('getProfile')
    },
    async getGyms({state}, payload) {
      const ret = await api.getGyms()
      state.gyms = ret.gyms
      return ret
    },
    setDarkMode({state}, payload) {
      state.settings.darkMode = payload
    },
    setFilterProblems({state}, payload) {
      state.filters = { ...state.filters, ['problemFilters']: payload }
    },
    setFilterStyles({state}, payload) {
      state.filters = { ...state.filters, ['styles']: payload }
    },
    setFilterGradeMin({state}, payload) {
      state.filters = { ...state.filters, ['gradeMin']: payload }
    },
    setFilterGradeMax({state}, payload) {
      state.filters = { ...state.filters, ['gradeMax']: payload }
    },
    setFilterWalls({state}, payload) {
      state.filters = { ...state.filters, ['walls']: payload }
    },
    setFilterSort({state}, payload) {
      console.log("Changing sorting to",payload)
      state.filters = { ...state.filters, ['sort']: payload }
    },
    resetFilters({ state}) {
      state.filters = {...filtersInitial}
    },
    async deleteProject({ state}, payload) {
      state.access_token = await getAccess
      const ret = await api.deleteProject(payload)
      state.problems = {...state.problems,[ret.problem.id] : ret.problem}
    },
     async deleteTickByProblem({ state}, payload) {
      const ret = await api.deleteTickByProblem(payload.problemid)
      return ret
    },
    async deleteTick({ state}, payload) {
      const ret = await api.deleteTick(payload)
      state.problems = {...state.problems,[ret.problem.id] : ret.problem}
      return ret
    },
    async saveTick({ state}, payload) {
      const ret = await api.saveTick(payload)
      state.problems = {...state.problems,[ret.problem.id] : ret.problem}
      return ret
    },
    async likeProblem({ state}, payload) {
      const pid = payload.id
      const ret = await api.likeProblem(pid)
      // Update problem likes
      const problem = state.problems[pid]
      state.problems = { ...state.problems, [pid]: {...problem,['c_like'] : ret.likeCount, ['likeCount'] : ret.likeCount, ['c_dislike'] : ret.dislikeCount, ['dislikeCount'] : ret.dislikeCount } }
    },
    async dislikeProblem({ state}, payload) {
      const pid = payload.id
      const ret = await api.dislikeProblem(pid)
      // Update problem dislikes
      const problem = state.problems[pid]
      state.problems = { ...state.problems, [pid]: {...problem,['likeCount'] : ret.likeCount, ['dislikeCount'] : ret.dislikeCount } }
    },
    setUser({ state}, payload) {
      state.user = payload
      return payload
    },
    async login({ state}, payload) {
      const ret = await api.login(payload)
      if (ret.user != null) {
        // Login ok
        state.user = ret.user
        state.access_token = ret.access_token
        state.expires_in = ret.expires_in
        return ret
      } else {
        return {error : true, message : 'Incorrect login'}
      }

    },
    async getProblemDetails({ state }, payload) {
      const ret = await api.getProblemDetails(payload);
      const problem = ret.problem
      const curProblem = state.problems[problem.id]
      const merged = {...curProblem, ...problem}
      if (problem) {
        state.problems = {...state.problems,[problem.id] : merged}
      }
      return problem
    },
    setToken({ state } , payload) {
      //const ret = await api.setToken(payload)
      state.access_token = payload
    },
    async getProfile({ state } , payload) {
      state.profileLoaded = false
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
        state.profile = ret.profile
        state.gym = ret.gym
        state.problems = ret.gym.problems.reduce(( acc, prob) => {
          acc[prob.id] = prob
          return acc

        },{})
        state.styles = ret.styles
        state.grades = ret.grades
        state.walls = ret.walls
        state.climber = ret.climber
        state.profileLoaded = {...state, ['profileLoaded'] : true} 
        return state.profile
      }
      return null
    },
    async search({ state }, query) {
      if (query === state.searchQuery) {
        return;
      }
      // Save recent search
      if (!state.searchRecent.includes(query)) {
        state.searchRecent.unshift(query);
        state.searchRecent = [...state.searchRecent.slice(0, 12)];
        localStorage.searchRecent = JSON.stringify(state.searchRecent);
      }

      state.searchQuery = query;
      state.searchState = 'loading';
      state.searchResults = [];
      state.searchNext = true;

      const { results, next } = await api.search(query);

      if (!results || results.length === 0) {
        state.searchState = 'empty';
        state.searchResults = [];
        state.searchNext = null;
        return;
      }
      state.searchState = 'results';
      state.searchResults = [...results];
      state.searchNext = next;
    },
    async searchNext({ state }) {
      if (state.searchNextLoading || !state.searchNext) return;
      state.searchNextLoading = true;
      const { results, next } = await api.searchNext(state.searchNext);
      if (!results || results.length === 0) {
        state.searchNext = null;
        state.searchNextLoading = false;
        return;
      }
      state.searchResults = [...state.searchResults, ...results];
      state.searchNext = next;
      setTimeout(() => {
        state.searchNextLoading = false;
      });
    },
  },
});

export default store;
