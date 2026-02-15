<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left>
        <f7-link href="/home">&lt; back</f7-link>
      </f7-nav-left>
      <f7-nav-title> {{ t('problemlist.problemlist') }} </f7-nav-title>
    </f7-navbar>

    <div class="px-4 py-2">
      <h1 class="font-bold text-xl text-center mb-3" style="color: var(--p-text);">{{ gym.name }}</h1>

      <div v-if="unfilteredProblemsExist">
        <!-- Wall filter -->
        <div class="mb-3">
          <div class="p-section-title">{{ t('problemlist.wallfilter') }}</div>
          <wall-selector v-model="selectedWalls" @clear="onClearWalls" />
        </div>

        <!-- Show/hide more filters -->
        <button class="p-btn p-btn--block mb-3 p-collapsible__trigger" @click="showFilters=!showFilters">
          <span>{{ showFilters ? "Hide filters" : "Show more filters"}}</span>
          <span class="material-icons p-collapsible__chevron" :class="{ 'p-collapsible__chevron--open': showFilters }">expand_more</span>
        </button>

        <!-- Collapsible filter card -->
        <div v-if="showFilters" class="p-card mb-3">
          <!-- Route type toggles -->
          <div class="mb-4">
            <div class="p-section-title">{{ t('problemlist.routetype') }}</div>
            <div class="flex flex-col gap-0">
              <div v-for="rt in routeTypes" :key="rt" class="p-list__item">
                <span style="color: var(--p-text-secondary);">{{ rt }}</span>
                <label class="p-toggle">
                  <input type="checkbox" :checked="filters.routetypes.includes(rt)" @change="selectRoutetype(rt)" />
                  <span class="p-toggle__track"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Grade filter -->
          <div class="mb-4">
            <div class="p-section-title">{{ t('problemlist.gradefilter') }}</div>
            <grade-filter :min="filters.gradeMin" :max="filters.gradeMax" :grades="grades" @min="minChanged" @max="maxChanged"></grade-filter>
          </div>

          <!-- Style filter -->
          <div class="mb-4">
            <div class="p-section-title">{{ t('problemlist.stylefilter') }}</div>
            <style-filter @styles-changed="onStylesChanged" :styles="styles" :selected-styles="filters.styles"></style-filter>
          </div>

          <!-- Ascent status filter -->
          <div class="mb-4">
            <div class="p-section-title">{{ t('problemlist.ascent_status_filter') }}</div>
            <ascent-status-filter v-model="ascentTypeFilter" />
          </div>

          <!-- Problem name filter -->
          <div>
            <div class="p-section-title">{{ t('problemlist.problemnamefilter') }}</div>
            <input
              type="text"
              class="p-input"
              :placeholder="t('Filter by problem name')"
              v-model="nameFilter"
            />
          </div>
        </div>

        <button @click="resetFilters" class="p-btn p-btn--danger p-btn--block mb-3">
          {{ t('problemlist.reset_filters') }}
        </button>

        <!-- Floormaps -->
        <div v-if="gym != null && gym.floormaps != null && gym.floormaps.length > 0" class="mb-3">
          <div v-for="floormap in gym.floormaps" :key="floormap.id" class="my-1">
            <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
          </div>
        </div>

        <!-- Sort by -->
        <div class="mb-3">
          <div class="p-section-title">{{ t('problemlist.sortby') }}</div>
          <sort-by @sort-change="onSortChanged" :sort="filters.sort"></sort-by>
        </div>

        <div v-if="filteredProblems.length > 0">
          <div class="text-center text-sm font-semibold mb-2" style="color: var(--p-text-muted);">
            {{ filteredProblems?.length }} {{ t('problemlist.visible_out_of') }}
            {{ Object.keys(problems).length }} {{ t('problemlist.problems') }}
          </div>

          <!-- Quick tick tip -->
          <div v-if="!tipShown(tipShowStatus, 'quicktick')" class="p-banner p-banner--info mb-3">
            <span class="material-icons p-banner__icon" style="color: var(--p-accent);">swipe</span>
            <div class="p-banner__content">
              <span class="font-semibold">Tip!</span> You can tick faster by swiping a problem LEFT. Add a quick try by swiping RIGHT.
              <a href="#" class="p-link text-xs block mt-1" @click.prevent="tipDismiss('quicktick')">do not show again</a>
            </div>
          </div>

          <!-- Active wall filter indicator -->
          <div v-if="filters.walls.length > 0" class="p-banner p-banner--info mb-3">
            <span class="material-icons p-banner__icon">filter_list</span>
            <div class="p-banner__content">
              <div class="text-xs font-semibold mb-1">{{ t('problemlist.wall_filter_active') }}:</div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="selWall in getSelectedWalls"
                  :key="selWall.id"
                  class="p-chip p-chip--active"
                  style="font-size: 0.75rem; padding: 0.25rem 0.625rem;"
                >
                  {{ selWall.name }}
                  <span class="ml-1 cursor-pointer" style="opacity: 0.7;" @click="removeWall(selWall.id)">&times;</span>
                </span>
              </div>
            </div>
          </div>

          <f7-list media class="my-0" problem-list>
            <div v-for="(problem, idx) in filteredProblems" :key="problem.id">
              <li v-if="filters.sort.match(/sector/) && wallNamesDiffer(idx)" class="list-group-title">
                <h3>{{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }}</h3>
              </li>
              <li v-if="filters.sort.match(/routesetter/) && routesettersDiffer(idx)" class="list-group-title">
                <h3>
                  {{ problem.author.etunimi }} {{ left(problem.author.sukunimi, 1) }}.
                  <small>({{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }})</small>
                </h3>
              </li>
              <li v-if="filters.sort.match(/(hardest|easiest)/) && gradesDiffer(idx)" class="list-group-title">
                <h3>
                  {{ problem.grade.name }}
                  <small>({{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }})</small>
                </h3>
              </li>
              <search-hit-item @start-navigate="onStartNavigate" :key="problem.id" :problem="problem"></search-hit-item>
            </div>
          </f7-list>
        </div>

        <!-- No results -->
        <div v-else class="p-card mb-14 text-center">
          <span class="material-icons mb-2" style="font-size: 40px; color: var(--p-warning);">sentiment_dissatisfied</span>
          <h2 class="font-bold text-lg mb-1" style="color: var(--p-warning);">
            {{ t('problemlist.snap' + getRandom(1, maxSnap)) }}
          </h2>
          <h3 class="font-bold text-base mb-1" style="color: var(--p-text);">{{ t('problemlist.no_hits_title') }}</h3>
          <p class="text-sm" style="color: var(--p-text-muted);">
            {{ t('problemlist.no_hits_desc') }}
          </p>
        </div>
      </div>
      <div v-else>
        <div class="p-banner p-banner--warning">
          <span class="material-icons p-banner__icon">help_outline</span>
          <div class="p-banner__content">
            <h2 class="font-bold text-lg">Are you sure a gym is selected?</h2>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>
<script setup>
// TODO: Add list index
// TODO: Add filter routes, problems
import { watch, ref, computed, onMounted, toRefs } from 'vue'
import FloorMap from '@components/ui/FloorMap.vue'
import SearchHitItem from '@components/ui/problem/SearchHitItem.vue'
import { tipShown, left, getRandom } from '@js/helpers'
import { maxSnap } from '@js/constants.js'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import GradeFilter from '@components/ui/problemlist/GradeFilter.vue'
import StyleFilter from '@components/ui/problemlist/StyleFilter.vue'
import WallSelector from '@components/ui/problemlist/WallSelector.vue'
import PButton from '@components/PButton.vue'
import AscentStatusFilter from '@components/ui/problemlist/AscentStatusFilter.vue'
import SortBy from '@components/ui/problemlist/SortBy.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { debounce } from '@js/helpers'
import {
  sortFunction,
  problemStyleFilter,
} from '@components/ui/problemlist/sortFunctions.js'
const store = useStore()
dayjs.extend(relativeTime)
const gym = computed(() => store.state.gym)
const routeTypes = computed(() => store.state.routetypes)
const onAreaSelected = (area) => {
  // Filter by wall
  const wallChar = area.title
  const wall = walls.value.find(x => x.wallchar === wallChar)
  if (wall !== null) {
    selectedWalls.value = [wall.id]
  }
  // Update the selected walls
  const newSelection = [...props.modelValue, wall.id]
  emit('select', newSelection)
  emit('update:modelValue', newSelection)
}

const tipDismiss = (which) => {
  const payload = { ...tipShowStatus.value, [which]: true }
  store.dispatch('tipShowStatus', payload)
}
const showFilters = ref(false)
const wallsDropdown = computed(() => {
  return walls.value.map(a => ({ id: a.id, label: a.wallchar + " " + a.walldesc }))
})

const props = defineProps({
  areaSelected: {
    type: Object,
    default: null
  },
  wall: {
    type: String,
    default: null,
  },
  f7router: {
    type: Object,
  },
})
const selectWall = (evt) => {
  const selectedOption = parseInt(evt.target.value)
  const newSelection = [...props.modelValue, selectedOption]
  emit('select', newSelection)
  emit('update:modelValue', newSelection)
}

onMounted(() => {
  // The areaSelected is an object, which has the wall name as title.
  // So resolve the wall ids based on the wall name.
  if (props.areaSelected !== null) {
    const wallChar = props.areaSelected.title
    const wall = walls.value.find(x => x.wallchar === wallChar)
    if (wall !== null) {
      selectedWalls.value = [wall.id]
      store.dispatch('setSelectedWalls', [wall.id])
    }
  }
})
const { t, d, locale } = useI18n()
const problems = computed(() => store.state.problems)
watch(problems, (newValue) => {
  if (problems.value.length == 0) {
    store.dispatch('getProblems')
  }
})
const walls = computed(() => store.state.gym.walls)
const grades = computed(() => store.state.grades)
const tipShowStatus = computed(() => store.state.tipShowStatus)
const loading = computed(() => store.state.loading)

const ticks = computed(() => store.state.alltime.ticks)
const tries = computed(() => store.state.alltime.tries)
const selectedWalls = ref([])
const filters = computed(() => store.state.filters)
const nameFilter = ref('')
const styles = computed(() => store.state.styles)
const storeNameFilter = computed(() => store.state.filters.nameFilter)
const ascentTypeFilter = ref('all')
const unfilteredProblemsExist = computed(() => {
  if (problems.value == null) {
    return 0
  }
  return Object.keys(problems.value).length > 0
})
const onStartNavigate = (problem) => {
  props.f7router.navigate('/problem/' + problem.id, {
    props: { problem },
  })
}
const selectRoutetype = (rt) => {
  let payload = JSON.parse(JSON.stringify(filters.value.routetypes))
  if (payload.includes(rt)) {
    payload = payload.filter(x => x != rt)
  } else {
    payload = [...payload, rt]
  }
  store.commit('setFilterRoutetype', payload)

}
const onClearWalls = () => {
  selectedWalls.value = []
  store.dispatch('setFilterWalls', [])
}
/*
const onWallSelect = (selection) => {
  selectedWalls.value = selection
}
const getGroupTitle = (group) => {
  return group.wallchar + ' ' + group.walldesc
}
const sortedWalls = computed(() => {
  if (walls.value == null) {
    return []
  }
  return walls.value.sort((a, b) => a.wallchar.localeCompare(b.wallchar))
})
*/

const minChanged = debounce((value) => {
  store.commit('setFilterGradeMin', value)
}, 100)
const maxChanged = debounce((value) => {
  store.commit('setFilterGradeMax', value)
}, 100)
const onStylesChanged = (changedStyles) => {
  // set active filters.
  store.commit('setFilterStyles', changedStyles)
}
const filteredProblems = computed(() => {
  let probs = Object.keys(problems.value).map(key => problems.value[key])
  if (probs == null) {
    return []
  }
  const filters = computed(() => store.state.filters)

  let { problemFilters, styles, gradeMin, gradeMax, walls, sort } = toRefs(filters.value)
  if (gradeMax.value != 'max') {
    const maxScore = gradeMax.value.score == 0 ? 99999999 : gradeMax.value.score
    probs = probs.filter((item) => parseInt(item.grade.score) <= maxScore)
  }
  if (gradeMin.value != 'min') {
    const minScore = gradeMin.value.score
    probs = probs.filter((item) => parseInt(item.grade.score) >= minScore)
  }
  if (styles.value != null && styles.value.length > 0) {
    probs = probs.filter((item) => styles.value.every((i) => item.styles.includes(i)))
  }
  // Filter by route types
  if (filters.value.routetypes.length > 0) {
    probs = probs.filter((item) => filters.value.routetypes.includes(item.routetype))
  }

  // Filter by nameFilter
  if (storeNameFilter.value != "" && storeNameFilter.value != null) {
    const filter = storeNameFilter.value.toLowerCase()
    probs = probs.filter((prob) => prob.tag.toLowerCase().indexOf(filter) != -1)
  }

  // AscentTypeFilter
  if (ascentTypeFilter.value != "all") {
    const projectIDArray = tries.value.map(i => i.problemid)
    const climbedIDArray = ticks.value.map(i => i.problemid)
    probs = probs.filter((prob) => {
      if (ascentTypeFilter.value == 'projects') {
        // The problem is a project AND NOT ticked..
        return projectIDArray.includes(prob.id) && !climbedIDArray.includes(prob.id)
      } else if (ascentTypeFilter.value == 'climbed') {
        return climbedIDArray.includes(prob.id)
      } else if (ascentTypeFilter.value == 'unclimbed') {
        return !projectIDArray.includes(prob.id) && !climbedIDArray.includes(prob.id)
      }
      return true // this is all
    })
  }

  // Filter by walls
  if (filters.value.walls != null && filters.value.walls.length > 0) {
    probs = probs.filter((item) => {
      if (item.wall == null) {
        return true
      }
      return filters.value.walls.includes(item.wall.id)
    })
  }
  // Filter by route props (all, new, expiring, circuits)
  if (problemFilters.value != 'all') {
    probs = probs.filter((item) => problemStyleFilter(item, problemFilters.value))
  }
  const sortKey = sort.value
  //probs = probs.slice().sort((a, b) => sortFunction(a, b, sortKey))
  probs = [...probs].sort((a, b) => sortFunction(a, b, sortKey))
  return probs
})
const onSortChanged = (sort) => {
  store.commit('setFilterSort', sort)
  // TODO: Save to localStorage
}

const wallNamesDiffer = (idx) => {
  if (idx < 1) {
    return true
  }
  const a = filteredProblems.value[idx]
  const b = filteredProblems.value[idx - 1]
  if (a == null || b == null || a.wall == null || b.wall == null) {
    return false
  }
  return a.wall.wallchar != b.wall.wallchar
}
const routesettersDiffer = (idx) => {
  if (idx < 1) {
    return true
  }
  const a = filteredProblems.value[idx]
  const b = filteredProblems.value[idx - 1]
  return a.author != b.author
}
const gradesDiffer = (idx) => {
  if (idx < 1) {
    return true
  }
  const a = filteredProblems.value[idx]
  const b = filteredProblems.value[idx - 1]
  if (a.grade == null || b.grade == null) {
    return false
  }
  return a.grade.score != b.grade.score
}
const resetFilters = () => {
  nameFilter.value = ''
  selectedWalls.value = []
  store.commit('resetFilters')
}
watch(nameFilter, (newValue) => {
 // propagate to store
  store.commit('setNameFilter', newValue)
})
watch(selectedWalls, (newValue) => {
 // propagate to store
  store.commit('setFilterWalls', newValue)
})
const getSelectedWalls = computed(() => {
  return filters.value.walls.map((wallid) => {
    const wall = walls.value.find((w) => w.id == wallid)
    return { id: wallid, name: wall ? (wall.wallchar + ' ' + wall.walldesc).trim() : wallid }
  })
})
const removeWall = (wallId) => {
  selectedWalls.value = selectedWalls.value.filter(id => id !== wallId)
}
</script>
<style scoped>
.list-group-title {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--p-text-muted);
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--p-border);
}
.list-group-title h3 {
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
}
</style>
