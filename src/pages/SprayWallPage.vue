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
        </div>

        <!-- Filters can empty a wall that has plenty on it, so say which state
             this is rather than reusing the "nobody has set anything" copy. -->
        <p v-if="problems.length === 0" class="px-4 mt-4 text-center text-sm p-text-dim">
          {{ t('spraywall.no_match') }}
        </p>

        <f7-list v-else class="spray-problem-list">

          <f7-list-item
            v-for="problem in problems"
            :key="problem.id"
            :title="problemTitle(problem)"
            :after="problem.grade?.name || ''"
            link="#"
            @click="openProblem(problem)"
          >
            <template #subtitle>
              <span class="spray-row">
                <span v-if="problem.author?.name" class="spray-row__item">
                  <span class="material-icons">person</span>{{ problem.author.name }}
                </span>
                <span class="spray-row__item">
                  <span class="material-icons">check_circle_outline</span>{{ problem.total_ascents || 0 }}
                </span>
                <span v-if="problem.c_like" class="spray-row__item">
                  <span class="material-icons">thumb_up</span>{{ problem.c_like }}
                </span>
                <span class="spray-row__item">
                  <span class="material-icons">radio_button_unchecked</span>{{ problem.holds?.length || 0 }}
                </span>
                <span v-if="problem.spray_wall_approval === 'pending'" class="spray-row__item">
                  · {{ t('spraywall.awaiting_review') }}
                </span>
                <span v-else-if="problem.spray_wall_approval === 'rejected'" class="spray-row__item">
                  · {{ t('spraywall.rejected') }}
                </span>
              </span>
            </template>
          </f7-list-item>
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { f7 } from 'framework7-vue'
import api from '@js/api'

const { t } = useI18n()

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
const footRule = ref('')
const excludeMySends = ref(false)
const onlyMyProjects = ref(false)

// Part of the key, so changing a control refetches rather than showing the
// previous answer while the new one loads.
// Whether the climber has narrowed the list themselves. Without this an empty
// result from a filter would show the "nobody has set anything here yet" state,
// which is both wrong and discouraging on a wall full of problems.
const hasFilters = computed(
  () => !!footRule.value || excludeMySends.value || onlyMyProjects.value
)

const query = computed(() => ({
  sort: sort.value,
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

const problemTitle = (problem) => {
  if (problem.addt) return problem.addt.split('\n')[0]
  return `${t('spraywall.problem')} #${problem.id}`
}

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
