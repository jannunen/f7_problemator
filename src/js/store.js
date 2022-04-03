import { createStore } from 'framework7';
import api from './api.js';
import { f7 } from 'framework7-vue'
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
    searchQuery: '',
    searchState: 'idle',
    searchResults: [],
    searchRecent: getFromLocalStorage('searchRecent', []),
    searchNext: true,
    searchNextLoading: false,
    backlog: getFromLocalStorage('backlog', []),
    archive: getFromLocalStorage('archive', []),
    wishlist: getFromLocalStorage('wishlist', []),
    topGames: [],
    recentGames: [],
    upcomingGames: [],
    test : 'kekkuli',
    gymid : 1,
    dark : true,
    profile : null,
    user : null,
    access_token : null,
    filters : {...filtersInitial},
    problems : [],
    gym : null,
    styles : [],
    grades : [],
    walls : [],
  },
  getters: {
    filters: ({ state }) => state.filters,
    problems: ({ state }) => state.problems,
    gym: ({ state }) => state.gym,
    styles: ({ state }) => state.styles,
    grades: ({ state }) => state.grades,
    walls: ({ state }) => state.walls,
    gyms: ({ state }) => state.gyms,
    gymid: ({ state }) => state.gymid,
    profile: ({ state }) => state.profile,
    user: ({ state }) => state.user,
    access_token: ({ state }) => state.access_token,
    test: ({ state }) => state.test,
    dark: ({ state }) => state.dark,
    searchResults: ({ state }) => state.searchResults,
    searchState: ({ state }) => state.searchState,
    searchRecent: ({ state }) => state.searchRecent,
    searchNext: ({ state }) => state.searchNext,
    searchNextLoading: ({ state }) => state.searchNextLoading,
    backlog: ({ state }) => state.backlog,
    archive: ({ state }) => state.archive,
    wishlist: ({ state }) => state.wishlist,
    topGames: ({ state }) => state.topGames,
    recentGames: ({ state }) => state.recentGames,
    upcomingGames: ({ state }) => state.upcomingGames,
  },
  actions: {
    async changeGym({state, dispatch}, gymid) {
      state.gymid = gymid
      dispatch('getProfile')
    },
    async getGyms({state}, payload) {
      const ret = await api.getGyms()
      state.gyms = ret.gyms
      return ret
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
    async deleteTick({ state}, payload) {
      const ret = await api.deleteTick(payload)
      state.problems = {...state.problems,[ret.problem.id] : ret.problem}
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
      state.problems = { ...state.problems, [pid]: {...problem,['likeCount'] : ret.likeCount, ['dislikeCount'] : ret.dislikeCount } }
    },
    async dislikeProblem({ state}, payload) {
      const pid = payload.id
      const ret = await api.dislikeProblem(pid)
      // Update problem dislikes
      const problem = state.problems[pid]
      debugger
      state.problems = { ...state.problems, [pid]: {...problem,['likeCount'] : ret.likeCount, ['dislikeCount'] : ret.dislikeCount } }
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
      if (problem) {
        state.problems = {...state.problems,[problem.id] : problem}
      }
      return problem
    },
    async getProfile({ state } , payload) {
      const ret = await api.getProfile(state.gymid)
      if (ret!=null && ret.profile != null) {
        state.profile = ret.profile
        state.gym = ret.gym
        state.styles = ret.styles
        state.grades = ret.grades
        state.walls = ret.walls
        return state.profile
      }
      return null
    },
    setDark({ state } , payload) {
      state.dark = payload
    },
    getGameInLists({ state }, gameId) {
      return {
        inBacklog:
          state.backlog.filter((game) => game.id === gameId).length > 0,
        inArchive:
          state.archive.filter((game) => game.id === gameId).length > 0,
        inWishlist:
          state.wishlist.filter((game) => game.id === gameId).length > 0,
      };
    },
    async getTopGames({ state }) {
      const response = await api.getTopGames();
      state.topGames = [...response.results]
        .filter((game) => !!game.background_image)
        .slice(0, 25);
    },
    async getRecentGames({ state }) {
      const response = await api.getRecentGames();
      state.recentGames = [...response.results];
    },
    async getUpcomingGames({ state }) {
      const response = await api.getUpcomingGames();
      state.upcomingGames = [...response.results];
    },
    addGameToList({ state }, { listName, game }) {
      const list = state[listName];
      const inList = list.filter((el) => el.id === game.id).length > 0;
      if (inList) return;
      list.push(game);
      state[listName] = [...list];
      localStorage[listName] = JSON.stringify(state[listName]);
    },
    removeGameFromList({ state }, { listName, game }) {
      const list = state[listName];
      const itemInList = list.filter((el) => el.id === game.id)[0];
      if (!itemInList) return;
      list.splice(list.indexOf(itemInList), 1);
      state[listName] = [...list];
      localStorage[listName] = JSON.stringify(state[listName]);
    },

    getGame(ctx, id) {
      return api.getGame(id);
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
