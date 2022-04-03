import { accountService } from '@js/auth/accountservice';
import axios from 'axios'
import { errorNotify  } from './helpers/notifications';

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
  const json = err.response.data
  errorNotify('Error from server',json.message)
  if (json.message != null && json.message.match(/unauthenticated/i)) {
    // Logout locally
    accountService.logout()
    // Navigate to login
    console.log("Invalidated login")
    f7.views.main.router.navigate("/login/")
    return null
  }

    
}
const resultHandler = async (res) => {
  const json = res?.data
  if (json.message != null && json.message.match(/unauthenticated/i)) {
    // Logout locally
    accountService.logout()
    // Navigate to login
    console.log("Invalidated login")
    f7.views.main.router.navigate("/")
    return null
  }
  return json
}
const api = {
  getGyms() {
    return axios.get(endpoint+"/gym")
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  deleteTick(payload) {
    return axios.delete(endpoint+"/tick/"+payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  saveTick(payload) {
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
  getProfile(gymid) {
    const url = endpoint + `/profile?gymid=${gymid}`
    return fetchGet(url)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))
  },
  login( payload) {
    const url = API_HOST + "/api/auth/login"
    return fetchPost(url, payload)
    .then((res) => resultHandler(res))
    .catch(err => errorHandler(err))

  },
  getTopGames() {
    return fetch(
      `${endpoint}/games?key=${API_KEY}&page_size=40&ordering=-metacritic`,
    ).then((res) => res.json());
  },
  getUpcomingGames() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yearLater = new Date();
    yearLater.setMonth(yearLater.getMonth() + 6);

    return fetch(
      `${endpoint}/games?key=${API_KEY}&dates=${formatDate(
        tomorrow,
      )},${formatDate(yearLater)}&page_size=12&ordering=-added`,
    ).then((res) => res.json());
  },
  getRecentGames() {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return fetch(
      `${endpoint}/games?key=${API_KEY}&dates=${formatDate(
        monthAgo,
      )},${formatDate(today)}&page_size=12`,
    ).then((res) => res.json());
  },
  getGame(id) {
    return Promise.all([
      // fetch screenshots
      fetch(`${endpoint}/games/${id}/screenshots?key=${API_KEY}`).then((res) =>
        res.json(),
      ),
      // fetch game
      fetch(`${endpoint}/games/${id}?key=${API_KEY}`).then((res) => res.json()),
    ]).then(([screenshots, game]) => {
      return {
        ...game,
        screenshots: screenshots.results,
      };
    });
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
