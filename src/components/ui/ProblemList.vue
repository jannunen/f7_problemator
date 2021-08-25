<template >
  <div>
    <f7-block>
      <f7-row>
        <f7-col>
          <f7-list accordion-list>
            <f7-list-item accordion-item :title="$t('home.filters')">
              <f7-accordion-content>
                <f7-block>
                  <p>
                    <grade-filter
                      :min="filters.gradeMin"
                      :max="filters.gradeMax"
                      :grades="grades"
                      @min="minChanged"
                      @max="maxChanged"
                    ></grade-filter>
                    <style-filter @styles-changed="onStylesChanged" :styles="styles" :selected-styles="filters.styles"></style-filter>
                    <sort-by @sort-change="onSortChanged" :sort="filters.sort"></sort-by>
                  </p>
                </f7-block>
              </f7-accordion-content>
            </f7-list-item>
            <f7-list-item @click="$store.commit('resetFilters')">
                {{ $t('problem.reset_filters') }}
            </f7-list-item>   
          </f7-list>

        </f7-col>
      </f7-row>
    </f7-block>
            
    <div v-if="filteredProblems.length > 0">
    <f7-list problemlist>
        <f7-block inset>
        <f7-block-title>{{ filteredProblems?.length }} {{ $t('home.visible out of') }} {{ problems?.length }} {{ $t('home.problems') }}</f7-block-title>
        </f7-block>

        <div v-for="(problem,idx) in filteredProblems" :key="problem.id">
            <li v-if="filters.sort.match(/sector/) && wallNamesDiffer(idx)" class="list-group-title"><h2>{{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }}</h2></li>
            <li v-if="filters.sort.match(/routesetter/) && routesettersDiffer(idx)" class="list-group-title"><h2>{{ problem.author }} <small>({{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }})</small></h2> </li>
            <li v-if="filters.sort.match(/(hardest|easiest)/) && gradesDiffer(idx)" class="list-group-title"><h2>{{ problem.grade.name }} <small>({{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }})</small></h2> </li>
            <f7-list-item
            :key="problem.id"
            :link="`/problem/`+problem.id+`/`"
            >
            <template #after>
                <div style="width : 100px;" class="display-flex flex-direction-column">
                    <!-- show circuit info if filtering by that -->
                    <small v-if="filters.problemFilters == 'circuits'">
                        <ul>
                            <li v-for="circuit in problem.circuits" :key="circuit.id">
                                <div class="flex flex-row">
                                <round-badge :width="12" :bgColor="circuit.color.code"></round-badge>
                                {{ circuit.circuitname }}
                                </div>
                            </li>
                        </ul>
                    </small>
                    <small v-else-if="filters.problemFilters == 'projects'" class="flex flex-row">
                        <div class="flex flex-col">
                         <span>{{ $tc('problem.tries', getTryTries(problem)) }} </span>
                         <span>{{ $tc('problem.in_sessions', getTrySessions(problem)) }}</span>
                         </div>
                           <span class="m-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-yellow-100 bg-yellow-600 rounded-full">P</span> 
                    </small>
                    <small v-else class="flex flex-row">
                        <div  class="flex flex-col">
                        <small>{{ getAfter(problem) }}</small>
                        {{ $t('home.by') }} {{ problem.author }}
                        </div>
                        <div v-if="problem.myProjects != null && problem.myProjects.length > 0">
                           <span class="m-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-yellow-100 bg-yellow-600 rounded-full">P</span> 
                        </div>
                        <div v-else-if="problem.myTicks != null && problem.myTicks.length > 0">
                           <span class="m-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-green-100 bg-green-600 rounded-full">✓</span> 
                        </div>
                    </small>

                </div>
            </template>
            <template #title>
                    <div class="flex flex-col">
                        <strong class="margin-left margin-right" v-if="problem.c_like > 0">
                            <f7-icon size="15" color="red" material="favorite"></f7-icon>
                            {{ problem.c_like }} 
                        </strong>
                        <small> {{ problem.ascentCount }} {{ $t('home.ascents')}}</small>
                    </div>
            </template>
            <template #after-start>
            </template>
            <template #media>
                <div class="display-flex flex-direction-column">
                    <div class="display-flex flex-direction-row">
                        <round-badge
                        :width="20"
                        :bgColor="problem.colour.code"
                        ></round-badge>
                        {{ getTagShort(problem.tag) }}
                    </div>
                </div>
                <h2 style="width : 20px;" class="font-bold margin-left no-margin">{{ getGrade(problem.routetype,problem.grade) }}</h2>
            </template>
            </f7-list-item>
      </div>
    </f7-list>
    </div>
     <div v-else class="m-4 mb-14 bg-white p-4  border rounded-xl border-gray-700">

            <div class="flex flex-col justify-center items-center">
            <h1 class="text-red-500 font-bold text-xl my-1">{{ $t('home.snap'+getRandom(1,maxSnap))}}</h1>
            <f7-icon class="my-1" material="smart_toy" size="54px" color-gray></f7-icon>
            <h2 class="font-bold text-xl my-1">{{ $t('home.no_hits_title')}}</h2>
            <div class="px-14 text-sm">{{ $t('home.no_hits_desc')}}
                <f7-button @click="resetFilters">{{ $t('home.reset_filters') }}</f7-button>

            </div>
            
            </div>
                
        </div>
  </div>
</template>
<script>
// TODO: Add list index
// TODO: Add filter routes, problems
import { ref, computed, onMounted , toRefs } from "vue";

import { getRandom ,maxSnap } from '@js/helpers'
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";
import RoundBadge from "./RoundBadge.vue";
import GradeFilter from "@components/ui/problemlist/GradeFilter.vue";
import StyleFilter from "@components/ui/problemlist/StyleFilter.vue";
import SortBy from "@components/ui/problemlist/SortBy.vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createLocal, createSession, createStorage } from "the-storages";
import { debounce,getTagShort } from '@js/helpers'
import { sortFunction , problemStyleFilter} from '@components/ui/problemlist/sortFunctions.js'
dayjs.extend(relativeTime);
import store from '@js/store/store.js'

export default {
  components: { RoundBadge },
  props: {
    wall: {
      type: String,
      default: null,
    },
  },
  setup(props, context) {
    const { t,  d, locale } = useI18n();
    const store = useStore()
    const problems= computed(() => store.state.gym.problems)
    const walls = store.state.walls
    const grades = store.state.grades
    const filters = computed(() => store.state.filters)
    const styles = computed(() =>store.state.styles)
    onMounted(() => {});
    const getGroupTitle = (group) => {
      return group.wallchar + " " + group.walldesc;
    };
    const getAuthor = (group) => {
      return group.ascentCount+" "+t('home.ascents');
    };
    const getAfter = (group) => {
      const date = dayjs(group.added);
      return date.fromNow();
    };
    const sortedWalls = computed(() => {
      if (walls== null) {
        return [];
      }
      return walls.sort((a, b) => a.wallchar.localeCompare(b.wallchar))
    });
  
    const minChanged = debounce((value) => {
        store.commit('setFilterGradeMin',value)
    })
    const maxChanged = debounce((value) => {
        store.commit('setFilterGradeMax',value)
    })
    const onStylesChanged = (changedStyles) => {
        // set active filters.
        store.commit('setFilterStyles',changedStyles)
    }
    const getGrade = (routetype,gradeObj) => {
        if (gradeObj == null) {
            return "N/A"/tore
        }
        const grade = gradeObj.name 
        if (routetype=='boulder') {
            return grade.toUpperCase()
        }
        return grade.toLowerCase()
    }
    const filteredProblems = computed(() => {
        let probs = problems.value
        let {  problemFilters,styles, gradeMin, gradeMax, walls, sort } = toRefs(filters.value)
        if (gradeMax.value!= 'max') {
            probs = probs.filter((item => item.grade.score <= gradeMax.value.score ))
        }
        if (gradeMin.value !='min') {
            probs = probs.filter((item => item.grade.score >= gradeMin.value.score ))
        }
        if (styles.value!=null && styles.value.length > 0) {
            probs = probs.filter((item) => styles.value.every(i => item.styles.includes(i)))
        }
        // Filter by walls
        if (walls.value !=null && walls.value.length > 0) {
            probs = probs.filter((item) => {
                if (item.wall == null) {
                    return true
                }
                return walls.value.includes(item.wall.id)
            })
        }
        // Filter by route props (all, new, expiring, circuits)
        if (problemFilters.value != "all") {
            probs = probs.filter((item) => problemStyleFilter(item,problemFilters.value))
        }
        const sortKey = sort.value
        probs = probs.slice().sort((a,b) => sortFunction(a,b,sortKey))
        return probs
    })
    const onSortChanged = (sort) => {

        store.commit('setFilterSort',sort)
        // TODO: Save to localStorage
    }

        const wallNamesDiffer = (idx) => {
            if (idx < 1) {
                return true
            }
            const a = filteredProblems.value[idx]
            const b = filteredProblems.value[idx-1]
            if (a  == null || b == null || a.wall == null || b.wall == null) {
                return false
            }
            return a.wall.wallchar != b.wall.wallchar

        }
        const routesettersDiffer = (idx) => {
            if (idx < 1) {
                return true
            }
            const a = filteredProblems.value[idx]
            const b = filteredProblems.value[idx-1]
            return a.author!= b.author

        }
        const gradesDiffer = (idx) => {
            if (idx < 1) {
                return true
            }
            const a = filteredProblems.value[idx]
            const b = filteredProblems.value[idx-1]
            if (a.grade == null || b.grade == null) {
                return false
            }
            return a.grade.score!= b.grade.score

        }
        const resetFilters = () => {
            store.commit('resetFilters')
        }
        const getTryTries = (problem) => {
            // Get info x tries in y session
            if (problem.myProjects != null) {
                const tries = problem.myProjects.reduce ((acc,item) => {
                    acc = acc + parseInt(item.tries)
                    return acc
                },0)
                return  tries
            }
            return null

        }
        const getTrySessions = (problem) => {
            // Get session amount (== day counts as session)
            if (problem.myProjects != null) {
                const mySessions = new Set()
                problem.myProjects.forEach( (item) => {
                    const date = dayjs(item.tstamp)
                    const formatted = date.format("YYYY-MM-DD")
                    mySessions.add(formatted)
                })
                return  mySessions.size
            }
            return null
        }
    return {
      sortedWalls,
      wallNamesDiffer,
      routesettersDiffer,
      gradesDiffer,
      filteredProblems,
      getGrade,
      problems,
      getGroupTitle,
      getAuthor,
      getTagShort,
      getAfter,
      grades,
      filters,
      styles,
      minChanged,
      maxChanged,
      onStylesChanged,
      onSortChanged,
      getRandom,
      maxSnap,
      resetFilters,
      getTryTries,
      getTrySessions,
    };
  },
  components: {
    RoundBadge,
    GradeFilter,
    StyleFilter,
    SortBy,

  },
};
</script>
<style >
</style>