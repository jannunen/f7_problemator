import api from '../api'

export default {
    namespaced: true,
    state: () => ({
      profile : null,
    }),
    getters : {
    },
    mutations: {
      climberprofile(state, payload) {
        state.profile= {...state.profile, ...payload}
      },
    },
    actions: {
        async profile({commit }, payload) {
          const ret = await api.climber.profile(payload)
          commit('climberprofile',ret)
          return ret
        },
        async followUnFollow({commit }, payload) {
          const ret = await api.climber.followUnFollow(payload)
          commit('climberprofile',ret)
          return ret
        },
    }
}