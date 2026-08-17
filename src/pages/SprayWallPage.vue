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
        <div class="px-4 py-2">
          <!-- Search stays outside the collapsible card: it is the one control
               someone reaches for without first deciding to "filter". -->
          <div class="spray-search mb-3">
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

          <button
            class="filter-toggle-btn"
            :class="{ 'filter-toggle-btn--open': showFilters }"
            @click="showFilters = !showFilters"
          >
            <span class="material-icons filter-toggle-btn__icon">tune</span>
            <span>{{ showFilters ? t('spraywall.hide_filters') : t('spraywall.filters') }}</span>
            <span v-if="activeFilterCount" class="spray-filter-count">{{ activeFilterCount }}</span>
            <span
              class="material-icons filter-toggle-btn__chevron"
              :class="{ 'filter-toggle-btn__chevron--open': showFilters }"
            >expand_more</span>
          </button>

          <div v-if="showFilters" class="p-card mb-3">
            <div class="mb-4">
              <div class="p-section-title">{{ t('spraywall.sort_by') }}</div>
              <div class="flex flex-start flex-wrap gap-1 py-1">
                <span
                  v-for="option in SORTS"
                  :key="option"
                  class="p-chip"
                  :class="{ 'p-chip--active': sort === option }"
                  @click="sort = option"
                >{{ t('spraywall.sort_' + option) }}</span>
              </div>
            </div>

            <!-- The app's own grade filter, so the two ranges look and behave
                 identically rather than being two takes on the same idea. -->
            <div v-if="gradesOnWall.length" class="mb-4">
              <div class="p-section-title">{{ t('problemlist.gradefilter') }}</div>
              <grade-filter
                :grades="gradesOnWall"
                :min="gradeMinObj"
                :max="gradeMaxObj"
                @min="gradeMinObj = $event"
                @max="gradeMaxObj = $event"
              />
            </div>

            <div class="mb-4">
              <div class="p-section-title">{{ t('spraywall.foot_rule') }}</div>
              <div class="flex flex-start flex-wrap gap-1 py-1">
                <span
                  v-for="option in FOOT_RULES"
                  :key="option.value"
                  class="p-chip"
                  :class="{ 'p-chip--active': footRule === option.value }"
                  @click="footRule = option.value"
                >{{ t(option.label) }}</span>
              </div>
            </div>

            <div class="mb-4">
              <div class="p-section-title">{{ t('spraywall.show') }}</div>
              <div class="flex flex-col gap-0">
                <div class="p-list__item">
                  <span style="color: var(--p-text-secondary);">{{ t('spraywall.not_sent_yet') }}</span>
                  <label class="p-toggle">
                    <input type="checkbox" v-model="excludeMySends" />
                    <span class="p-toggle__track"></span>
                  </label>
                </div>
                <div class="p-list__item">
                  <span style="color: var(--p-text-secondary);">{{ t('spraywall.my_projects') }}</span>
                  <label class="p-toggle">
                    <input type="checkbox" v-model="onlyMyProjects" />
                    <span class="p-toggle__track"></span>
                  </label>
                </div>
              </div>
            </div>

            <button v-if="hasFilters" class="p-btn p-btn--sm p-btn--block" @click="resetFilters">
              {{ t('spraywall.reset_filters') }}
            </button>
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
import GradeFilter from '@components/ui/problemlist/GradeFilter.vue'

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
// GradeFilter speaks in grade OBJECTS, or the strings 'min'/'max' for
// unbounded, so these hold what it emits and only the id is sent to the API.
// It also keeps its own two sliders coherent, so the min/max guard this page
// used to carry is no longer needed.
const gradeMinObj = ref('min')
const gradeMaxObj = ref('max')
const showFilters = ref(false)
const footRule = ref('')
const excludeMySends = ref(false)
const onlyMyProjects = ref(false)

const FOOT_RULES = [
  { value: '', label: 'spraywall.any_foot_rule' },
  { value: 'marked', label: 'spraywall.foot_marked' },
  { value: 'follow_hands', label: 'spraywall.foot_follow_hands' },
  { value: 'screw_ons', label: 'spraywall.foot_screw_ons' },
]

const gradeIdOf = (value) => (value && typeof value === 'object' ? value.id : null)

// Whether the climber has narrowed the list themselves. Without this an empty
// result from a filter would show the "nobody has set anything here yet" state,
// which is both wrong and discouraging on a wall full of problems.
const hasFilters = computed(
  () => !!footRule.value || excludeMySends.value || onlyMyProjects.value ||
    !!searchDebounced.value ||
    gradeIdOf(gradeMinObj.value) !== null || gradeIdOf(gradeMaxObj.value) !== null
)

// Shown on the collapsed button, so a narrowed list is never a mystery once
// the card is shut again.
const activeFilterCount = computed(() => {
  let n = 0
  if (gradeIdOf(gradeMinObj.value) !== null) n++
  if (gradeIdOf(gradeMaxObj.value) !== null) n++
  if (footRule.value) n++
  if (excludeMySends.value) n++
  if (onlyMyProjects.value) n++
  return n
})

const resetFilters = () => {
  search.value = ''
  // Cleared directly as well as through the watcher, so the list refetches now
  // rather than 300ms later.
  clearTimeout(searchTimer)
  searchDebounced.value = ''
  gradeMinObj.value = 'min'
  gradeMaxObj.value = 'max'
  footRule.value = ''
  excludeMySends.value = false
  onlyMyProjects.value = false
}

// Ordered by score, not sort: problemator_grade.sort is NULL for every row,
// so ordering by it left the dropdowns in whatever order the store happened to
// hold. score runs 100, 200, 250 ... strictly upward with difficulty.
const gradesOnWall = computed(() => {
  const all = store.state.grades || []
  return [...all].sort((a, b) => Number(a.score ?? 0) - Number(b.score ?? 0))
})

const query = computed(() => ({
  sort: sort.value,
  ...(searchDebounced.value ? { q: searchDebounced.value } : {}),
  ...(gradeIdOf(gradeMinObj.value) !== null ? { grade_min: gradeIdOf(gradeMinObj.value) } : {}),
  ...(gradeIdOf(gradeMaxObj.value) !== null ? { grade_max: gradeIdOf(gradeMaxObj.value) } : {}),
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

.spray-filter-count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  background: var(--p-accent);
  color: var(--p-bg-deep);
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
  /* Framework7 sets `button { width: 100% }` globally, which makes every
     bare button fill its line and flex rows stack. */
  width: auto;
  border: none;
  background: none;
  color: inherit;
  padding: 0;
  line-height: 0;
}

.spray-grades {
  align-items: center;
  font-size: 0.75rem;
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
