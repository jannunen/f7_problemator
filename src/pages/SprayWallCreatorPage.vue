<template>
  <f7-page name="spray-wall-creator">
    <f7-navbar :title="t('spraywall.new_problem')" back-link="Back">
      <template #right>
        <f7-link :class="{ disabled: !canSave || saving }" @click="save">
          {{ saving ? t('spraywall.saving') : t('global.save') }}
        </f7-link>
      </template>
    </f7-navbar>

    <div v-if="isLoading" class="px-4 mt-6 text-center p-text-dim text-sm">
      {{ t('global.loading') }}
    </div>

    <div v-else-if="isError || !image" class="px-4 mt-6 text-center">
      <p class="p-text-dim text-sm">{{ t('spraywall.image_failed') }}</p>
      <button class="p-btn p-btn--sm mt-2" @click="refetch">{{ t('global.retry') }}</button>
    </div>

    <div v-else-if="holds.length === 0" class="px-4 mt-6 text-center">
      <span class="material-icons p-text-dim" style="font-size: 48px;">hourglass_empty</span>
      <h2 class="text-lg font-bold mt-2">{{ t('spraywall.no_holds_title') }}</h2>
      <p class="p-text-dim text-sm mt-1">{{ t('spraywall.no_holds_body') }}</p>
    </div>

    <template v-else>
      <p class="px-4 pt-2 text-xs p-text-dim text-center">{{ t('spraywall.tap_hint') }}</p>

      <!-- Zoom is a plain width multiplier on a scrolling box. A spray wall
           carries hundreds of holds, and at fit-to-screen the small ones are
           smaller than a fingertip. -->
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
          <img :src="image.image_url" class="spray-canvas__img" :alt="t('spraywall.wall')" :style="{ filter: photoFilter }" />
          <svg
            class="spray-canvas__svg"
            :viewBox="`0 0 ${image.width} ${image.height}`"
            preserveAspectRatio="none"
          >
            <!-- Paths, not polygons or circles: Safari ignores fill on some
                 basic shapes, and a path renders identically everywhere. -->
            <path
              v-for="hold in holds"
              :key="hold.id"
              :d="holdPath(hold)"
              :fill="fillFor(hold.id)"
              :stroke="strokeFor(hold.id)"
              :stroke-width="roles[hold.id] ? 3 : 1.5"
              vector-effect="non-scaling-stroke"
              class="spray-hold"
              @click="cycle(hold.id)"
            />
          </svg>
        </div>
      </div>

      <div class="px-4 mt-3">
        <div class="spray-legend">
          <span v-for="role in visibleRoles" :key="role" class="spray-legend__item">
            <span class="spray-legend__dot" :style="{ background: ROLE_COLORS[role] }"></span>
            {{ t('spraywall.role_' + role) }}
            <span class="p-text-dim">{{ countOf(role) }}</span>
          </span>
        </div>

        <div class="mt-3">
          <label class="text-sm font-bold">{{ t('spraywall.foot_rule') }}</label>
          <select :value="footRule" class="spray-select mt-1" @change="onFootRuleChange">
            <option value="marked">{{ t('spraywall.foot_marked') }}</option>
            <option value="follow_hands">{{ t('spraywall.foot_follow_hands') }}</option>
            <option value="screw_ons">{{ t('spraywall.foot_screw_ons') }}</option>
          </select>
          <p class="text-xs p-text-dim mt-1">{{ t('spraywall.foot_rule_hint_' + footRule) }}</p>
          <button class="spray-explain-btn mt-1" @click="explainOpen = !explainOpen">
            {{ explainOpen ? t('spraywall.hide_explanation') : t('spraywall.what_do_these_mean') }}
          </button>
          <div v-if="explainOpen" class="spray-explain">
            <p v-for="rule in ['marked', 'follow_hands', 'screw_ons']" :key="rule" class="mb-2">
              <strong>{{ t('spraywall.foot_' + rule) }}</strong> —
              {{ t('spraywall.foot_rule_explain_' + rule) }}
            </p>
          </div>
        </div>

        <div class="mt-3">
          <label class="text-sm font-bold">{{ t('spraywall.grade_label') }}</label>
          <select v-model="gradeId" class="spray-select mt-1">
            <option :value="null">{{ t('spraywall.grade_placeholder') }}</option>
            <option v-for="grade in grades" :key="grade.id" :value="grade.id">{{ grade.name }}</option>
          </select>
        </div>

        <div class="mt-3">
          <label class="text-sm font-bold">{{ t('spraywall.name_label') }}</label>
          <input v-model="name" type="text" class="spray-input mt-1" :placeholder="t('spraywall.name_placeholder')" />
        </div>

        <!-- Says what is still missing rather than just disabling Save, so the
             requirement is discoverable without guessing. -->
        <div v-if="missing.length" class="p-banner p-banner--warning mt-3">
          <span class="material-icons p-banner__icon p-text-warning">info_outline</span>
          <div class="p-banner__content">
            <div v-for="line in missing" :key="line">{{ line }}</div>
          </div>
        </div>

        <div v-if="saveError" class="p-banner p-banner--warning mt-3">
          <span class="material-icons p-banner__icon p-text-warning">error_outline</span>
          <div class="p-banner__content">
            <div v-for="(line, i) in saveError" :key="i">{{ line }}</div>
          </div>
        </div>

        <button
          class="p-btn p-btn--primary p-btn--block mt-3 mb-6"
          :disabled="!canSave || saving"
          @click="save"
        >
          {{ saving ? t('spraywall.saving') : t('spraywall.save_problem') }}
        </button>
      </div>
    </template>
  </f7-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { f7 } from 'framework7-vue'
import api from '@js/api'
import PhotoAdjustControls from '@components/ui/PhotoAdjustControls.vue'
import { usePhotoAdjust } from '@js/usePhotoAdjust'

const { t } = useI18n()
const store = useStore()
const grades = computed(() => store.state.grades || [])
const queryClient = useQueryClient()

const props = defineProps({
  wallId: [String, Number],
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
const roles = ref({})
const footRule = ref('marked')
const name = ref('')
const gradeId = ref(null)
const saving = ref(false)
const saveError = ref(null)
const explainOpen = ref(false)

const { data: image, isLoading, isError, refetch } = useQuery({
  queryKey: computed(() => ['spray-wall-image', props.wallId]),
  queryFn: () => api.getSprayWallImage(props.wallId),
  enabled: computed(() => !!props.wallId),
})

const holds = computed(() => image.value?.holds || [])

// Adopt the gym's setting for this wall as soon as the photo arrives, unless
// the climber has saved their own for it.
watch(image, (loaded) => {
  if (loaded) useWall(props.wallId, loaded.display_adjust)
}, { immediate: true })

// 'foot' is only a legal role when the foot rule is 'marked'; the server
// rejects the problem otherwise. Skipping it in the cycle means the rule
// cannot be contradicted in the first place.
const cycleOrder = computed(() =>
  footRule.value === 'marked'
    ? ['hand', 'start', 'foot', 'finish']
    : ['hand', 'start', 'finish']
)

const visibleRoles = computed(() =>
  footRule.value === 'marked' ? ['start', 'hand', 'foot', 'finish'] : ['start', 'hand', 'finish']
)

// Switching away from 'marked' invalidates every foot hold already marked, and
// the server refuses the combination. Confirm before throwing that work away
// rather than silently deleting it and leaving the climber to notice.
const onFootRuleChange = (event) => {
  const rule = event.target.value
  const feet = Object.values(roles.value).filter((r) => r === 'foot').length

  if (rule === 'marked' || feet === 0) {
    footRule.value = rule
    return
  }

  f7.dialog.confirm(
    t('spraywall.foot_rule_change_body', feet),
    t('spraywall.foot_rule_change_title'),
    () => {
      const next = { ...roles.value }
      for (const id of Object.keys(next)) {
        if (next[id] === 'foot') delete next[id]
      }
      roles.value = next
      footRule.value = rule
    },
    () => {
      // Cancelled: put the <select> back, since it shows the DOM value not ours.
      event.target.value = footRule.value
    }
  )
}

const cycle = (holdId) => {
  const order = cycleOrder.value
  const current = roles.value[holdId]
  const next = { ...roles.value }

  if (!current) {
    next[holdId] = order[0]
  } else {
    const i = order.indexOf(current)
    // An unknown role here means the foot rule changed under it; drop it.
    if (i === -1 || i === order.length - 1) delete next[holdId]
    else next[holdId] = order[i + 1]
  }
  roles.value = next
}

const holdPath = (hold) => {
  const w = image.value?.width || 1
  const h = image.value?.height || 1
  const pts = hold.polygon || []
  if (pts.length === 0) return ''
  return 'M' + pts.map((p) => `${(p[0] * w).toFixed(1)},${(p[1] * h).toFixed(1)}`).join('L') + 'Z'
}

const fillFor = (holdId) => {
  const role = roles.value[holdId]
  return role ? ROLE_FILLS[role] : 'rgba(255,255,255,0.06)'
}

const strokeFor = (holdId) => {
  const role = roles.value[holdId]
  return role ? ROLE_COLORS[role] : 'rgba(255,255,255,0.45)'
}

const countOf = (role) => Object.values(roles.value).filter((r) => r === role).length

// Named "missing", not "problems": a problem is a climb in this app.
const missing = computed(() => {
  const out = []
  const total = Object.keys(roles.value).length
  if (countOf('start') === 0) out.push(t('spraywall.need_start'))
  if (countOf('finish') === 0) out.push(t('spraywall.need_finish'))
  if (total < 3) out.push(t('spraywall.need_three', 3 - total))
  if (!gradeId.value) out.push(t('spraywall.need_grade'))
  return out
})

const canSave = computed(() => missing.value.length === 0)

const save = async () => {
  if (!canSave.value || saving.value) return
  saving.value = true
  saveError.value = null

  try {
    await api.createSprayWallProblem({
      wallid: Number(props.wallId),
      spray_wall_foot_rule: footRule.value,
      gradeid: gradeId.value,
      addt: name.value || null,
      holds: Object.entries(roles.value).map(([id, role]) => ({
        spray_wall_hold_id: Number(id),
        role,
      })),
    })

    // The wall's problem list and the gym's wall counts both just changed.
    queryClient.invalidateQueries({ queryKey: ['spray-wall-problems', props.wallId] })
    queryClient.invalidateQueries({ queryKey: ['spray-walls'] })
    f7.views.main.router.back()
  } catch (e) {
    const body = e?.response?.data
    saveError.value = Array.isArray(body?.errors)
      ? body.errors
      : [body?.message || t('spraywall.save_failed')]
  } finally {
    saving.value = false
  }
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

.spray-hold {
  cursor: pointer;
  pointer-events: all;
}

.spray-explain-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  text-decoration: underline;
  color: var(--p-accent);
}

.spray-explain {
  font-size: 0.75rem;
  opacity: 0.85;
  margin-top: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
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

.spray-select,
.spray-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
}
</style>
