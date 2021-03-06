import axios from 'axios'
import { f7 } from 'framework7-vue'
//const apihost = import.meta.env.VITE_API_HOST
export const apihost = "https://api.problemator.fi"
export const api = apihost + '/api/v03/'
// This is needed by the backend to recognize ajax request
axios.defaults.headers['Accept'] = 'application/json'
//import { router} from '@js/auth/helpers'

export default {
    refreshJWT({ commit, state },payload) {
      return axios.post(apihost+"/api/auth/refresh")
      .then(r=>r.data)
      .then(json => {
        commit('setUser',json.user)
        return {user : state.user, jwt : json.access_token}
      })
    },
    login({ commit, state },payload) {
      return axios.post(apihost+"/api/auth/login",payload)
      .then(r=>r.data)
      .then(json => {
        commit('setUser',json.user)
        return {user : state.user, access_token : json.access_token}
      })
    },
    getProfile({  commit, state }) {
      return axios.get(api+"profile/?gymid="+localStorage.gymid)
      .then(r=>r.data)
      .then(json => {
        commit('setProfile',json.profile)
        commit('setGym',json.gym)
        commit('setGrades',json.grades)
        commit('setWalls',json.walls)
        commit('setStyles',json.styles)
        commit('setHomeLoaded',json.styles)
      })
      .catch(err => {
          f7.views.main.router.navigate("/login")
      })
    },
    fetchGyms({ commit, state },payload) {
      if (payload == undefined) {
        payload = ""
      }
      return axios.get(api+"gym/"+payload)
      .then(r=>r.data)
      .then(json => {
        commit('setGyms',json.gyms)
      })
      .catch(err => {
        return err
      })
    },
    getProblem({ commit, state },payload) {
      return axios.get(api+"problem/"+payload)
      .then(r=>r.data)
      .then(json => {
        commit('setProblem',json.problem)
        return json.problem
      })
      .catch(err => {
        return err
      })
    },
    saveTick({ commit, state },payload) {
      return axios.post(api+"tick/",payload)
      .then(r=>r.data)
      .then(json => {
        commit('updateProblem',json.problem)
        // update ascent counts. Why manually? If we update the count from the server,
        // someone (or many ppl) and then the ascentcount might jump by a multitude... not nice.
        //commit('updateAscentCounts',json.tick.problemid)
        return json
      })
      .catch(err => {
        return err
      })
    },
    deleteTick({ commit, state },payload) {
      return axios.delete(api+"tick/"+payload)
      .then(r=>r.data)
      .then(json => {
        commit('updateProblem',json.problem)
        return json
      })
      .catch(err => {
        return err
      })
    },

}