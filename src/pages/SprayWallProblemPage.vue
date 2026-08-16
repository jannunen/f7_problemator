<template>
  <f7-page name="spray-wall-problem">
    <f7-navbar :title="title" back-link="Back" />

    <div v-if="isLoading" class="px-4 mt-6 text-center p-text-dim text-sm">
      {{ t('global.loading') }}
    </div>

    <div v-else-if="isError || !problem" class="px-4 mt-6 text-center">
      <p class="p-text-dim text-sm">{{ t('spraywall.problem_failed') }}</p>
      <button class="p-btn p-btn--sm mt-2" @click="refetch">{{ t('global.retry') }}</button>
    </div>

    <template v-else>
      <div v-if="problem.spray_wall_approval === 'pending'" class="px-4 mt-2">
        <div class="p-banner p-banner--info">
          <span class="material-icons p-banner__icon">visibility_off</span>
          <div class="p-banner__content">{{ t('spraywall.pending_notice') }}</div>
        </div>
      </div>
      <div v-else-if="problem.spray_wall_approval === 'rejected'" class="px-4 mt-2">
        <div class="p-banner p-banner--warning">
          <span class="material-icons p-banner__icon p-text-warning">block</span>
          <div class="p-banner__content">
            {{ t('spraywall.rejected_notice') }}
            <div v-if="problem.spray_wall_rejection_reason" class="text-xs mt-1">
              {{ problem.spray_wall_rejection_reason }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!problem.image" class="px-4 mt-6 text-center">
        <span class="material-icons p-text-dim" style="font-size: 48px;">image_not_supported</span>
        <p class="p-text-dim text-sm mt-2">{{ t('spraywall.photo_gone') }}</p>
      </div>

      <template v-else>
        <div class="spray-zoom-bar">
          <button
            v-for="z in zoomLevels"
            :key="z"
            class="spray-zoom-btn"
            :class="{ 'spray-zoom-btn--active': zoom === z }"
            @click="zoom = z"
          >{{ z }}×</button>
        </div>

        <div class="spray-canvas-scroll">
          <div class="spray-canvas" :style="{ width: zoom * 100 + '%' }">
            <img :src="problem.image.image_url" class="spray-canvas__img" :alt="title" />
            <svg
              class="spray-canvas__svg"
              :viewBox="`0 0 ${problem.image.width} ${problem.image.height}`"
              preserveAspectRatio="none"
            >
              <!-- Paths rather than polygons or circles: Safari ignores fill on
                   some basic shapes. -->
              <path
                v-for="(hold, i) in drawableHolds"
                :key="i"
                :d="holdPath(hold)"
                :fill="ROLE_COLORS[hold.role] + '66'"
                :stroke="ROLE_COLORS[hold.role]"
                stroke-width="3"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </template>

      <div class="px-4 mt-3 mb-6">
        <div class="spray-legend">
          <span v-for="role in usedRoles" :key="role" class="spray-legend__item">
            <span class="spray-legend__dot" :style="{ background: ROLE_COLORS[role] }"></span>
            {{ t('spraywall.role_' + role) }}
            <span class="p-text-dim">{{ countOf(role) }}</span>
          </span>
        </div>

        <div class="mt-3 text-sm">
          <div>
            <span class="p-text-dim">{{ t('spraywall.foot_rule') }}:</span>
            {{ t('spraywall.foot_' + (problem.spray_wall_foot_rule || 'marked')) }}
          </div>
          <p class="text-xs p-text-dim mt-1">
            {{ t('spraywall.foot_rule_hint_' + (problem.spray_wall_foot_rule || 'marked')) }}
          </p>
        </div>
      </div>
    </template>
  </f7-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'

const { t } = useI18n()

const props = defineProps({
  problemId: [String, Number],
})

const ROLE_COLORS = {
  start: '#22c55e',
  hand: '#3b82f6',
  foot: '#eab308',
  finish: '#ef4444',
}

const zoomLevels = [1, 2, 3]
const zoom = ref(1)

const { data: problem, isLoading, isError, refetch } = useQuery({
  queryKey: computed(() => ['spray-wall-problem', props.problemId]),
  queryFn: () => api.getSprayWallProblem(props.problemId),
  enabled: computed(() => !!props.problemId),
})

const holds = computed(() => problem.value?.holds || [])

// A hold whose geometry is missing cannot be drawn. present() nulls those
// fields when the underlying hold row is gone, so skip rather than emit a
// broken path.
const drawableHolds = computed(() =>
  holds.value.filter((h) => Array.isArray(h.polygon) && h.polygon.length > 0 && ROLE_COLORS[h.role])
)

const usedRoles = computed(() =>
  ['start', 'hand', 'foot', 'finish'].filter((r) => countOf(r) > 0)
)

const countOf = (role) => holds.value.filter((h) => h.role === role).length

const title = computed(() => {
  const p = problem.value
  if (!p) return t('spraywall.problem')
  if (p.addt) return p.addt.split('\n')[0]
  return `${t('spraywall.problem')} #${p.id}`
})

const holdPath = (hold) => {
  const w = problem.value?.image?.width || 1
  const h = problem.value?.image?.height || 1
  return 'M' + hold.polygon.map((p) => `${(p[0] * w).toFixed(1)},${(p[1] * h).toFixed(1)}`).join('L') + 'Z'
}
</script>

<style scoped>
.spray-zoom-bar {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 6px 0;
}

.spray-zoom-btn {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: inherit;
}

.spray-zoom-btn--active {
  background: rgba(var(--p-accent-rgb), 0.2);
  border-color: var(--p-accent);
  color: var(--p-accent);
}

.spray-canvas-scroll {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.spray-canvas {
  position: relative;
  line-height: 0;
}

.spray-canvas__img {
  width: 100%;
  height: auto;
  display: block;
}

.spray-canvas__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.spray-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.75rem;
}

.spray-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.spray-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}
</style>
