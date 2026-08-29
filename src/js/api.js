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
  // Trades a Supabase token for ours. Everything after this call is ordinary
  // authenticated API traffic — Supabase is not involved again.
  // Training: coaching invitations, the programme a coach set, and recording
  // what was actually done.
  async coachInvitations() {
    const ret = await axios.get(endpoint + '/training/invitations')
    return ret.data
  },
  async respondToCoachInvitation({ id, accept, reason }) {
    const ret = await axios.post(endpoint + `/training/invitations/${id}`, { accept, reason })
    return ret.data
  },
  async myTrainingAssignments() {
    const ret = await axios.get(endpoint + '/training/assignments')
    return ret.data
  },
  async markTrainingFeedbackRead({ id, read = true }) {
    const ret = await axios.post(endpoint + `/training/sessions/${id}/feedback-read`, { read })
    return ret.data
  },
  async trainingAssignment(id) {
    const ret = await axios.get(endpoint + `/training/assignments/${id}`)
    return ret.data
  },
  async completeTrainingSession({ id, completed = true, trainingsessionId = null, gymid = null, feeling = null, notes = null }) {
    const ret = await axios.post(endpoint + `/training/sessions/${id}/complete`, {
      completed,
      trainingsession_id: trainingsessionId,
      // The gym and how it felt go into the climber's own training log, which
      // is where a completed session actually lives.
      gymid,
      feeling,
      notes
    })
    return ret.data
  },
  async recordTrainingResult({ itemId, ...values }) {
    const ret = await axios.post(endpoint + `/training/items/${itemId}/result`, values)
    return ret.data
  },
  async messageThreads() {
    const ret = await axios.get(endpoint + '/training/messages')
    return ret.data
  },
  async messageThread(id) {
    const ret = await axios.get(endpoint + `/training/messages/${id}`)
    return ret.data
  },
  async sendMessage(id, body) {
    const ret = await axios.post(endpoint + `/training/messages/${id}`, { body })
    return ret.data
  },
  // Who this climber is actually coached by. Needed before they can start a
  // conversation: a climber has no other way to learn their coach's id.
  async myCoaches() {
    const ret = await axios.get(endpoint + '/training/coaches')
    return ret.data
  },
  // Open-or-get. The server decides whether the relationship allows it, and
  // hands back the existing thread when there already is one.
  async openDirectThread(coachClimberId) {
    const ret = await axios.post(endpoint + '/training/messages/direct', { climber_id: coachClimberId })
    return ret.data
  },
  async markThreadRead(id) {
    const ret = await axios.post(endpoint + `/training/messages/${id}/read`)
    return ret.data
  },
  async socialExchange(accessToken) {
    const ret = await axios.post(endpoint + '/auth/social/exchange', {
      access_token: accessToken
    })
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
    const ret = await axios.get(endpoint+"/climber/archive/span/"+payload.type+"?span="+payload.span)
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
  // Spray walls: walls a climber sets their own problems on by picking holds
  // off a photo. is_spray_wall lives on the wall, so the gym has to be asked
  // which of its walls are spray walls before anything else here is reachable.
  async getSprayWalls(gymid) {
    const ret = await axios.get(endpoint + '/gyms/' + gymid + '/spray-walls')
    return ret.data
  },
  async getSprayWallProblems(wallId, params = {}) {
    const ret = await axios.get(endpoint + '/walls/' + wallId + '/spray-wall/problems', { params })
    return ret.data
  },
  // The photo plus the holds that may be picked. Always one image's worth:
  // the server refuses a problem whose holds span two photos.
  async getSprayWallImage(wallId) {
    const ret = await axios.get(endpoint + '/walls/' + wallId + '/spray-wall/image')
    return ret.data
  },
  async getSprayWallProblem(problemId) {
    const ret = await axios.get(endpoint + '/spray-wall/problems/' + problemId)
    return ret.data
  },
  async createSprayWallProblem(payload) {
    const ret = await axios.post(endpoint + '/spray-wall/problems', payload)
    return ret.data
  },
  async getProfile(gymid) {
    const url = endpoint + `/profile?gymid=${gymid}`
    const ret = await axios.get(url)
    return ret.data
  },
  async login( payload) {
    const url = endpoint + "/api/auth/login"
    const ret = await axios.post(url, payload)
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
  async reportProblem({ id, type, note }) {
    const ret = await axios.post(endpoint + `/problem/${id}/report`, { type, note })
    return ret.data
  },
  async getBadges(gymid) {
    // gymid is required, not optional: the endpoint has no other way to know
    // which gym's badges to answer with, and silently returns an empty set
    // without it.
    const ret = await axios.get(endpoint + "/my/badges", { params: { gymid } })
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

// A debugging convenience, not part of the module's contract. Guarded so
// importing this file outside a browser — a test runner, for one — does not
// throw on the way past.
if (typeof window !== 'undefined') {
  window.api = api;
}

export default api;
