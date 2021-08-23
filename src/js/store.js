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
    problem({state},payload) {
      debugger
      return state.gym.problems.find(item => item.id == payload)
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
        return err
      })
    },
    saveTick({ state },payload) {
      return axios.post(api+"tick/",payload)
      .then(r=>r.data)
      .then(json => {
        state.problems[json.tick.problemid].myTicks = [...state.problems[json.tick.problemid].myTicks, json.tick]
        // update ascent counts. Why manually? If we update the count from the server,
        // someone (or many ppl) and then the ascentcount might jump by a multitude... not nice.
        debugger
        state.problems[json.tick.problemid]= {...state.problems[json.tick.problemid], ['ascentCount'] : state.problems[json.tick.problemid].ascentCount+1}
        // This beauty updates the ascentcount for gym's problemlist
        state.gym.problems =  state.gym.problems.map((item, index) => {

          if (item.id !== json.tick.problemid) {
            return item
          }
          return {
            ...item,
            ['ascentCount'] : item.ascentCount+1
          }
        })
        return json
      })
      .catch(err => {
        return err
      })
    },
  }
})
export default store;
