<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left>
        <f7-link href="/home">&lt; back</f7-link>
      </f7-nav-left>
      <f7-nav-title> {{ t('problemlist.problemlist') }} </f7-nav-title>
    </f7-navbar>
    <f7-block>
      <h1 class="font-bold text-2xl text-center">{{ gym.name }}</h1>
      <div v-if="unfilteredProblemsExist">
        <div class="my-0 mx-2">
          <h2 class="uppercase text-xl mt-2 p-0 font-bold">
            {{ t('problemlist.wallfilter') }}
          </h2>
          <wall-selector v-model="selectedWalls" @clear="onClearWalls" />
        </div>
        <p-button class="bg-blue-500 font-bold my-1 uppercase" @click="showFilters=!showFilters">{{ showFilters ? "Hide filters" : "Show more filters"}}</p-button>
        <div v-if="showFilters" class="my-0 mx-2">
          <h2 class="uppercase text-xl mt-2 mb-1 font-bold">
            {{ t('problemlist.routetype') }}
          </h2>
          <f7-list class="m-0 p-0" simple-list>
            <f7-list-item v-for="rt in routeTypes" :key="rt">
              <span>{{ rt }}</span>
              <f7-toggle @toggle:change="selectRoutetype(rt)" :checked="filters.routetypes.includes(rt)"></f7-toggle>
            </f7-list-item>
          </f7-list>
          <h2 class="uppercase text-xl my-2 font-bold">
            {{ t('problemlist.gradefilter') }}
          </h2>
          <ul class="my-0">
            <li :title="t('problemlist.filters')">
              <grade-filter :min="filters.gradeMin" :max="filters.gradeMax" :grades="grades" @min="minChanged" @max="maxChanged"></grade-filter>

              <h2 class="uppercase text-xl my-2 font-bold">
                {{ t('problemlist.stylefilter') }}
              </h2>
              <style-filter @styles-changed="onStylesChanged" :styles="styles" :selected-styles="filters.styles"></style-filter>
            </li>
            <h2 class="uppercase text-xl mt-2 p-0 font-bold">
              {{ t('problemlist.ascent_status_filter') }}
            </h2>
            <ascent-status-filter v-model="ascentTypeFilter" />
            <f7-list no-hairlines-md>
              <h2 class="uppercase text-xl my-2 font-bold">
                {{ t('problemlist.problemnamefilter') }}
              </h2>
              <f7-list-input type="text" :placeholder="t('Filter by problem name')" v-model:value="nameFilter" clear-button></f7-list-input>
            </f7-list>

          </ul>
        </div>

        <p-button @click="resetFilters" class=" bg-red-500 text-white my-2">
          {{ t('problemlist.reset_filters') }}
        </p-button>
        <f7-block v-if="gym != null && gym.floormaps != null && gym.floormaps.length > 0" class="my-0">

          <div v-for="floormap in gym.floormaps" :key="floormap.id" class="my-1">
            <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
          </div>
        </f7-block>

        <h2 class="uppercase text-xl my-2 font-bold">
          {{ t('problemlist.sortby') }}
        </h2>
        <sort-by @sort-change="onSortChanged" :sort="filters.sort"></sort-by>


        <div v-if="filteredProblems.length > 0">
          <div class="font-bold my-1 text-center">
            {{ filteredProblems?.length }} {{ t('problemlist.visible_out_of') }}
            {{ Object.keys(problems).length }} {{ t('problemlist.problems') }}
          </div>
          <div v-if="!tipShown(tipShowStatus, 'quicktick')" class="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800" role="alert">
            <span class="font-medium">Tip!</span> You can tick faster by swiping a problem LEFT. Add a quick try by swiping RIGHT.
            <a href="#" class="text-red-600 text-md" @click.prevent="tipDismiss('quicktick')">do not show again</a>
          </div>
          <div v-if="filters.walls.length > 0" class="bg-blue-50 dark:bg-sky-900 border border-blue-300 dark:border-sky-700 rounded-lg p-3 my-2">
            <div class="font-bold text-blue-700 dark:text-blue-300 text-sm mb-2">{{ t('problemlist.wall_filter_active') }}:</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="selWall in getSelectedWalls"
                :key="selWall.id"
                class="inline-flex items-center bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full"
              >
                {{ selWall.name }}
                <span class="ml-2 cursor-pointer text-blue-200 hover:text-white font-bold" @click="removeWall(selWall.id)">&times;</span>
              </span>
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
        <div v-else class="m-4 mb-14 bg-yellow-200 p-4 border border-2 rounded-xl border-yellow-600">
          <div class="flex flex-col justify-center items-center">
            <h1 class="text-yellow-800 font-bold text-2xl my-1">
              {{ t('problemlist.snap' + getRandom(1, maxSnap)) }}
            </h1>
            <p class="text-black text-center">
            <h2 class="font-bold text-lg my-1">{{ t('problemlist.no_hits_title') }}</h2>
            <div class="px-2 text-sm my-2">
              {{ t('problemlist.no_hits_desc') }}
              <!--<button @click="resetFilters">{{ t('problemlist.reset_filters') }}</button>-->
            </div>
            </p>
          </div>
        </div>
      </div>
      <div v-else>
        <h2 class="font-bold text-2xl text-center">Are you sure a gym is selected?</h2>
      </div>
    </f7-block>
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
<style>

</style>
