<template>
  <f7-page name="spray-wall">
    <f7-navbar :title="wallName || t('spraywall.wall')" back-link="Back">
      <template #right>
        <f7-link v-if="canCreate" @click="startCreating">
          <span class="material-icons" style="font-size: 24px;">add</span>
        </f7-link>
      </template>
    </f7-navbar>

    <!-- A spray wall with no labelled holds has nothing to build a problem
         from. Say so, rather than showing an empty list that looks broken. -->
    <div v-if="ready === false" class="px-4 mt-6 text-center">
      <span class="material-icons p-text-dim" style="font-size: 48px;">photo_camera</span>
      <h2 class="text-lg font-bold mt-2">{{ t('spraywall.not_ready_title') }}</h2>
      <p class="p-text-dim text-sm mt-1">{{ t('spraywall.not_ready_body') }}</p>
    </div>

    <template v-else>
      <div v-if="isLoading" class="px-4 mt-6 text-center p-text-dim text-sm">
        {{ t('global.loading') }}
      </div>

      <div v-else-if="isError" class="px-4 mt-6 text-center">
        <p class="p-text-dim text-sm">{{ t('spraywall.load_failed') }}</p>
        <button class="p-btn p-btn--sm mt-2" @click="refetch">{{ t('global.retry') }}</button>
      </div>

      <!-- Empty state shows the wall itself. "No problems yet" against a blank
           screen gives no sense of what the wall is or that anything can be
           done about it; the photo does both. -->
      <div v-else-if="problems.length === 0 && !hasFilters" class="px-4 mt-4 text-center">
        <img
          v-if="image?.image_url"
          :src="image.image_url"
          class="spray-preview"
          :alt="wallName || t('spraywall.wall')"
        />
        <h2 class="text-lg font-bold mt-3">{{ t('spraywall.empty_title') }}</h2>
        <p class="p-text-dim text-sm mt-1">{{ t('spraywall.empty_body') }}</p>
        <button
          v-if="canCreate"
          class="p-btn p-btn--primary p-btn--block mt-3"
          @click="startCreating"
        >
          <span class="material-icons" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">add</span>
          {{ t('spraywall.start_by_adding') }}
        </button>
      </div>

      <template v-else>
        <div class="spray-filters">
          <div class="spray-search">
            <span class="material-icons">search</span>
            <input
              v-model="search"
              type="search"
              class="spray-search__input"
              :placeholder="t('spraywall.search_placeholder')"
            />
            <button v-if="search" class="spray-search__clear" @click="search = ''">
              <span class="material-icons">close</span>
            </button>
          </div>

          <select v-model="sort" class="spray-filters__select">
            <option v-for="option in SORTS" :key="option" :value="option">
              {{ t('spraywall.sort_' + option) }}
            </option>
          </select>
          <select v-model="footRule" class="spray-filters__select">
            <option value="">{{ t('spraywall.any_foot_rule') }}</option>
            <option value="marked">{{ t('spraywall.foot_marked') }}</option>
            <option value="follow_hands">{{ t('spraywall.foot_follow_hands') }}</option>
            <option value="screw_ons">{{ t('spraywall.foot_screw_ons') }}</option>
          </select>
          <button
            class="spray-filters__chip"
            :class="{ 'spray-filters__chip--on': excludeMySends }"
            @click="excludeMySends = !excludeMySends"
          >{{ t('spraywall.not_sent_yet') }}</button>
          <button
            class="spray-filters__chip"
            :class="{ 'spray-filters__chip--on': onlyMyProjects }"
            @click="onlyMyProjects = !onlyMyProjects"
          >{{ t('spraywall.my_projects') }}</button>

          <!-- A range, not a set: grades are ordinal and a climber thinks
               "6A to 7A", not "these seven bands". -->
          <div v-if="gradesOnWall.length" class="spray-grades">
            <span class="spray-grades__label">{{ t('spraywall.grade_range') }}</span>
            <select v-model="gradeMin" class="spray-grades__select">
              <option :value="''">{{ t('spraywall.grade_any_min') }}</option>
              <option v-for="grade in gradesOnWall" :key="'min' + grade.id" :value="grade.id">
                {{ grade.name }}
              </option>
            </select>
            <span class="spray-grades__dash">–</span>
            <select v-model="gradeMax" class="spray-grades__select">
              <option :value="''">{{ t('spraywall.grade_any_max') }}</option>
              <option v-for="grade in gradesOnWall" :key="'max' + grade.id" :value="grade.id">
                {{ grade.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Filters can empty a wall that has plenty on it, so say which state
             this is rather than reusing the "nobody has set anything" copy. -->
        <p v-if="problems.length === 0" class="px-4 mt-4 text-center text-sm p-text-dim">
          {{ t('spraywall.no_match') }}
        </p>

        <!-- The app's own problem row, not a lookalike. Same layout, same
             colour badge, grade, ascents, likes and author, the same project /
             sent markers, and the quick-tick swipeout for free. A spray wall
             problem is an ordinary problem, so it should not need its own row. -->
        <!-- `media`, not `media-list`, matching ProblemList exactly.
             framework7-vue's list-item forgets to CALL the inner-start and
             inner-end slots in its media branch (list-item.js:145) while
             calling them correctly in the other one, so Vue receives the raw
             slot function and renders its source as text. SearchHitItem puts
             the author in #inner-end, so media mode fills the row with a
             stringified Vue internal. `media` is not an f7-list prop at all
             (the prop is `mediaList`), which is exactly why it stays out of
             that branch. -->
        <f7-list v-else media class="spray-problem-list" problem-list>
          <search-hit-item
            v-for="problem in problems"
            :key="problem.id"
            :problem="problem"
            @start-navigate="openProblem"
          ></search-hit-item>
        </f7-list>

        <div class="px-4 mb-6">
          <button v-if="canCreate" class="p-btn p-btn--primary p-btn--block" @click="startCreating">
            <span class="material-icons" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">add</span>
            {{ t('spraywall.add_problem') }}
          </button>
        </div>
      </template>
    </template>
  </f7-page>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { useStore } from 'vuex'
import { f7 } from 'framework7-vue'
import api from '@js/api'
import SearchHitItem from '@components/ui/problem/SearchHitItem.vue'

const { t } = useI18n()
const store = useStore()

const props = defineProps({
  // Framework7 passes route params as strings.
  wallId: [String, Number],
  wallName: String,
  ready: { type: Boolean, default: true },
})

const enabled = computed(() => !!props.wallId && props.ready !== false)

const SORTS = [
  'newest', 'oldest', 'most_ascents', 'least_ascents',
  'most_likes', 'least_likes', 'easiest', 'hardest',
]

const sort = ref('newest')
const search = ref('')
// The query key drives the fetch, so the raw input would fire a request per
// keystroke. The box stays responsive; only this settled value is sent.
const searchDebounced = ref('')
let searchTimer = null
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { searchDebounced.value = value.trim() }, 300)
})
onBeforeUnmount(() => clearTimeout(searchTimer))
const gradeMin = ref('')
const gradeMax = ref('')
const footRule = ref('')
const excludeMySends = ref(false)
const onlyMyProjects = ref(false)

// Part of the key, so changing a control refetches rather than showing the
// previous answer while the new one loads.
// Whether the climber has narrowed the list themselves. Without this an empty
// result from a filter would show the "nobody has set anything here yet" state,
// which is both wrong and discouraging on a wall full of problems.
const hasFilters = computed(
  () => !!footRule.value || excludeMySends.value || onlyMyProjects.value ||
    !!searchDebounced.value || !!gradeMin.value || !!gradeMax.value
)

const sortOf = (id) => gradesOnWall.value.find((g) => g.id === id)?.sort ?? 0

// Keep the pair coherent rather than letting it silently return nothing: a
// max below the min is a slip, not an intention.
watch(gradeMin, (value) => {
  if (!value || !gradeMax.value) return
  if (sortOf(value) > sortOf(gradeMax.value)) gradeMax.value = value
})
watch(gradeMax, (value) => {
  if (!value || !gradeMin.value) return
  if (sortOf(value) < sortOf(gradeMin.value)) gradeMin.value = value
})

// Grades the gym actually uses, in its own easy-to-hard order. Offering the
// whole scale would list bands this wall has never seen.
const gradesOnWall = computed(() => {
  const all = store.state.grades || []
  return [...all].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
})

const query = computed(() => ({
  sort: sort.value,
  ...(searchDebounced.value ? { q: searchDebounced.value } : {}),
  ...(gradeMin.value ? { grade_min: gradeMin.value } : {}),
  ...(gradeMax.value ? { grade_max: gradeMax.value } : {}),
  ...(footRule.value ? { foot_rule: footRule.value } : {}),
  ...(excludeMySends.value ? { exclude_my_sends: 1 } : {}),
  ...(onlyMyProjects.value ? { only_my_projects: 1 } : {}),
}))

const { data: problems, isLoading, isError, refetch } = useQuery({
  queryKey: computed(() => ['spray-wall-problems', props.wallId, query.value]),
  queryFn: () => api.getSprayWallProblems(props.wallId, query.value),
  enabled,
  initialData: [],
  keepPreviousData: true,
})

// Fetched here too so the empty state can show the wall, and so "add" is only
// offered when there is actually something to build from.
const { data: image } = useQuery({
  queryKey: computed(() => ['spray-wall-image', props.wallId]),
  queryFn: () => api.getSprayWallImage(props.wallId),
  enabled,
  retry: false,
})

const canCreate = computed(() => (image.value?.holds?.length || 0) > 0)

const openProblem = (problem) => {
  f7.views.main.router.navigate(`/spray-wall/problem/${problem.id}`, {
    props: { problemId: problem.id },
  })
}

const startCreating = () => {
  f7.views.main.router.navigate(`/spray-wall/${props.wallId}/new`, {
    props: { wallId: props.wallId },
  })
}
</script>

<style scoped>
.spray-problem-list {
  margin-top: 0.5rem;
}

.spray-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 1rem 0;
}

.spray-filters__select {
  flex: 1 1 45%;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
}

.spray-filters__chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: inherit;
}

.spray-search {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 100%;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
}

.spray-search .material-icons {
  font-size: 18px;
  opacity: 0.6;
}

.spray-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 0.8rem;
  outline: none;
}

.spray-search__clear {
  border: none;
  background: none;
  color: inherit;
  padding: 0;
  line-height: 0;
}

.spray-grades {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1 1 100%;
}

.spray-grades {
  align-items: center;
  font-size: 0.75rem;
}

.spray-grades__label {
  opacity: 0.7;
}

.spray-grades__select {
  flex: 1;
  min-width: 0;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
}

.spray-grades__dash {
  opacity: 0.5;
}

.spray-filters__chip--on {
  background: rgba(var(--p-accent-rgb), 0.2);
  border-color: var(--p-accent);
  color: var(--p-accent);
}

.spray-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spray-row__item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.spray-row__item .material-icons {
  font-size: 14px;
  opacity: 0.6;
}

.spray-preview {
  width: 100%;
  height: auto;
  border-radius: 10px;
  display: block;
}
</style>
