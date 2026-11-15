import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@js/api'

export const filtersInitial = {
  gradeMin: 'min',
  gradeMax: 'max',
  sort: 'sector_asc',
  problemFilters: 'all',
  routetypes: ['boulder', 'sport'],
  nameFilter: null,
  styles: [],
  walls: [],
  problemStates: ['all'], // all, ticked, projects
}

/**
 * Misc UI/session state: dark mode, the problem-list filters, the left side
 * panel, the welcome-home tip, init/ready flags and app/server version.
 *
 * Ported from the Vuex store 1:1 — no behavior change. In particular
 * `tipShowStatus` is write-only persistence: it is written to localStorage on
 * every `setTipShowStatus` call (as it always was), but nothing here reads it
 * back from localStorage on init. app.vue does that read itself, the same way
 * it always has, then hands the value to `setTipShowStatus`.
 */
export const useUiStore = defineStore('ui', () => {
  const darkMode = ref(true)
  const sidePanelOpen = ref(false)
  const selectedLeftPanelItem = ref('home')
  const tipShowStatus = ref({})
  const initializing = ref(true)
  const ready = ref(false)
  const routetypes = ref(['boulder', 'sport'])
  const filters = ref({ ...filtersInitial })
  const version = ref('')
  const serverVersion = ref('')

  function setDarkMode(payload) {
    darkMode.value = payload
  }
  function setSidePanel(payload) {
    sidePanelOpen.value = payload
  }
  function setSelectedLeftPanelItem(payload) {
    selectedLeftPanelItem.value = payload
  }
  function setTipShowStatus(payload) {
    // When status changes, save to localStorage and update state.
    localStorage.setItem('tipShowStatus', JSON.stringify(payload))
    tipShowStatus.value = payload
  }
  function setInitializing(payload) {
    initializing.value = payload
  }
  function setReady(payload) {
    ready.value = payload
  }
  function setFilterRoutetype(payload) {
    filters.value = { ...filters.value, routetypes: payload }
  }
  function setFilterProblems(payload) {
    filters.value = { ...filters.value, problemFilters: payload }
  }
  function setFilterStyles(payload) {
    filters.value = { ...filters.value, styles: payload }
  }
  function setFilterGradeMin(payload) {
    filters.value = { ...filters.value, gradeMin: payload }
  }
  function setFilterGradeMax(payload) {
    filters.value = { ...filters.value, gradeMax: payload }
  }
  function setNameFilter(payload) {
    filters.value = { ...filters.value, nameFilter: payload }
  }
  function setFilterWalls(payload) {
    filters.value = { ...filters.value, walls: payload }
  }
  function setFilterSort(payload) {
    console.log("Changing sorting to", payload)
    filters.value = { ...filters.value, sort: payload }
  }
  function resetFilters() {
    filters.value = { ...filtersInitial }
  }
  function setVersion(payload) {
    version.value = payload
  }
  function setServerVersion(payload) {
    serverVersion.value = payload
  }
  async function fetchVersion() {
    const ret = await api.version()
    setServerVersion(ret.version)
    return ret
  }

  return {
    darkMode,
    sidePanelOpen,
    selectedLeftPanelItem,
    tipShowStatus,
    initializing,
    ready,
    routetypes,
    filters,
    version,
    serverVersion,
    setDarkMode,
    setSidePanel,
    setSelectedLeftPanelItem,
    setTipShowStatus,
    setInitializing,
    setReady,
    setFilterRoutetype,
    setFilterProblems,
    setFilterStyles,
    setFilterGradeMin,
    setFilterGradeMax,
    setNameFilter,
    setFilterWalls,
    setFilterSort,
    resetFilters,
    setVersion,
    setServerVersion,
    fetchVersion,
  }
})
