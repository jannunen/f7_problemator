import { createStore } from 'framework7/lite';
import axios from 'axios'
const apihost = import.meta.env.VITE_API_HOST
const api = apihost+'/api/v03/'
const gymid = 1;
// This is needed by the backend to recognize ajax request
axios.defaults.headers['Accept'] =  'application/json' 

const store = createStore({
  state: {
    profile : {},
    gym : {},
    user : {},
    grades :[] ,
    walls : [],
    problems : {},
    filters : {
      gradeMin : 'min',
      gradeMax : 'max',
      sort : 'sector_asc',
      styles : [],
      walls : [],
      problemStates : ['all'], // all, ticked, projects
    }
  },
  getters: {
    styles({ state }) {
      return state.styles;
    },
    filters({ state }) {
      return state.filters;
    },
    profile({ state }) {
      return state.profile;
    },
    gym({state}) {
      return state.gym
    },
    problems({state}) {
      return state.gym.problems
    },
    grades({state}) {
      return state.grades
    },
    walls({state}) {
      return state.walls
    },
    getBoulders({state}) {
      return state.gym.problems.filter(item => item.routetype == 'boulder' )
    },
    getRoutes({state}) {
      return state.gym.problems.filter(item => item.routetype == 'route' )
    },

  },
  actions: {
    setSort({ state },payload) {
      state.filters= {...state.filters, ['sort'] : payload}
    },
    setStyles({ state },payload) {
      state.filters= {...state.filters, ['styles'] : payload}
    },
    setGradeMin({ state },payload) {
      state.filters= {...state.filters, ['gradeMin'] : payload}
    },
    setGradeMax({ state },payload) {
      state.filters= {...state.filters, ['gradeMax'] : payload}
    },
    setStyles({ state },payload) {
      state.filters= {...state.filters, ['styles'] : payload}
    },
    setWalls({ state },payload) {
      state.filters= {...state.filters, ['walls'] : payload}
    },
    refreshJWT({ state },payload) {
      return axios.post(apihost+"/api/auth/refresh")
      .then(r=>r.data)
      .then(json => {
        state.user = json.user
        return {user : state.user, jwt : json.access_token}
      })
    },
    login({ state },payload) {
      return axios.post(apihost+"/api/auth/login",payload)
      .then(r=>r.data)
      .then(json => {
        state.user = json.user
        return {user : state.user, jwt : json.access_token}
      })
    },
    getProfile({ state }) {
      return axios.get(api+"profile/?gymid="+gymid)
      .then(r=>r.data)
      .then(json => {
        state.profile = json.profile
        state.gym = json.gym
        state.grades = json.grades
        state.walls = json.walls
        state.styles = json.styles
      })
      .catch(err => {
      })
    },
    getProblem({ state },payload) {
      return axios.get(api+"problem/"+payload)
      .then(r=>r.data)
      .then(json => {
        state.problems = {...state.problems,[json.problem.id] : json.problem}
        return json.problem
      })
      .catch(err => {
      })
    },
  }
})
export default store;
