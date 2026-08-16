<template>
  <f7-page name="spray-wall">
    <f7-navbar :title="wallName || t('spraywall.wall')" back-link="Back" />

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

      <div v-else-if="problems.length === 0" class="px-4 mt-6 text-center">
        <span class="material-icons p-text-dim" style="font-size: 48px;">grid_on</span>
        <h2 class="text-lg font-bold mt-2">{{ t('spraywall.empty_title') }}</h2>
        <p class="p-text-dim text-sm mt-1">{{ t('spraywall.empty_body') }}</p>
      </div>

      <f7-list v-else class="spray-problem-list">
        <f7-list-item
          v-for="problem in problems"
          :key="problem.id"
          :title="problemTitle(problem)"
          :after="problem.grade?.name || ''"
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
    </template>
  </f7-page>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'

const { t } = useI18n()

const props = defineProps({
  // Framework7 passes route params as strings.
  wallId: [String, Number],
  wallName: String,
  ready: { type: Boolean, default: true },
})

const { data: problems, isLoading, isError, refetch } = useQuery({
  queryKey: computed(() => ['spray-wall-problems', props.wallId]),
  queryFn: () => api.getSprayWallProblems(props.wallId),
  enabled: computed(() => !!props.wallId && props.ready !== false),
  initialData: [],
})

const problemTitle = (problem) => {
  if (problem.addt) return problem.addt.split('\n')[0]
  return `${t('spraywall.problem')} #${problem.id}`
}
</script>

<style scoped>
.spray-problem-list {
  margin-top: 0.5rem;
}
</style>
