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
    filters : {
      gradeMin : null,
      gradeMax : null,
      styles : [],
      sort : null,
    }
  },
  getters: {
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
    setGradeMin({ state },payload) {
      state.filters= {...state.filters, ['gradeMin'] : payload}
    },
    setGradeMax({ state },payload) {
      state.filters= {...state.filters, ['gradeMax'] : payload}
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
      axios.get(api+"profile/?gymid="+gymid)
      .then(r=>r.data)
      .then(json => {
        state.profile = json.profile
        state.gym = json.gym
        state.grades = json.grades
        state.walls = json.walls
      })
      .catch(err => {
      })
    },
  },
})
export default store;
