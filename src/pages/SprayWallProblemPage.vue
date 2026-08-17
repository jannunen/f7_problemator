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
      <!-- Two different situations wearing the same approval state: on a wall
           that shows unreviewed problems this one is public, so claiming only
           the author can see it would be plainly false. -->
      <div v-if="problem.spray_wall_approval === 'pending'" class="px-4 mt-2">
        <div class="p-banner p-banner--info">
          <span class="material-icons p-banner__icon">
            {{ problem.wall_shows_unmoderated ? 'schedule' : 'visibility_off' }}
          </span>
          <div class="p-banner__content">
            {{ problem.wall_shows_unmoderated ? t('spraywall.pending_public_notice') : t('spraywall.pending_notice') }}
          </div>
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
            <img :src="problem.image.image_url" class="spray-canvas__img" :alt="title" :style="{ filter: photoFilter }" />
            <svg
              class="spray-canvas__svg"
              :viewBox="`0 0 ${problem.image.width} ${problem.image.height}`"
              preserveAspectRatio="none"
            >
              <template v-if="showCircles">
                <path
                  v-for="(hold, i) in ringableHolds"
                  :key="'ring' + i"
                  :d="holdCircle(hold)"
                  fill="none"
                  :stroke="ROLE_COLORS[hold.role]"
                  stroke-width="6"
                  vector-effect="non-scaling-stroke"
                />
              </template>

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

        <!-- Floating while zoomed, at both ends: on a wall photo taller than
             the screen a bar above the image scrolls out of reach exactly when
             you are looking at the bottom of it. -->
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

        <!-- Sends, likes, dislikes and comments read as one line of stats
             about the problem, so they sit on one. Counts come from
             problemator_opinion rather than the c_like column, which nothing in
             the app has ever written. -->
        <div class="spray-meta mt-2">
          <span class="spray-meta__item">
            <span class="material-icons">check_circle_outline</span>
            {{ t('spraywall.send_count', problem.total_ascents || 0) }}
          </span>

          <button
            class="spray-meta__btn"
            :class="{ 'spray-meta__btn--on': problem.my_opinion === 'like' }"
            :disabled="opining || !isAuthenticated"
            @click="setOpinion('like')"
          >
            <span class="material-icons">favorite</span>{{ problem.like_count || 0 }}
          </button>

          <button
            class="spray-meta__btn"
            :class="{ 'spray-meta__btn--on': problem.my_opinion === 'dislike' }"
            :disabled="opining || !isAuthenticated"
            @click="setOpinion('dislike')"
          >
            <span class="material-icons">thumb_down</span>{{ problem.dislike_count || 0 }}
          </button>

          <button class="spray-meta__btn" @click="commentsOpen = true">
            <span class="material-icons">chat_bubble_outline</span>{{ (problem.messages || []).length }}
          </button>
        </div>

        <!-- Its own row: writing a comment is an action, not a statistic. -->
        <button v-if="isAuthenticated" class="spray-comment-btn mt-2" @click="askComment">
          <span class="material-icons">add_comment</span>
          {{ t('spraywall.add_comment') }}
        </button>

        <!-- The app's own bar chart. It zips grades and opinions positionally,
             so both must be in score order and the same length — which is what
             opinionsGrouped() returns. -->
        <div v-if="gradeOpinionData.opinions.length" class="mt-4">
          <div class="p-section-title">{{ t('problem.grade_opinions') }}</div>
          <grade-opinions
            :grades="gradeOpinionData.grades"
            :opinions="gradeOpinionData.opinions"
          />
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

        <!-- Collapsed by default: it is a log, and the counts above already
             say whether there is anything in it. -->
        <div v-if="events.length" class="spray-events mt-3">
          <button class="spray-events__toggle" @click="eventsOpen = !eventsOpen">
            <span class="material-icons">{{ eventsOpen ? 'expand_less' : 'expand_more' }}</span>
            {{ t('spraywall.events', events.length) }}
          </button>

          <div v-if="eventsOpen" class="spray-events__body">
            <div class="spray-events__tabs">
              <button
                v-for="tab in eventTabs"
                :key="tab"
                class="spray-events__tab"
                :class="{ 'spray-events__tab--active': eventTab === tab }"
                @click="eventTab = tab"
              >
                {{ t('spraywall.events_' + tab) }} ({{ eventsIn(tab).length }})
              </button>
            </div>

            <p v-if="visibleEvents.length === 0" class="spray-events__empty">
              {{ t('spraywall.events_none') }}
            </p>

            <div v-else class="spray-events__list">
              <div v-for="(event, i) in visibleEvents" :key="i" class="spray-events__row">
                <span
                  class="spray-events__type"
                  :class="event.type === 'tick' ? 'spray-events__type--tick' : 'spray-events__type--project'"
                >
                  <span class="material-icons">{{ event.type === 'tick' ? 'check_circle' : 'trending_up' }}</span>
                  {{ t('spraywall.event_' + event.type) }}
                </span>
                <span class="spray-events__who">
                  {{ event.is_own ? t('spraywall.you') : (event.name || t('spraywall.someone')) }}
                </span>
                <span class="spray-events__meta">
                  <template v-if="event.tries">{{ t('spraywall.try_count', event.tries) }}</template>
                </span>
                <span class="spray-events__date">{{ formatDate(event.date) }}</span>
              </div>
            </div>
          </div>
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

    <show-comments
      v-if="problem"
      :problem="problem"
      :opened="commentsOpen"
      @close="commentsOpen = false"
    />
  </f7-page>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'
import ShowComments from '@components/problem/ShowComments.vue'
import GradeOpinions from '@components/ui/problem/GradeOpinions.vue'
import { f7 } from 'framework7-vue'
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

// On by default: rings are what make a problem readable at a glance from a few
// metres back, which is where you stand when reading one.
const showCircles = ref(true)

const MAX_ZOOM = 4
const zoom = ref(1)
const scrollEl = ref(null)

// Same gesture as the creator. Nothing here is tappable, so unlike there a
// double-tap has nothing to undo — it only ever zooms.
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_PX = 30
let lastTap = null

const onCanvasTap = (event) => {
  const now = event.timeStamp || Date.now()
  const prev = lastTap
  lastTap = { at: now, x: event.clientX, y: event.clientY }

  if (
    prev &&
    now - prev.at < DOUBLE_TAP_MS &&
    Math.abs(event.clientX - prev.x) < DOUBLE_TAP_PX &&
    Math.abs(event.clientY - prev.y) < DOUBLE_TAP_PX
  ) {
    lastTap = null
    zoomInAt(event)
  }
}

// Zoom is a width multiplier on a scrolling box, so the scroll offsets have to
// be recomputed against the new content size or the spot you tapped flies off
// screen.
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

const commentsOpen = ref(false)
const opining = ref(false)

// GradeOpinions zips the two arrays positionally rather than matching on
// gradeid, so they must be the same length and the same order. opinionsGrouped()
// returns one row per grade sorted by score, so the grades are sorted the same
// way rather than trusted to arrive that way.
const gradeOpinionData = computed(() => {
  const opinions = problem.value?.grade_opinions || []
  const grades = [...(store.state.grades || [])]
    .sort((a, b) => Number(a.score ?? 0) - Number(b.score ?? 0))
  return { grades, opinions }
})

// Called directly rather than through the likeProblem / dislikeProblem store
// actions: those write into state.problems, a normalised map this page never
// reads, so the button would never change. The query is refetched instead.
const setOpinion = async (kind) => {
  if (opining.value) return
  opining.value = true
  try {
    if (kind === 'like') await api.likeProblem(problem.value.id)
    else await api.dislikeProblem(problem.value.id)
    await refetch()
  } catch (e) {
    // Nothing to say beyond leaving the count as it was.
  } finally {
    opining.value = false
  }
}

const askComment = () => {
  f7.dialog.prompt(t('spraywall.comment_prompt'), async (comment) => {
    if (!comment || !comment.trim()) return
    try {
      await api.commentProblem({ id: problem.value.id, comment: comment.trim() })
      await refetch()
      f7.dialog.alert(t('spraywall.comment_thanks'))
    } catch (e) {
      f7.dialog.alert(t('spraywall.comment_failed'))
    }
  })
}

// Only approved problems can be ticked. A pending one is not public yet and a
// rejected one has been removed from circulation; either way the tick would
// score ranking points for something that may not survive review.
const canTick = computed(() => {
  const approval = problem.value?.spray_wall_approval
  if (approval === 'approved' || approval == null) return true

  // A gym that has chosen to publish unreviewed problems is treating them as
  // climbable, so refusing the tick would make that setting half-useless. A
  // rejected one is still off limits.
  return approval === 'pending' && !!problem.value?.wall_shows_unmoderated
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
// Dates arrive as plain datetime strings; toLocaleDateString gives the
// climber's own format rather than an ISO stamp.
const formatDate = (raw) => {
  if (!raw) return ''
  const parsed = new Date(String(raw).replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString()
}

const setDate = computed(() => formatDate(problem.value?.added) || null)

const events = computed(() => problem.value?.events || [])
const eventsOpen = ref(false)

// Defaults to all: the interesting view of a spray wall problem is what has
// happened on it, not only what you did.
const eventTabs = ['all', 'own', 'others']
const eventTab = ref('all')

const eventsIn = (tab) => {
  if (tab === 'own') return events.value.filter((e) => e.is_own)
  if (tab === 'others') return events.value.filter((e) => !e.is_own)
  return events.value
}

const visibleEvents = computed(() => eventsIn(eventTab.value))

// Needs a bbox, which a hold whose row is gone no longer has.
const ringableHolds = computed(() =>
  holds.value.filter((h) => h.bbox_w != null && h.bbox_h != null && ROLE_COLORS[h.role])
)
// A ring around the hold, drawn from its bbox. The polygon traces the hold's
// exact outline, which is precise and hard to pick out at arm's length on a
// wall of five hundred; a ring standing clear of the hold reads from further
// away, which is what Kilter, Stokt and Tension all do.
//
// A path, not <circle>: Safari ignores fill and stroke on some basic shapes.
const holdCircle = (hold) => {
  const w = problem.value?.image?.width || 1
  const h = problem.value?.image?.height || 1
  const cx = (hold.bbox_x + hold.bbox_w / 2) * w
  const cy = (hold.bbox_y + hold.bbox_h / 2) * h
  const r = (Math.max(hold.bbox_w * w, hold.bbox_h * h) / 2) * 1.35
  return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`
}

const holdPath = (hold) => {
  const w = problem.value?.image?.width || 1
  const h = problem.value?.image?.height || 1
  return 'M' + hold.polygon.map((p) => `${(p[0] * w).toFixed(1)},${(p[1] * h).toFixed(1)}`).join('L') + 'Z'
}
</script>

<style scoped>
.spray-stage {
  position: relative;
}

/* Over the photo and not scrolling with it. pointer-events: none on the strip
   so it never swallows a tap; the buttons opt back in. */
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
  /* Framework7 sets `button { width: 100% }` globally, which makes every
     bare button fill its line and flex rows stack. */
  width: auto;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  border: none;
  color: #fff;
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
  /* Capped, so the floating controls stay on screen at 4x rather than being
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

.spray-events__toggle {
  /* Framework7 sets `button { width: 100% }` globally, which makes every
     bare button fill its line and flex rows stack. */
  width: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 4px 0;
  font-size: 0.8rem;
  color: var(--p-accent);
}

.spray-events__toggle .material-icons {
  font-size: 18px;
}

.spray-events__tabs {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.spray-events__tab {
  /* Framework7 sets `button { width: 100% }` globally, which makes every
     bare button fill its line and flex rows stack. */
  width: auto;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: inherit;
}

.spray-events__tab--active {
  background: rgba(var(--p-accent-rgb), 0.2);
  border-color: var(--p-accent);
  color: var(--p-accent);
}

.spray-events__empty {
  font-size: 0.75rem;
  opacity: 0.6;
  margin: 8px 0 0;
}

.spray-events__who {
  opacity: 0.85;
  white-space: nowrap;
}

.spray-events__list {
  margin-top: 4px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  padding: 4px 10px;
}

.spray-events__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.78rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.spray-events__row:last-child {
  border-bottom: none;
}

.spray-events__type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.spray-events__type .material-icons {
  font-size: 16px;
}

.spray-events__type--tick {
  color: #22c55e;
}

.spray-events__type--project {
  color: #eab308;
}

.spray-events__meta,
.spray-events__date {
  opacity: 0.7;
  white-space: nowrap;
}

/* Sized to sit in the stats line rather than stand out from it: these are
   counts you can press, not primary actions. */
.spray-meta__btn {
  /* Framework7 sets `button { width: 100% }` globally, which makes every
     bare button fill its line and flex rows stack. */
  width: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-size: 0.8rem;
  opacity: 0.85;
}

.spray-meta__btn .material-icons {
  font-size: 16px;
  opacity: 0.7;
}

.spray-meta__btn--on,
.spray-meta__btn--on .material-icons {
  color: var(--p-accent);
  opacity: 1;
}

.spray-meta__btn:disabled {
  opacity: 0.45;
}

.spray-comment-btn {
  /* Framework7 sets `button { width: 100% }` globally, which makes every
     bare button fill its line and flex rows stack. */
  width: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: inherit;
}

.spray-comment-btn .material-icons {
  font-size: 17px;
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

.spray-toggles {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.spray-toggle {
  /* Framework7 sets `button { width: 100% }` globally, which makes every
     bare button fill its line and flex rows stack. */
  width: auto;
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
