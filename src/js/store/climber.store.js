import api from '../api'

export default {
    namespaced: true,
    state: () => ({
      climberprofile : null,
    }),
    getters : {
    },
    mutations: {
      climberprofile(state, payload) {
        state.climberprofile= payload
      },
    },
    actions: {
        async profile({commit }, payload) {
          const ret = await api.climber.profile(payload)
          commit('climberprofile',ret)
          return ret
        },
    }
}