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
  },
  getters: {
    profile({ state }) {
      return state.profile;
    },
    gym({state}) {
      return state.gym
    },
    problems({state}) {
      return state.gym.problems
    },
    /** Groups problems by walls. */
    problemsByWall({state}) {
      if (state.gym.problems == null) {
        return null 
      }
      const grouped = state.gym.problems.reduce( (acc, item) => {
        if (item.wall != null) {

          if (acc[item.wall.wallchar] == null) {
            acc[item.wall.wallchar] ={ id : item.wall.id, wall: item.wall, problems : []} 
          }
          acc[item.wall.wallchar].problems.push(item)
        }
        return acc
      },{})
      return grouped
    },
    getBoulders({state}) {
      return state.gym.problems.filter(item => item.routetype == 'boulder' )
    },
    getRoutes({state}) {
      return state.gym.problems.filter(item => item.routetype == 'route' )
    },

  },
  actions: {
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
      })
      .catch(err => {
      })
    },
  },
})
export default store;
