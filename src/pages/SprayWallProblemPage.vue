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
        <photo-adjust-controls />

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
            <img :src="problem.image.image_url" class="spray-canvas__img" :alt="title" :style="{ filter: photoFilter }" />
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
                :fill="ROLE_FILLS[hold.role]"
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

        <!-- Who set it and when. On a spray wall the setter is another climber,
             which is most of what tells you whether a problem is worth trying. -->
        <div class="spray-meta mt-3">
          <span v-if="problem.author?.name" class="spray-meta__item">
            <span class="material-icons">person</span>{{ problem.author.name }}
          </span>
          <span v-if="setDate" class="spray-meta__item">
            <span class="material-icons">event</span>{{ setDate }}
          </span>
          <span v-if="problem.grade?.name" class="spray-meta__item">
            <span class="material-icons">signal_cellular_alt</span>{{ problem.grade.name }}
          </span>
        </div>

        <div class="spray-meta mt-2">
          <span class="spray-meta__item">
            <span class="material-icons">check_circle_outline</span>
            {{ t('spraywall.send_count', problem.total_ascents || 0) }}
          </span>
          <span v-if="problem.c_like" class="spray-meta__item">
            <span class="material-icons">thumb_up</span>{{ problem.c_like }}
          </span>
          <span v-if="problem.c_dislike" class="spray-meta__item">
            <span class="material-icons">thumb_down</span>{{ problem.c_dislike }}
          </span>
          <span v-if="problem.comment_count" class="spray-meta__item">
            <span class="material-icons">chat_bubble_outline</span>{{ problem.comment_count }}
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

        <div v-if="alreadyTicked" class="p-banner p-banner--info mt-3">
          <span class="material-icons p-banner__icon">check_circle</span>
          <div class="p-banner__content">{{ t('spraywall.already_ticked') }}</div>
        </div>

        <!-- A spray wall send is a tick like any other, so this is the app's
             ordinary AddTick, not a copy of it. It needs only problem.id. -->
        <template v-if="isAuthenticated && canTick">
          <div class="p-section-title text-center mt-3" style="font-size: 0.85rem;">
            {{ t('problem.add_new_tick') }}
          </div>
          <add-tick :problem="problem" />
        </template>

        <!-- Ticking an unreviewed problem would score ranking points for
             something a setter may still remove. -->
        <div v-else-if="isAuthenticated" class="p-banner p-banner--warning mt-3">
          <span class="material-icons p-banner__icon p-text-warning">lock</span>
          <div class="p-banner__content">{{ t('spraywall.cannot_tick_yet') }}</div>
        </div>
      </div>
    </template>
  </f7-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'
import PhotoAdjustControls from '@components/ui/PhotoAdjustControls.vue'
import { usePhotoAdjust } from '@js/usePhotoAdjust'
import { useStore } from 'vuex'
import AddTick from '@components/problem/AddTick.vue'

const { t } = useI18n()
const store = useStore()

const props = defineProps({
  problemId: [String, Number],
})

const ROLE_COLORS = {
  start: '#22c55e',
  hand: '#3b82f6',
  foot: '#eab308',
  finish: '#ef4444',
}

// A marked hold gets a light wash of its role colour as a background, not just
// a transparent version of it. On a dark wall photo, 40%-alpha blue reads as
// near-black; mixing toward white first keeps the fill legible against both a
// bright hold and a shadowed one.
const ROLE_FILLS = {
  start: 'rgba(134, 239, 172, 0.55)',
  hand: 'rgba(147, 197, 253, 0.55)',
  foot: 'rgba(253, 224, 71, 0.55)',
  finish: 'rgba(252, 165, 165, 0.55)',
}

const { photoFilter, useWall } = usePhotoAdjust()

const zoomLevels = [1, 2, 3]
const zoom = ref(1)

const { data: problem, isLoading, isError, refetch } = useQuery({
  queryKey: computed(() => ['spray-wall-problem', props.problemId]),
  queryFn: () => api.getSprayWallProblem(props.problemId),
  enabled: computed(() => !!props.problemId),
})

const holds = computed(() => problem.value?.holds || [])

// Keyed on the problem's wall, so a personal setting saved while building on
// this wall is the one that applies when viewing a problem on it.
watch(problem, (loaded) => {
  if (loaded?.image) useWall(loaded.wallid, loaded.image.display_adjust)
}, { immediate: true })

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

const isAuthenticated = computed(() => store.state.isAuthenticated)

// Only approved problems can be ticked. A pending one is not public yet and a
// rejected one has been removed from circulation; either way the tick would
// score ranking points for something that may not survive review.
const canTick = computed(() => {
  const approval = problem.value?.spray_wall_approval
  return approval === 'approved' || approval == null
})

// Read from the same global tick history the rest of the app uses, so the state
// agrees with what the profile and problem list already show.
const alreadyTicked = computed(() => {
  const id = problem.value?.id
  if (!id) return false
  return (store.state.alltime?.ticks || []).some((tick) => tick.problemid == id)
})

// `added` is a plain datetime string from the API; toLocaleDateString gives the
// climber's own format rather than an ISO stamp.
const setDate = computed(() => {
  const raw = problem.value?.added
  if (!raw) return null
  const parsed = new Date(String(raw).replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString()
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

.spray-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 0.8rem;
  opacity: 0.85;
}

.spray-meta__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.spray-meta__item .material-icons {
  font-size: 16px;
  opacity: 0.7;
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
