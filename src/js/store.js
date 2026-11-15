import { createStore } from "vuex";

// Nothing left here on purpose. Every action, mutation and piece of state
// this store ever held has moved to TanStack Query (queryKeys.js/
// mutations.js) or Pinia (src/js/stores/) across this plan's six tasks —
// climber identity, rankings, competitions, problems, and finally (this
// task) ticks, the last domain still committing/dispatching here. app.js
// still does `app.use(store)`, so this stays a real (if empty) Vuex store
// rather than being deleted outright; Task 6 of the Activity-group
// migration plan removes Vuex from the app entirely.
export default createStore({
  namespaced: true,
  state: {
  },
  mutations: {
  },
  actions: {
  },
  getters: {
  }
});
