import { accountService } from '@js/auth/accountservice';
import axios from 'axios'
import { errorNotify  } from './helpers/notifications';
import { useAuth0 } from '@auth0/auth0-vue';

import {f7 } from 'framework7-vue'
const API_KEY = import.meta.env.VITE_API_KEY;
const API_HOST = import.meta.env.VITE_API_HOST;
const endpoint = API_HOST + "/api/v03"

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month < 10 ? `0${month}` : month}-${
    day < 10 ? `0${day}` : day
  }`;
};

const fetchPost = (url, payload) => {
  return axios.post(url, payload)
  /*
  return fetch(url, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload) 
  });
  */
}
const fetchGet = (url, payload) => {
  return axios.get(url, payload)
  /*
  return fetch(url, {
    method : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload) 
  });
  */
}

const errorHandler = async (err) => {
  try {
    const json = err.response.data
    errorNotify('Error from server',json.message)
    if (json.message != null && json.message.match(/unauthenticated/i)) {
      return null
    }
  } catch (e) {

  }
  return null

    
}
const resultHandler = async (res) => {
  const json = res?.data
  if (json.message != null && json.message.match(/unauthenticated/i)) {
    console.log("Invalidated login in resultHandler")
    return null
  }
  return json
}
const api = {
  registerToComp(payload) {
    return axios.post(endpoint+"/competitions/join_comp",payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  getCompetition(payload) {
    return axios.get(endpoint+"/competitions/"+payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  getUpcomingCompetitions(payload) {
    return axios.get(endpoint+"/competitions/upcoming",payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  saveSettings(payload) {
    return axios.post(endpoint+"/settings/user",payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  setToken(payload) {
    return axios.post(endpoint+"/tick/",payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  likeProblem(id) {
    return axios.post(endpoint+`/problem/${id}/like`)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  dislikeProblem(id) {
    return axios.post(endpoint+`/problem/${id}/dislike`)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  getProblemDetails(id) {
    return axios.get(endpoint+"/problem/"+id)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  searchProblems(payload) {
    return axios
      .post(endpoint + '/problem/search', {
        text: payload.text,
        gymid: payload.gymid,
      })
    .then((res) => resultHandler(res))
    .catch((err) => errorHandler(err))
  },
  getGyms() {
    return axios
      .get(endpoint + '/gym')
    .then((res) => resultHandler(res))
    .catch((err) => errorHandler(err))
  },
  getProfile(gymid,email) {
    // Email is sent because this is the first call (usually?) and
    // when we get the auth0 in the backend, we can couple the 
    // user (email) and the auth0 user id for future use
    const url = endpoint + `/profile?gymid=${gymid}&email=${email}`
    return axios.get(url)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  login( payload) {
    const url = endpoint + "/api/auth/login"
    return fetchPost(url, payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))

  },
  deleteTickByProblem(payload) {
    const url = endpoint + "/tick/byproblem/"+payload
    return axios.delete(url, payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))

  },
  deleteTick(payload) {
    const url = endpoint + "/tick/"+payload
    return axios.delete(url, payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  saveTick(payload) {
    const url = endpoint + "/tick/"
    return axios.post(url, payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  search(query) {
    return fetch(
      `${endpoint}/games?key=${API_KEY}&search=${query}&page_size=40&page=1`,
    ).then((res) => res.json());
  },
  searchNext(url) {
    return fetch(url).then((res) => res.json());
  },
};

window.api = api;

export default api;
