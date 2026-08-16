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
      <div v-else-if="problems.length === 0" class="px-4 mt-4 text-center">
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
        <f7-list class="spray-problem-list">
          <f7-list-item
            v-for="problem in problems"
            :key="problem.id"
            :title="problemTitle(problem)"
            :after="problem.grade?.name || ''"
            link="#"
            @click="openProblem(problem)"
          >
            <template #subtitle>
              {{ t('spraywall.hold_count', problem.holds?.length || 0) }}
              <template v-if="problem.spray_wall_approval === 'pending'">
                · {{ t('spraywall.awaiting_review') }}
              </template>
              <template v-else-if="problem.spray_wall_approval === 'rejected'">
                · {{ t('spraywall.rejected') }}
              </template>
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
import { computed } from 'vue'
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

const { data: problems, isLoading, isError, refetch } = useQuery({
  queryKey: computed(() => ['spray-wall-problems', props.wallId]),
  queryFn: () => api.getSprayWallProblems(props.wallId),
  enabled,
  initialData: [],
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

.spray-preview {
  width: 100%;
  height: auto;
  border-radius: 10px;
  display: block;
}
</style>
