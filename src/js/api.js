import axios from 'axios'
export const webendpoint =import.meta.env.VITE_API_HOST
export const endpoint = webendpoint+"/api/v03"
import climber from './api.climber'


const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month < 10 ? `0${month}` : month}-${
    day < 10 ? `0${day}` : day
  }`;
};

const api = {
  climber,
  async requestOtp(payload) {
    const ret = await axios.post(endpoint + '/auth/otp/request', payload)
    return ret.data
  },
  async verifyOtp(payload) {
    const ret = await axios.post(endpoint + '/auth/otp/verify', payload)
    return ret.data
  },
  async refreshToken() {
    const ret = await axios.post(endpoint + '/auth/otp/refresh')
    return ret.data
  },
  async newProblems(payload) {
    const ret = await axios.get(endpoint+"/gym/"+payload+"/problems/new")
    return ret.data
  },
  async getFeed(payload) {
    const ret =  await axios.get(endpoint+"/social/feed")
    return ret.data
  },
  async getPublicAscents(payload) {
    const ret = await (await fetch(endpoint+"/problem/"+payload+"/ascents/public")).json()
    return ret
  },
  async rankingtop10(payload) {
    let ret = null
    ret = await axios.get(endpoint + `/ranking/top10/?climber_id=${payload.climber_id}&ranking_id=${payload.ranking_id}&country=${payload.country}`)
    return ret.data

  },
  async ranking(payload) {
    // pagination defines the urls 
    let ret = null
    if (payload != null && payload.url != null) {
      ret = await axios.get(payload.url+"&country="+payload?.country)
    } else {
      ret = await axios.get(endpoint+"/ranking?country="+payload?.country)
    }
    return ret.data
  },
  async version() {
    const ret = await axios.get(endpoint+"/version")
    return ret.data
  },
  async requestSync(payload) {
    const ret = await axios.post(endpoint+"/climber/"+payload.climberid+"/request_sync",payload)
    return ret.data
  },
  async getCompResults(payload,prefix='') {
    const ret = await axios.get(endpoint+prefix+"/competitions/"+payload.compid+"/results/?json=true&key="+payload.point_entry_key)
    return ret.data
  },
  async getPointsPerRoute(payload,prefix='') {
    const ret = await axios.get(endpoint+prefix+"/competitions/"+payload.compid+"/points_per_route/?key="+payload.point_entry_key)
    return ret.data
  },
  async fetchCompAscents(payload) {
    const ret = await axios.get(endpoint+"/competitions/"+payload.compid+"/ascents/"+payload.contenderid)
    return ret.data
  },
  async removeCompAscent(payload) {
    const ret = await axios.delete(endpoint+"/competitions/ascents/"+payload.tickid)
    return ret.data
  },
  async getArchiveDay(payload) {
    const ret = await axios.get(endpoint+"/climber/archive/span/?span="+payload.span)
    return ret.data
  },
  async getTickDates(payload) {
    const ret = await axios.get(endpoint+"/climber/archive/dates",payload)
    return ret.data
  },
  async addCompAscent(payload) {
    const ret = await axios.post(endpoint+"/competitions/"+payload.comp_id+"/add_ascent",payload)
    return ret.data
  },
  async findContenderInComp(payload) {
    const ret = await axios.get(endpoint+"/competitions/findcontenderincomp?term="+payload.term+"&compid="+payload.compid)
    return ret.data
  },
  async getClimberByKey(payload,prefix='') {
    // The ?key is needed so that the compkey guard can get it.
    const ret = await axios.get(endpoint+prefix+"/climber/key/"+payload.compid+"/"+payload.key+"/?key="+payload.key)
    return ret.data
  },
  async getClimber(payload) {
    const ret = await axios.get(endpoint+"/climber/auth_user")
    return ret.data
  },
  async unRegisterToComp(payload) {
    const ret = await axios.post(endpoint+"/competitions/resign_comp",payload)
    return ret.data
  },
  async registerToComp(payload) {
    const ret = await axios.post(endpoint+"/competitions/join_comp",payload)
    return ret.data
  },
  async getCompetition(payload,prefix='') {
    const ret = await axios.get(endpoint+prefix+"/competitions/"+payload.compid+"/?key="+payload.point_entry_key)
    return ret.data
  },
  async getUpcomingCompetitions(payload) {
    const ret = await axios.get(endpoint+"/competitions/upcoming",payload)
    return ret.data
  },
  async saveSettings(payload) {
    const ret = await axios.post(endpoint+"/settings/user",payload)
    return ret.data
  },
  async setToken(payload) {
    const ret = await axios.post(endpoint+"/tick/",payload)
    return ret.data
  },
  async likeProblem(id) {
    const ret = await axios.post(endpoint+`/problem/${id}/like`)
    return ret.data
  },
  async dislikeProblem(id) {
    const ret = await axios.post(endpoint+`/problem/${id}/dislike`)
    return ret.data
  },
  async commentProblem(payload) {
    const ret = await axios.post(endpoint+`/problem/${payload.id}/comment`,{comment:payload.comment})
    return ret.data
  },
  async getProblemDetails(id) {
    const ret = await axios.get(endpoint+"/problem/"+id)
    return ret.data
  },
  async searchProblems(payload) {
    const ret = await axios
      .post(endpoint + '/problem/search', {
        text: payload.text,
        gymid: payload.gymid,
      })
    return ret.data

  },
  async getGyms() {
   const ret = await   axios
      .get(endpoint + '/gym')
    return ret.data
  },
  async loadAllTimeTicks() {
   const ret = await   axios .get(endpoint + '/my/ticks')
   return ret.data
  },
  async getProfile(gymid) {
    const url = endpoint + `/profile?gymid=${gymid}`
    const ret = await axios.get(url)
    return ret.data
  },
  async login( payload) {
    const url = endpoint + "/api/auth/login"
    const ret = await fetchPost(url, payload)
    return ret.data
  },
  async deleteTickByProblem(payload,prefix='') {
    let url = endpoint + prefix + "/tick/byproblem/"+payload.problemid
    if (payload.point_entry_key) {
      url += "?key=" + payload.point_entry_key
    }
    const ret = await   axios.delete(url, payload)
    return ret.data

  },
  async deleteTick(payload) {
    const url = endpoint + "/tick/"+payload
    const ret = await axios.delete(url, payload)
    return ret.data
  },
  async getBadges() {
    const ret = await axios.get(endpoint + "/my/badges")
    return ret.data
  },
  async saveTick(payload,prefix='') {
    let url = endpoint + prefix + "/tick/"
    if (payload.point_entry_key) {
      url += "?key=" + payload.point_entry_key
    }
    const ret = await  axios.post(url, payload)
    return ret.data
  },
};

window.api = api;

export default api;
