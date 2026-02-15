<template>
  <f7-page name="gym-map" :page-content="false">
    <div
      ref="containerRef"
      class="gym-map-fullscreen"
      @wheel.prevent="onWheel"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @touchstart="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend="onTouchEnd"
      @contextmenu.prevent
    >
      <svg
        ref="svgRef"
        :viewBox="viewBoxString"
        preserveAspectRatio="xMidYMid meet"
        style="width: 100%; height: 100%; display: block;"
      >
        <!-- Background image -->
        <image
          v-if="backgroundUrl"
          :href="backgroundUrl"
          x="0" y="0" width="1" height="1"
          :opacity="backgroundOpacity"
          preserveAspectRatio="xMidYMid meet"
        />

        <!-- Subtle grid -->
        <g opacity="0.06">
          <line v-for="i in 9" :key="'gv'+i" :x1="i*0.1" y1="0" :x2="i*0.1" y2="1" stroke="#94a3b8" stroke-width="0.001" />
          <line v-for="i in 9" :key="'gh'+i" x1="0" :y1="i*0.1" x2="1" :y2="i*0.1" stroke="#94a3b8" stroke-width="0.001" />
        </g>

        <!-- Walls with problems -->
        <g v-for="wall in mappedWalls" :key="'w-' + wall.id">
          <polygon
            :points="wallPoints(wall)"
            fill="rgba(100,116,139,0.15)"
            stroke="#64748b"
            :stroke-width="0.003 * scale"
            stroke-linejoin="round"
          />
          <!-- Wall label -->
          <text
            :x="wallCenter(wall).x"
            :y="wallCenter(wall).y"
            :font-size="0.018 * scale"
            fill="#1e293b"
            text-anchor="middle"
            dominant-baseline="central"
            style="pointer-events: none; user-select: none; font-weight: 600"
          >{{ wall.wallchar || wall.walldesc }}</text>

          <!-- Problem dots -->
          <template v-for="p in getWallProblems(wall)" :key="'p-' + p.id">
            <circle
              :cx="p.cx"
              :cy="p.cy"
              r="0.008"
              :fill="p.color"
              stroke="#fff"
              stroke-width="0.0024"
              @click.stop="onProblemTap(p)"
            />
            <!-- Short tag inside circle -->
            <text v-if="showLabel"
              :x="p.cx" :y="p.cy"
              font-size="0.0056"
              fill="#fff"
              text-anchor="middle"
              dominant-baseline="central"
              style="pointer-events: none; user-select: none; font-weight: 600"
            >{{ p.gradeName }}</text>
            <!-- Short tag below when zoomed in -->
            <text v-if="showDetails"
              :x="p.cx"
              :y="p.cy + 0.012"
              font-size="0.0036"
              fill="#64748b"
              text-anchor="middle"
              dominant-baseline="hanging"
              style="pointer-events: none; user-select: none; font-weight: 500"
            >{{ shortTag(p.tag) }}</text>
          </template>
        </g>
      </svg>

      <!-- Floating back button -->
      <div class="gym-map-btn" style="left: 12px;" @click="goBack">
        <i class="icon f7-icons" style="font-size: 18px;">chevron_left</i>
      </div>

      <!-- Floating reset zoom button -->
      <div class="gym-map-btn" style="left: 56px;" @click="resetView">
        <i class="icon f7-icons" style="font-size: 16px;">arrow_counterclockwise</i>
      </div>

      <!-- Zoom badge -->
      <div class="gym-map-badge" style="right: 12px;">
        {{ zoomPercent }}%
      </div>

      <!-- Empty state -->
      <div v-if="mappedWalls.length === 0" class="gym-map-empty">
        <i class="icon f7-icons" style="font-size: 48px; color: #94a3b8;">map</i>
        <p style="margin-top: 12px; color: #64748b; font-size: 15px;">No wall shapes drawn yet</p>
        <p style="color: #94a3b8; font-size: 13px;">Wall shapes are drawn in the routesetter dashboard.</p>
      </div>
    </div>
  </f7-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { f7 } from 'framework7-vue'
import { useStore } from 'vuex'

const props = defineProps({
  f7router: Object,
})

const store = useStore()
const svgRef = ref(null)
const containerRef = ref(null)

// View state (local, not in vuex — this is read-only viewer)
const viewBox = ref({ x: 0, y: 0, w: 1, h: 1 })
const scale = computed(() => viewBox.value.w)
const viewBoxString = computed(() => {
  const vb = viewBox.value
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`
})
const zoomPercent = computed(() => Math.round(1 / viewBox.value.w * 100))

// Show tag inside circles at ~250% zoom
const showLabel = computed(() => scale.value < 0.4)
// Show grade + tag below circles at ~300% zoom
const showDetails = computed(() => scale.value < 0.33)

// Data from store
const walls = computed(() => store.state.walls || [])
const problems = computed(() => store.state.problems || {})
const gym = computed(() => store.state.gym)
const backgroundUrl = computed(() => gym.value?.gym_map_config?.background_url || null)
const backgroundOpacity = computed(() => gym.value?.gym_map_config?.opacity ?? 0.3)

const mappedWalls = computed(() =>
  walls.value.filter(w => w.shape_data && w.shape_data.length > 0)
)

// Wall helpers
function wallPoints(wall) {
  return (wall.shape_data || []).map(v => `${v[0]},${v[1]}`).join(' ')
}

function wallCenter(wall) {
  const verts = wall.shape_data || []
  if (verts.length === 0) return { x: 0.5, y: 0.5 }
  const sum = verts.reduce((acc, v) => ({ x: acc.x + v[0], y: acc.y + v[1] }), { x: 0, y: 0 })
  return { x: sum.x / verts.length, y: sum.y / verts.length }
}

// Problem helpers
function getWallProblems(wall) {
  const center = wallCenter(wall)
  const probs = Object.values(problems.value).filter(p => String(p.wallid) === String(wall.id))
  return probs.map((p, i) => {
    let cx, cy
    if (p.map_x != null && p.map_y != null) {
      cx = parseFloat(p.map_x)
      cy = parseFloat(p.map_y)
    } else {
      // Auto-layout in concentric rings around wall centroid
      const dotR = 0.008
      const ringSpacing = dotR * 3
      const maxPerRing = 8
      const ring = Math.floor(i / maxPerRing)
      const posInRing = i % maxPerRing
      const itemsInRing = Math.min(maxPerRing, probs.length - ring * maxPerRing)
      const angle = (2 * Math.PI * posInRing) / itemsInRing
      const radius = ringSpacing * (ring + 1)
      cx = center.x + Math.cos(angle) * radius
      cy = center.y + Math.sin(angle) * radius
    }
    return {
      ...p,
      cx,
      cy,
      color: getColor(p),
      gradeName: p.grade?.name || p.gradeName || '',
    }
  })
}

function shortTag(tag) {
  if (!tag) return ''
  return tag.length > 7 ? tag.slice(7) : tag
}

function getColor(problem) {
  if (problem.colour?.code) return problem.colour.code
  if (problem.colour?.name) {
    const map = {
      red: '#e53e3e', blue: '#3182ce', green: '#38a169',
      yellow: '#ecc94b', orange: '#ed8936', purple: '#805ad5',
      pink: '#ed64a6', black: '#1a202c', white: '#e2e8f0',
    }
    return map[problem.colour.name.toLowerCase()] || '#888'
  }
  return '#888'
}

// Navigation
function goBack() {
  if (props.f7router) {
    props.f7router.back()
  } else {
    f7.views.main.router.back()
  }
}

// Track pan to prevent problem tap during drag
const didPan = ref(false)

function onProblemTap(p) {
  if (didPan.value) return
  const router = props.f7router || f7.views.main.router
  router.navigate('/problem/' + p.id + '/popup', { props: { problem: p } })
}

function resetView() {
  viewBox.value = { x: 0, y: 0, w: 1, h: 1 }
}

// Screen to SVG coordinate conversion
function screenToSVG(clientX, clientY) {
  const svg = svgRef.value
  if (!svg) return [0, 0]
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return [0, 0]
  const svgPt = pt.matrixTransform(ctm.inverse())
  return [svgPt.x, svgPt.y]
}

// Mouse interaction
const isPanning = ref(false)
const panStart = ref(null)
const viewBoxStart = ref(null)

function onWheel(event) {
  const [svgX, svgY] = screenToSVG(event.clientX, event.clientY)
  const zoomFactor = event.deltaY > 0 ? 1.04 : 0.96
  const vb = { ...viewBox.value }
  const newW = Math.max(0.02, Math.min(2, vb.w * zoomFactor))
  const newH = Math.max(0.02, Math.min(2, vb.h * zoomFactor))
  vb.x = svgX - (svgX - vb.x) * (newW / vb.w)
  vb.y = svgY - (svgY - vb.y) * (newH / vb.h)
  vb.w = newW
  vb.h = newH
  viewBox.value = vb
}

function onMouseDown(event) {
  if (event.button === 0) {
    didPan.value = false
    isPanning.value = true
    panStart.value = { x: event.clientX, y: event.clientY }
    viewBoxStart.value = { ...viewBox.value }
  }
}

function onMouseMove(event) {
  if (isPanning.value && panStart.value && viewBoxStart.value) {
    didPan.value = true
    const svg = svgRef.value
    if (!svg) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const dx = (event.clientX - panStart.value.x) / ctm.a
    const dy = (event.clientY - panStart.value.y) / ctm.d
    viewBox.value = {
      x: viewBoxStart.value.x - dx,
      y: viewBoxStart.value.y - dy,
      w: viewBoxStart.value.w,
      h: viewBoxStart.value.h,
    }
  }
}

function onMouseUp() {
  isPanning.value = false
  panStart.value = null
  viewBoxStart.value = null
}

// Touch interaction
const lastPinchDist = ref(null)

function onTouchStart(event) {
  const t = event.touches
  didPan.value = false
  if (t.length === 1) {
    isPanning.value = true
    panStart.value = { x: t[0].clientX, y: t[0].clientY }
    viewBoxStart.value = { ...viewBox.value }
    lastPinchDist.value = null
  } else if (t.length === 2) {
    isPanning.value = false
    panStart.value = null
    lastPinchDist.value = Math.hypot(
      t[0].clientX - t[1].clientX,
      t[0].clientY - t[1].clientY
    )
    viewBoxStart.value = { ...viewBox.value }
  }
}

function onTouchMove(event) {
  didPan.value = true
  const t = event.touches
  if (t.length === 1 && isPanning.value && panStart.value && viewBoxStart.value) {
    const svg = svgRef.value
    if (!svg) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const dx = (t[0].clientX - panStart.value.x) / ctm.a
    const dy = (t[0].clientY - panStart.value.y) / ctm.d
    viewBox.value = {
      x: viewBoxStart.value.x - dx,
      y: viewBoxStart.value.y - dy,
      w: viewBoxStart.value.w,
      h: viewBoxStart.value.h,
    }
  } else if (t.length === 2 && lastPinchDist.value) {
    const dist = Math.hypot(
      t[0].clientX - t[1].clientX,
      t[0].clientY - t[1].clientY
    )
    const cx = (t[0].clientX + t[1].clientX) / 2
    const cy = (t[0].clientY + t[1].clientY) / 2
    const [svgX, svgY] = screenToSVG(cx, cy)
    const ratio = lastPinchDist.value / dist
    const vb = { ...viewBox.value }
    const newW = Math.max(0.02, Math.min(2, vb.w * ratio))
    const newH = Math.max(0.02, Math.min(2, vb.h * ratio))
    vb.x = svgX - (svgX - vb.x) * (newW / vb.w)
    vb.y = svgY - (svgY - vb.y) * (newH / vb.h)
    vb.w = newW
    vb.h = newH
    viewBox.value = vb
    lastPinchDist.value = dist
  }
}

function onTouchEnd(event) {
  if (event.touches.length === 0) {
    isPanning.value = false
    panStart.value = null
    viewBoxStart.value = null
    lastPinchDist.value = null
  } else if (event.touches.length === 1) {
    // Transition from pinch back to pan
    lastPinchDist.value = null
    isPanning.value = true
    panStart.value = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    viewBoxStart.value = { ...viewBox.value }
  }
}
</script>

<style scoped>
.gym-map-fullscreen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f1f5f9;
  touch-action: none;
  overflow: hidden;
}

.gym-map-btn {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10;
}

.gym-map-btn:active {
  background: rgba(0, 0, 0, 0.7);
}

.gym-map-badge {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  pointer-events: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10;
}

.gym-map-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}
</style>
