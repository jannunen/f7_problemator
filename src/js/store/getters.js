export default {
    getBoulders: (state) => {
      if (state.gym.problems == null) {
        return []
      }
      return state.gym.problems.filter(item => item.routetype == 'boulder' )
    },
    getRoutes : (state) => {
      if (state.gym.problems == null) {
        return []
      }
      return state.gym.problems.filter(item => item.routetype == 'route' )
    },
    /*
    getProblem : (state) => (id) => {
      return state.gym.problems.find(item => item.id == id)
    },
    */
    /*
    getTodoById: (state) => (id) => {
      return state.todos.find(todo => todo.id === id)
    }
    */

}