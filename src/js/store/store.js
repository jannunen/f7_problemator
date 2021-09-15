import { createStore } from 'vuex'
import actions from './actions'
import mutations from './mutations'
import getters from './getters'
export const filtersInitial = {
        gradeMin: 'min',
        gradeMax: 'max',
        sort: 'sector_asc',
        problemFilters : 'all',
        styles: [],
        walls: [],
        problemStates: ['all'], // all, ticked, projects
      }
export default createStore({
  state :  {
      homeLoaded : false,
      profile: {},
      ui : {
        sidePanelOpen : false,
      },
      gym: {
        problems: [],
      },
      gyms : [],
      user: {},
      grades: [],
      walls: [],
      problems: {},
      styles: [],
      filters: filtersInitial,
  },
  mutations,
  actions,
  getters,
})
