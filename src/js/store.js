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
    user : null,
  },
  getters: {
    profile({ state }) {
      return state.profile;
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
      })
    },
  },
})
export default store;
