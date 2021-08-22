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
          </f7-list>
        </f7-col>
      </f7-row>
    </f7-block>
            
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
                <div style="width : 80px;" class="display-flex flex-direction-column">
                    <span>{{ getAfter(problem) }}</span>
                    <small>
                        {{ $t('home.by') }} {{ problem.author }}
                    </small>

                </div>
            </template>
            <template #title>
                    <small> {{ problem.ascentCount }} {{ $t('home.ascents')}}</small>
            </template>
            <template #after-start>
                    <strong class="margin-left margin-right" v-if="problem.c_like > 0">
                    <f7-icon size="15" color="red" material="favorite"></f7-icon>
                    {{ problem.c_like }} 
                    </strong>
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
                <h2 style="width : 40px;" class="margin-left no-margin">{{ getGrade(problem.routetype,problem.grade) }}</h2>
            </template>
            </f7-list-item>
      </div>
    </f7-list>
  </div>
</template>
<script>
// TODO: Add list index
// TODO: Add filter routes, problems
import { ref, computed, onMounted } from "vue";
import { useStore } from "framework7-vue";
import { useI18n } from "vue-i18n";
import RoundBadge from "./RoundBadge.vue";
import GradeFilter from "@components/ui/problemlist/GradeFilter.vue";
import StyleFilter from "@components/ui/problemlist/StyleFilter.vue";
import SortBy from "@components/ui/problemlist/SortBy.vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createLocal, createSession, createStorage } from "the-storages";
import { debounce } from '@js/helpers'
import { sortFunction } from '@components/ui/problemlist/sortFunctions.js'
dayjs.extend(relativeTime);
import store from '@js/store.js'

export default {
  components: { RoundBadge },
  props: {
    wall: {
      type: String,
      default: null,
    },
  },
  setup(props, context) {
    const mirror = ref(null);
    mirror.value = createLocal();
    const storage = ref(null);
    storage.value = mirror._prx;
    const { t, d, locale } = useI18n();
    const problems= useStore("problems");
    const walls = useStore("walls")
    const grades = useStore('grades')
    const filters = useStore('filters')
    const styles = useStore('styles')
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
    const getTagShort = (tag) => {
      if (tag == null) {
        return "";
      }

      return tag.substring(tag.length - 4);
    };
    const sortedWalls = computed(() => {
      if (walls.value == null) {
        return [];
      }
      return walls.value.sort((a, b) => a.wallchar.localeCompare(b.wallchar))
    });
  
    const minChanged = debounce((value) => {
        store.dispatch('setGradeMin',value)
    })
    const maxChanged = debounce((value) => {
        store.dispatch('setGradeMax',value)
    })
    const onStylesChanged = (styles) => {
        // set active filters.
        store.dispatch('setStyles',styles)
    }
    const getGrade = (routetype,gradeObj) => {
        if (gradeObj == null) {
            return "N/A"
        }
        const grade = gradeObj.name 
        if (routetype=='boulder') {
            return grade.toUpperCase()
        }
        return grade.toLowerCase()
    }
    const filteredProblems = computed(() => {
        let probs = problems.value
        if (filters.value.gradeMax!= 'max') {
            probs = probs.filter((item => item.grade.score <= filters.value.gradeMax.score ))
        }
        if (filters.value.gradeMin !='min') {
            probs = probs.filter((item => item.grade.score >= filters.value.gradeMin.score ))
        }
        if (filters.value.styles !=null && filters.value.styles.length > 0) {
            probs = probs.filter((item) => filters.value.styles.every(i => item.styles.includes(i)))
        }
        // Filter by walls
        if (filters.value.walls !=null && filters.value.walls.length > 0) {
            probs = probs.filter((item) => {
                if (item.wall == null) {
                    return true
                }
                return filters.value.walls.includes(item.wall.id)
            })
        }
        const sortKey = filters.value.sort
        probs = probs.slice().sort((a,b) => sortFunction(a,b,sortKey))
        return probs
    })
    const onSortChanged = (sort) => {

        store.dispatch('setSort',sort)
        // TODO: Save to localStorage
        // storage.filters.sort = sort
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
    return {
      sortedWalls,
      wallNamesDiffer,
      routesettersDiffer,
      gradesDiffer,
      mirror,
      storage,
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