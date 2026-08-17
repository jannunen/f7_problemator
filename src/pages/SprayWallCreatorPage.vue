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

      <!-- The scroll box and its floating controls share this wrapper, so the
           buttons sit over the photo rather than scrolling away with it. -->
      <!-- Shown only at 1x. Once you have zoomed, the controls are on screen
           and explaining them is noise; resetting brings it back, which is the
           moment you are starting over anyway. Above the photo, so it is read
           before use rather than found afterwards. -->
      <div v-if="zoom === 1" class="spray-hint">
        <span class="material-icons spray-hint__icon">touch_app</span>
        <div>
          <div><strong>{{ t('spraywall.zoom_explainer_tap') }}</strong></div>
          <div class="spray-hint__sub">{{ t('spraywall.zoom_explainer_controls') }}</div>
        </div>
      </div>

      <div class="spray-toggles">
        <button
          class="spray-toggle"
          :class="{ 'spray-toggle--on': showCircles }"
          @click="showCircles = !showCircles"
        >
          <span class="material-icons">{{ showCircles ? 'radio_button_checked' : 'radio_button_unchecked' }}</span>
          {{ t('spraywall.circles') }}
        </button>
      </div>

      <div class="spray-stage">
        <div ref="scrollEl" class="spray-canvas-scroll">
          <div class="spray-canvas" :style="{ width: zoom * 100 + '%' }" @click="onCanvasTap">
            <img :src="image.image_url" class="spray-canvas__img" :alt="t('spraywall.wall')" :style="{ filter: photoFilter }" />
            <svg
              class="spray-canvas__svg"
              :viewBox="`0 0 ${image.width} ${image.height}`"
              preserveAspectRatio="none"
            >
              <!-- Rings first, so a tagged hold's own outline draws over its
                   ring rather than under it. -->
              <template v-if="showCircles">
                <path
                  v-for="hold in holds"
                  :key="'ring' + hold.id"
                  :d="holdCircle(hold, image.width, image.height)"
                  fill="none"
                  :stroke="roles[hold.id] ? ROLE_COLORS[roles[hold.id]] : 'rgba(255,255,255,0.5)'"
                  :stroke-width="roles[hold.id] ? 6 : 3"
                  vector-effect="non-scaling-stroke"
                  class="spray-ring"
                />
              </template>

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
                @click="cycle(hold.id, $event)"
              />
            </svg>
          </div>
        </div>

        <!-- Only while zoomed: at 1x there is nothing to undo, and two dead
             buttons over the wall would cost the space the wall needs. Top and
             bottom both, since a thumb reaching the top of a phone held at the
             wall is a stretch. -->
        <template v-if="zoom > 1">
          <div class="spray-stage__controls spray-stage__controls--top">
            <button class="spray-stage__btn" @click.stop="zoomOut">
              <span class="material-icons">zoom_out</span>{{ t('spraywall.zoom_out') }}
            </button>
            <button class="spray-stage__btn" @click.stop="resetZoom">
              <span class="material-icons">zoom_out_map</span>{{ t('spraywall.zoom_reset') }}
            </button>
          </div>
          <div class="spray-stage__controls spray-stage__controls--bottom">
            <button class="spray-stage__btn" @click.stop="zoomOut">
              <span class="material-icons">zoom_out</span>{{ t('spraywall.zoom_out') }}
            </button>
            <button class="spray-stage__btn" @click.stop="resetZoom">
              <span class="material-icons">zoom_out_map</span>{{ t('spraywall.zoom_reset') }}
            </button>
          </div>
          <span class="spray-stage__level">{{ zoom }}×</span>
        </template>
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
          <input
            v-model="name"
            type="text"
            maxlength="255"
            class="spray-input mt-1"
            :placeholder="t('spraywall.name_placeholder')"
          />
          <p class="text-xs p-text-dim mt-1">{{ t('spraywall.name_hint') }}</p>
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
import { ref, computed, watch, nextTick } from 'vue'
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

// On by default: rings are what make a hold findable at a glance, and someone
// who prefers the bare photo can turn them off.
const showCircles = ref(true)

const MAX_ZOOM = 4
const zoom = ref(1)
const scrollEl = ref(null)

// Double-tap bookkeeping. Rather than delaying every tap by 300ms to see
// whether a second one follows — which would make picking holds feel broken —
// the first tap acts immediately and a second one UNDOES it before zooming.
// Selecting a hold stays instant; only the rarer double-tap pays anything.
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_PX = 30
let lastTap = null
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

const applyRole = (holdId, role) => {
  const next = { ...roles.value }
  if (role == null) delete next[holdId]
  else next[holdId] = role
  roles.value = next
}

const cycle = (holdId, event) => {
  if (event && isDoubleTap(event, holdId)) return

  const order = cycleOrder.value
  const current = roles.value[holdId]

  let role
  if (!current) {
    role = order[0]
  } else {
    const i = order.indexOf(current)
    // An unknown role here means the foot rule changed under it; drop it.
    role = i === -1 || i === order.length - 1 ? null : order[i + 1]
  }
  applyRole(holdId, role)
}

/**
 * True when this tap completes a double-tap. Zooms, and rolls back the role
 * change the first tap made so a zoom gesture never silently retags a hold.
 */
const isDoubleTap = (event, holdId = null) => {
  const now = event.timeStamp || Date.now()
  const prev = lastTap
  lastTap = { at: now, x: event.clientX, y: event.clientY, holdId, roleBefore: roles.value[holdId] }

  if (
    prev &&
    now - prev.at < DOUBLE_TAP_MS &&
    Math.abs(event.clientX - prev.x) < DOUBLE_TAP_PX &&
    Math.abs(event.clientY - prev.y) < DOUBLE_TAP_PX
  ) {
    if (prev.holdId !== null) applyRole(prev.holdId, prev.roleBefore)
    lastTap = null
    zoomInAt(event)
    return true
  }

  return false
}

// Taps that miss every hold still zoom, so the gesture works on bare wall.
const onCanvasTap = (event) => {
  if (event.target.classList?.contains('spray-hold')) return
  isDoubleTap(event)
}

/**
 * Zoom one step, keeping whatever was under the finger under the finger. Zoom
 * is a width multiplier on a scrolling box, so the scroll offsets have to be
 * recomputed against the new content size or the tapped hold flies off screen.
 */
const zoomInAt = (event) => {
  if (zoom.value >= MAX_ZOOM) return

  const el = scrollEl.value
  const canvas = el?.querySelector('.spray-canvas')
  if (!el || !canvas) {
    zoom.value = Math.min(zoom.value + 1, MAX_ZOOM)
    return
  }

  const rect = canvas.getBoundingClientRect()
  const fx = (event.clientX - rect.left) / rect.width
  const fy = (event.clientY - rect.top) / rect.height

  zoom.value = Math.min(zoom.value + 1, MAX_ZOOM)

  nextTick(() => {
    el.scrollLeft = fx * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = fy * el.scrollHeight - el.clientHeight / 2
  })
}

const zoomOut = () => {
  const el = scrollEl.value
  // Hold the centre rather than snapping to a corner on the way out.
  const fx = el && el.scrollWidth ? (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth : 0.5
  const fy = el && el.scrollHeight ? (el.scrollTop + el.clientHeight / 2) / el.scrollHeight : 0.5

  zoom.value = Math.max(zoom.value - 1, 1)

  nextTick(() => {
    if (!el) return
    el.scrollLeft = fx * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = fy * el.scrollHeight - el.clientHeight / 2
  })
}

const resetZoom = () => {
  zoom.value = 1
  nextTick(() => {
    if (!scrollEl.value) return
    scrollEl.value.scrollLeft = 0
    scrollEl.value.scrollTop = 0
  })
}

// A ring around the hold, drawn from its bbox. The polygon traces the hold's
// exact outline, which is precise and hard to pick out at arm's length on a
// wall of five hundred; a ring standing clear of the hold is what Kilter,
// Stokt and Tension all use, and it reads from further away.
//
// A path, not <circle>: Safari ignores fill and stroke on some basic shapes,
// which cost real time earlier in this project. Two arcs make a full circle.
const holdCircle = (hold, w, h) => {
  const cx = (hold.bbox_x + hold.bbox_w / 2) * w
  const cy = (hold.bbox_y + hold.bbox_h / 2) * h
  // Sized off the larger side so a long thin hold is still enclosed, with a
  // margin so the ring sits outside the hold rather than cutting across it.
  const r = (Math.max(hold.bbox_w * w, hold.bbox_h * h) / 2) * 1.35
  return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`
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
  if (!name.value.trim()) out.push(t('spraywall.need_name'))
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
      addt: name.value.trim(),
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
.spray-stage {
  position: relative;
}

/* Sits over the photo and does not scroll with it. pointer-events: none on the
   strip so it never swallows a tap meant for a hold behind it; the buttons
   themselves opt back in. */
.spray-stage__controls {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  z-index: 2;
}

.spray-stage__controls--top {
  top: 8px;
}

.spray-stage__controls--bottom {
  bottom: 8px;
}

.spray-stage__btn {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  border: none;
  color: #fff;
  /* Opaque enough to stay readable over any part of a wall photo. */
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(2px);
}

.spray-stage__btn .material-icons {
  font-size: 16px;
}

.spray-stage__level {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.72);
  pointer-events: none;
}

.spray-canvas-scroll {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  /* Capped, so the floating controls stay on screen at 4x instead of being
     pushed past the bottom of a very tall wall photo. */
  max-height: 70vh;
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

.spray-toggles {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.spray-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: inherit;
}

.spray-toggle .material-icons {
  font-size: 15px;
}

.spray-toggle--on {
  background: rgba(var(--p-accent-rgb), 0.2);
  border-color: var(--p-accent);
  color: var(--p-accent);
}

/* Rings are a visual aid; taps belong to the hold shape underneath. */
.spray-ring {
  pointer-events: none;
}

.spray-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 6px 1rem;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.72rem;
  line-height: 1.35;
  background: rgba(var(--p-accent-rgb), 0.1);
  border: 1px solid rgba(var(--p-accent-rgb), 0.25);
}

.spray-hint__icon {
  font-size: 18px;
  color: var(--p-accent);
}

.spray-hint__sub {
  opacity: 0.75;
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
