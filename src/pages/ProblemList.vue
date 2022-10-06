<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left>
        <f7-link href="/">&lt; home</f7-link>
      </f7-nav-left>
      <f7-nav-title> {{ t('problemlist.problemlist') }} </f7-nav-title>
    </f7-navbar>
    <f7-block>
      <div v-if="unfilteredProblemsExist">
        <div class="my-0 mx-2">
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
              <h2 class="uppercase text-xl my-2 font-bold">
                {{ t('problemlist.sortby') }}
              </h2>
              <sort-by @sort-change="onSortChanged" :sort="filters.sort"></sort-by>
            </li>
            <li>
              <h2 class="uppercase text-xl my-2 font-bold">
                {{ t('problemlist.wallfilter') }}
              </h2>
              <wall-selector v-model="selectedWalls" @clear="onClearWalls" />
            </li>
            <f7-list no-hairlines-md>
              <h2 class="uppercase text-xl my-2 font-bold">
                {{ t('problemlist.problemnamefilter') }}
              </h2>
              <f7-list-input type="text" :placeholder="t('Filter by problem name')" v-model:value="nameFilter" clear-button></f7-list-input>
            </f7-list>

            <button @click="store.dispatch('resetFilters')" class="button bg-red-500 text-white my-2">
              {{ t('problemlist.reset_filters') }}
            </button>
          </ul>
        </div>

        <div v-if="filteredProblems.length > 0">
          <div class="font-bold my-1 text-center">
            {{ filteredProblems?.length }} {{ t('problemlist.visible_out_of') }}
            {{ problems?.length }} {{ t('problemlist.problems') }}
          </div>
          <div class="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800" role="alert">
            <span class="font-medium">Tip!</span> You can tick faster by swiping a problem left.
          </div>
          <div v-if="filters.walls.length > 0">
            <div class="font-bold">{{ t('problemlist.wall_filter_active') }}:</div>
            <span v-for="selWall in getSelectedWallNames" :key="selWall">{{
              selWall
            }}</span>
          </div>


          <f7-list media  class="my-0">
            <div v-for="(problem, idx) in filteredProblems" :key="problem.id">
              <li v-if="filters.sort.match(/sector/) && wallNamesDiffer(idx)" class="list-group-title">
                <h3>{{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }}</h3>
              </li>
              <li v-if="filters.sort.match(/routesetter/) && routesettersDiffer(idx)" class="list-group-title">
                <h3>
                  {{ problem.author }}
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
        <div v-else class="m-4 mb-14 bg-red-300 p-4 border rounded-xl border-red-700">
          <div class="flex flex-col justify-center items-center">
            <h1 class="text-red-800 font-bold text-2xl my-1">
              {{ t('problemlist.snap' + getRandom(1, maxSnap)) }}
            </h1>
            <p class="text-red-600 text-center">
            <h2 class="font-bold text-lg my-1">{{ t('problemlist.no_hits_title') }}</h2>
            <div class="px-2 text-sm my-2">
              {{ t('problemlist.no_hits_desc') }}
              <!--<button @click="resetFilters">{{ t('problemlist.reset_filters') }}</button>-->
            </div>
            </p>
          </div>
        </div>
      </div>
    </f7-block>
  </f7-page>
</template>
<script setup>
// TODO: Add list index
// TODO: Add filter routes, problems
import { ref, computed, onMounted, toRefs } from 'vue'
import SearchHitItem from '@components/ui/problem/SearchHitItem.vue'

import store from '@js/store.js'
import { getRandom } from '@js/helpers'
import WallSelector from '@components/ui/problemlist/WallSelector.vue'
import { maxSnap } from '@js/constants.js'
import { useStore } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import RoundBadge from '@components/ui/RoundBadge.vue'
import GradeFilter from '@components/ui/problemlist/GradeFilter.vue'
import StyleFilter from '@components/ui/problemlist/StyleFilter.vue'
import SortBy from '@components/ui/problemlist/SortBy.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { debounce } from '@js/helpers'
import {
  sortFunction,
  problemStyleFilter,
} from '@components/ui/problemlist/sortFunctions.js'
dayjs.extend(relativeTime)

const props = defineProps({
  areaSelected : {
    type : Object,
    default : null
  },
  wall: {
    type: String,
    default: null,
  },
  f7router: {
    type: Object,
  },
})
onMounted(() => {
  // The areaSelected is an object, which has the wall name as title.
  // So resolve the wall ids based on the wall name.
  if (props.areaSelected !== null) {
     const wallChar = props.areaSelected.title
     const wall = walls.value.find(x => x.wallchar === wallChar)
     if (wall !== null) {
       selectedWalls.value = [wall.id]
     }
  }
})
const { t, d, locale } = useI18n()
const problems = useStore('problems')
const walls = useStore('walls')
const grades = useStore('grades')
const selectedWalls = ref([])
const filters = useStore('filters')
const nameFilter = ref('')
const styles = useStore('styles')
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
const onClearWalls = () => {
  selectedWalls.value = []
}
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

const minChanged = debounce((value) => {
  store.dispatch('setFilterGradeMin', value)
})
const maxChanged = debounce((value) => {
  store.dispatch('setFilterGradeMax', value)
})
const onStylesChanged = (changedStyles) => {
  // set active filters.
  store.dispatch('setFilterStyles', changedStyles)
}
const filteredProblems = computed(() => {
  let probs = Object.keys(problems.value).map(key => problems.value[key])
  if (probs == null) {
    return []
  }
  const filters = useStore('filters')
  let { problemFilters, styles, gradeMin, gradeMax, walls, sort } = toRefs(filters.value)
  if (gradeMax.value != 'max') {
    const maxScore = gradeMax.value.score == 0 ? 99999999 : gradeMax.value.score
    probs = probs.filter((item) => item.grade.score <= maxScore)
  }
  if (gradeMin.value != 'min') {
    probs = probs.filter((item) => item.grade.score >= gradeMin.value.score)
  }
  if (styles.value != null && styles.value.length > 0) {
    probs = probs.filter((item) => styles.value.every((i) => item.styles.includes(i)))
  }

  // Filter by nameFilter
  if (nameFilter.value != "") {
    const filter = nameFilter.value.toLowerCase()
    probs = probs.filter((prob) => prob.tag.toLowerCase().indexOf(filter) != -1)
  }

  // Filter by walls
  if (selectedWalls.value != null && selectedWalls.value.length > 0) {
    probs = probs.filter((item) => {
      if (item.wall == null) {
        return true
      }
      return selectedWalls.value.includes(item.wall.id)
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
  store.dispatch('setFilterSort', sort)
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
  store.dispatch('resetFilters')
  selectedWalls.value = []
}
const getSelectedWallNames = computed(() => {
  return filters.value.walls.map((wallid) => {
    return walls.value.find((wall) => wall.id == wallid).walldesc
  })
})
</script>
<style></style>
