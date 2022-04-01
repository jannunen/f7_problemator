<template>
    <f7-page>
      <f7-navbar :title="t('problemlist.problemlist')" back-link>
      </f7-navbar>
      <f7-block>
  <div class="my-0 mx-2">
        <h2 class="uppercase text-xl my-2 font-bold">{{ t('problemlist.gradefilter') }}</h2>
    <ul class="my-0">
      <li  :title="t('problemlist.filters')">
          <grade-filter
            :min="filters.gradeMin"
            :max="filters.gradeMax"
            :grades="grades"
            @min="minChanged"
            @max="maxChanged"
          ></grade-filter>

        <h2 class="uppercase text-xl my-2 font-bold">{{ t('problemlist.stylefilter') }}</h2>
          <style-filter
            @styles-changed="onStylesChanged"
            :styles="styles"
            :selected-styles="filters.styles"
          ></style-filter>
        <h2 class="uppercase text-xl my-2 font-bold">{{ t('problemlist.sortby') }}</h2>
          <sort-by @sort-change="onSortChanged" :sort="filters.sort"></sort-by>
      </li>
      <button
        @click="store.dispatch('resetFilters')"
        class="button bg-red-500 text-white my-2"
      >
        {{ t("problemlist.reset_filters") }}
      </button>
    </ul>
  </div>

  <div v-if="filteredProblems.length > 0">
        <div class="font-bold my-1 text-center">
          {{ filteredProblems?.length }} {{ t("problemlist.visible_out_of") }}
          {{ problems?.length }} {{ t("problemlist.problems") }}
        </div>
        <div v-if="filters.walls.length > 0">
          <div class="font-bold">{{ t("problemlist.wall_filter_active") }}:</div>
          <span v-for="selWall in getSelectedWallNames" :key="selWall">{{
            selWall
          }}</span>
        </div>
      
      
      <f7-list problemlist class="my-0">

      <div v-for="(problem, idx) in filteredProblems" :key="problem.id">
        <li
          v-if="filters.sort.match(/sector/) && wallNamesDiffer(idx)"
          class="list-group-title"
        >
          <h3>{{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }}</h3>
        </li>
        <li
          v-if="filters.sort.match(/routesetter/) && routesettersDiffer(idx)"
          class="list-group-title"
        >
          <h3>
            {{ problem.author }}
            <small>({{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }})</small>
          </h3>
        </li>
        <li
          v-if="filters.sort.match(/(hardest|easiest)/) && gradesDiffer(idx)"
          class="list-group-title"
        >
          <h3>
            {{ problem.grade.name }}
            <small>({{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }})</small>
          </h3>
        </li>
        <search-hit-item 
        @start-navigate="onStartNavigate"
        :key="problem.id" 
        :problem="problem"></search-hit-item>
      </div>
    </f7-list>
  </div>
  <div v-else class="m-4 mb-14 bg-white p-4 border rounded-xl border-gray-700">
    <div class="flex flex-col justify-center items-center">
      <h1 class="text-red-500 font-bold text-2xl my-1">
        {{ t("problemlist.snap" + getRandom(1, maxSnap)) }}
      </h1>
      icon smart toy?
      <h2 class="font-bold text-lg my-1">{{ t("problemlist.no_hits_title") }}</h2>
      <div class="px-2 text-sm my-2">
        {{ t("problemlist.no_hits_desc") }}
        <button @click="resetFilters">{{ t("problemlist.reset_filters") }}</button>
      </div>
    </div>
  </div>
  </f7-block> 
  </f7-page>  
</template>
<script setup>
// TODO: Add list index
// TODO: Add filter routes, problems
import { ref, computed, onMounted, toRefs } from "vue";
import SearchHitItem from "@components/ui/problem/SearchHitItem.vue";

import store from '@js/store.js'
import { getRandom } from "@js/helpers";
import {  maxSnap } from "@js/constants.js";
import { useStore } from "framework7-vue";
import { useI18n } from "vue-i18n";
import RoundBadge from "@components/ui/RoundBadge.vue";
import GradeFilter from "@components/ui/problemlist/GradeFilter.vue";
import StyleFilter from "@components/ui/problemlist/StyleFilter.vue";
import SortBy from "@components/ui/problemlist/SortBy.vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { debounce } from "@js/helpers";
import {
  sortFunction,
  problemStyleFilter,
} from "@components/ui/problemlist/sortFunctions.js";
dayjs.extend(relativeTime);

  const props = defineProps({
    wall: {
      type: String,
      default: null,
    },
    f7router : {
      type : Object,
    }
  })
  const { t, d, locale } = useI18n();
  const problems = computed(() => store.state.gym.problems);
  const walls = computed(() => store.state.walls);
  const grades = store.state.grades;
  /*
  const filters = computed(() => store.state.filters);
  */
 const filters = useStore('filters')
  const styles = computed(() => store.state.styles);
  onMounted(() => {});
  const onStartNavigate = (problem) => {
    props.f7router.navigate("/problem/"+problem.id,{
      props : { problem }
    })
  }
  const getGroupTitle = (group) => {
    return group.wallchar + " " + group.walldesc;
  };
  const sortedWalls = computed(() => {
    if (walls.value == null) {
      return [];
    }
    return walls.value.sort((a, b) => a.wallchar.localeCompare(b.wallchar));
  });

  const minChanged = debounce((value) => {
    store.dispatch("setFilterGradeMin", value);
  });
  const maxChanged = debounce((value) => {
    store.dispatch("setFilterGradeMax", value);
  });
  const onStylesChanged = (changedStyles) => {
    // set active filters.
    store.dispatch("setFilterStyles", changedStyles);
  };
  const filteredProblems = computed(() => {
    let probs = problems.value;
    const filters = useStore('filters')
    let { problemFilters, styles, gradeMin, gradeMax, walls, sort } = toRefs(
      filters.value
    );
    if (gradeMax.value != "max") {
      const maxScore = gradeMax.value.score == 0 ? 99999999 : gradeMax.value.score;
      probs = probs.filter((item) => item.grade.score <= maxScore);
    }
    if (gradeMin.value != "min") {
      probs = probs.filter((item) => item.grade.score >= gradeMin.value.score);
    }
    if (styles.value != null && styles.value.length > 0) {
      probs = probs.filter((item) =>
        styles.value.every((i) => item.styles.includes(i))
      );
    }
    // Filter by walls
    if (walls.value != null && walls.value.length > 0) {
      probs = probs.filter((item) => {
        if (item.wall == null) {
          return true;
        }
        return walls.value.includes(item.wall.id);
      });
    }
    // Filter by route props (all, new, expiring, circuits)
    if (problemFilters.value != "all") {
      probs = probs.filter((item) => problemStyleFilter(item, problemFilters.value));
    }
    const sortKey = sort.value;
    probs = probs.slice().sort((a, b) => sortFunction(a, b, sortKey));
    return probs;
  });
  const onSortChanged = (sort) => {
    store.dispatch("setFilterSort", sort);
    // TODO: Save to localStorage
  };

  const wallNamesDiffer = (idx) => {
    if (idx < 1) {
      return true;
    }
    const a = filteredProblems.value[idx];
    const b = filteredProblems.value[idx - 1];
    if (a == null || b == null || a.wall == null || b.wall == null) {
      return false;
    }
    return a.wall.wallchar != b.wall.wallchar;
  };
  const routesettersDiffer = (idx) => {
    if (idx < 1) {
      return true;
    }
    const a = filteredProblems.value[idx];
    const b = filteredProblems.value[idx - 1];
    return a.author != b.author;
  };
  const gradesDiffer = (idx) => {
    if (idx < 1) {
      return true;
    }
    const a = filteredProblems.value[idx];
    const b = filteredProblems.value[idx - 1];
    if (a.grade == null || b.grade == null) {
      return false;
    }
    return a.grade.score != b.grade.score;
  };
  const resetFilters = () => {
    store.dispatch("resetFilters");
  };
  const getSelectedWallNames = computed(() => {
    return filters.value.walls.map((wallid) => {
      return walls.value.find((wall) => wall.id == wallid).walldesc;
    });
  });
</script>
<style></style>
