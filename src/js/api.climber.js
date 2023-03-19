import axios from 'axios'
export const webendpoint =import.meta.env.VITE_API_HOST
export const endpoint = webendpoint+"/api/v03"


export default {
  async profile(payload) {
    const ret = await axios.get(endpoint+"/climber/"+payload+"/profile")
    return ret.data
  },
  async followUnFollow(payload) {
    const ret = await axios.get(endpoint+"/climber/"+payload+"/follow")
    return ret.data
  },
}

