import { filtersInitial } from './store.js'

export default  {
    resetFilters(state, payload) {
        state.filters = {...filtersInitial}
    },
    
    setUser(state, payload) {
        state.user = payload
    },
    setProfile(state, payload) {
        state.profile = payload
    },
    setGym(state, payload) {
        state.gym = payload
    },
    setGrades(state, payload) {
        state.grades = payload
    },
    setWalls(state, payload) {
        state.walls = payload
    },
    setStyles(state, payload) {
        state.styles = payload
    },
    setFilterSort(state, payload) {
        state.filters = { ...state.filters, ['sort']: payload }
    },
    setHomeLoaded(state, payload) {
        state.homeLoaded = payload
    },
    setSidePanelOpen(state,payload) {
        debugger
        state.ui.sidePanelOpen = payload
    },
    setFilterProblems(state, payload) {
        console.log("filtering problems by",payload)
        state.filters = { ...state.filters, ['problemFilters']: payload }
    },
    setFilterStyles(state, payload) {
        state.jlters = { ...state.filters, ['styles']: payload }
    },
    setFilterGradeMin(state, payload) {
        state.filters = { ...state.filters, ['gradeMin']: payload }
    },
    setFilterGradeMax(state, payload) {
        state.filters = { ...state.filters, ['gradeMax']: payload }
    },
    setFilterWalls(state, payload) {
        state.filters = { ...state.filters, ['walls']: payload }
    },
    setProblem(state, problem) {
        state.problems[problem.id] = problem
    },
    updateProblem(state, problem) {
        state.problems = {...state.problems,[problem.id] : problem}
    },
    updateProblemTicks(state, tick) {
        state.problems[tick.problemid].myTicks = [...state.problems[tick.problemid].myTicks, tick]
    },
    updateAscentCounts(state, pid) {
        state.problems[pid].ascentCount = state.problems[pid].ascentCount + 1
        state.gym.problems = state.gym.problems.map((item) => {
            if (item.id !== pid) {
                return item
            }
            return {
                ...item,
                ['ascentCount']: item.ascentCount + 1
            }
        })

    }
}
