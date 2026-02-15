<template>
  <f7-page name="gym-map" :page-content="false">
    <f7-navbar>
      <f7-nav-left></f7-nav-left>
      <f7-nav-title>Problemator</f7-nav-title>
      <f7-nav-right></f7-nav-right>
    </f7-navbar>
    <f7-toolbar tabbar labels position="bottom">
      <f7-link
        tab-link
        @click="navigateHome"
        text="Home"
        icon-ios="f7:house"
        icon-aurora="f7:house"
        icon-md="material:house"
      ></f7-link>
      <f7-link
        tab-link
        tab-link-active
        text="Map"
        icon-ios="f7:map"
        icon-aurora="f7:map"
        icon-md="material:map"
      ></f7-link>
      <f7-link
        tab-link
        @click="navigateHome"
        text="Feed"
        icon-ios="f7:list_dash"
        icon-aurora="f7:list_dash"
        icon-md="material:list_dash"
      ></f7-link>
    </f7-toolbar>
    <div
      ref="containerRef"
      class="gym-map-container"
      :class="{ 'gym-map-dark': isDark }"
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
        <g :transform="rotationTransform">
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
            :fill="isDark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.15)'"
            :stroke="isDark ? '#94a3b8' : '#64748b'"
            :stroke-width="0.003 * scale"
            stroke-linejoin="round"
          />
          <!-- Wall label -->
          <text
            :x="wallCenter(wall).x"
            :y="wallCenter(wall).y"
            :font-size="0.018 * scale"
            :fill="isDark ? '#e2e8f0' : '#1e293b'"
            text-anchor="middle"
            dominant-baseline="central"
            style="pointer-events: none; user-select: none; font-weight: 600"
          >{{ wall.wallchar || wall.walldesc }}</text>

          <!-- Problem dots (skip selected so it renders on top) -->
          <template v-for="p in getWallProblems(wall)" :key="'p-' + p.id">
            <g v-if="!selectedProblem || selectedProblem.id !== p.id">
              <circle
                :cx="p.cx"
                :cy="p.cy"
                r="0.008"
                :fill="p.color"
                :stroke="isDark ? '#1e293b' : '#fff'"
                stroke-width="0.0024"
                @click.stop="onProblemTap(p)"
              />
              <text v-if="showLabel"
                :x="p.cx" :y="p.cy"
                font-size="0.0056"
                fill="#fff"
                text-anchor="middle"
                dominant-baseline="central"
                style="pointer-events: none; user-select: none; font-weight: 600"
              >{{ displayGrade(p) }}</text>
              <text v-if="showDetails"
                :x="p.cx"
                :y="p.cy + 0.012"
                font-size="0.0036"
                :fill="isDark ? '#94a3b8' : '#64748b'"
                text-anchor="middle"
                dominant-baseline="hanging"
                style="pointer-events: none; user-select: none; font-weight: 500"
              >{{ shortTag(p.tag) }}</text>
            </g>
          </template>
        </g>

        <!-- Selected problem rendered last = topmost -->
        <g v-if="selectedProblem">
          <!-- Pulse ring -->
          <circle
            :cx="selectedProblem.cx"
            :cy="selectedProblem.cy"
            r="0.012"
            fill="none"
            stroke="#fff"
            stroke-width="0.002"
            opacity="0.6"
          />
          <circle
            :cx="selectedProblem.cx"
            :cy="selectedProblem.cy"
            r="0.008"
            :fill="selectedProblem.color"
            stroke="#fff"
            stroke-width="0.003"
            @click.stop="onProblemTap(selectedProblem)"
          />
          <text
            :x="selectedProblem.cx" :y="selectedProblem.cy"
            font-size="0.0056"
            fill="#fff"
            text-anchor="middle"
            dominant-baseline="central"
            style="pointer-events: none; user-select: none; font-weight: 600"
          >{{ displayGrade(selectedProblem) }}</text>
        </g>
        </g>
      </svg>

      <!-- Problem info popup -->
      <div
        v-if="selectedProblem && popupPos"
        class="gym-map-popup"
        :class="{ 'gym-map-popup-dark': isDark }"
        :style="{ left: popupPos.x + 'px', top: popupPos.y + 'px' }"
        @click.stop
        @mousedown.stop
        @touchstart.stop
      >
        <table class="gym-map-popup-table">
          <tr>
            <td class="gym-map-popup-label">Grade</td>
            <td class="gym-map-popup-value" style="font-size: 15px; font-weight: 700;">{{ displayGrade(selectedProblem) }}</td>
          </tr>
          <tr>
            <td class="gym-map-popup-label">Colour</td>
            <td class="gym-map-popup-value"><span class="gym-map-popup-color" :style="{ background: selectedProblem.color }"></span></td>
          </tr>
          <tr v-if="selectedProblem.tag">
            <td class="gym-map-popup-label">Tag</td>
            <td class="gym-map-popup-value">{{ shortTag(selectedProblem.tag) }}</td>
          </tr>
          <tr v-if="selectedProblem.wallName">
            <td class="gym-map-popup-label">Wall</td>
            <td class="gym-map-popup-value">{{ selectedProblem.wallName }}</td>
          </tr>
          <tr v-if="selectedProblem.author">
            <td class="gym-map-popup-label">Setter</td>
            <td class="gym-map-popup-value">{{ setterName(selectedProblem) }}</td>
          </tr>
          <tr v-if="selectedProblem.added">
            <td class="gym-map-popup-label">Set date</td>
            <td class="gym-map-popup-value">{{ formatDate(selectedProblem.added) }}</td>
          </tr>
          <tr v-if="selectedProblem.removal_date">
            <td class="gym-map-popup-label">Removal</td>
            <td class="gym-map-popup-value gym-map-popup-removal">{{ formatDate(selectedProblem.removal_date) }}</td>
          </tr>
          <tr v-if="selectedProblem.total_ascents != null">
            <td class="gym-map-popup-label">Ascents</td>
            <td class="gym-map-popup-value">{{ selectedProblem.total_ascents }}</td>
          </tr>
          <tr v-if="likeCount(selectedProblem) > 0">
            <td class="gym-map-popup-label">Likes</td>
            <td class="gym-map-popup-value">{{ likeCount(selectedProblem) }}</td>
          </tr>
        </table>
        <button class="gym-map-popup-btn" @click.stop="openProblemDetails">
          Open problem details
        </button>
      </div>

      <!-- Floating reset zoom button -->
      <div class="gym-map-btn" style="left: 12px;" @click="resetView">
        <i class="icon f7-icons" style="font-size: 16px;">arrow_counterclockwise</i>
      </div>

      <!-- Floating rotate button -->
      <div class="gym-map-btn" style="left: 56px;" @click="rotateView">
        <i class="icon f7-icons" style="font-size: 16px;">rotate_right</i>
      </div>

      <!-- Floating filter button -->
      <div class="gym-map-btn" style="left: 100px;" @click.stop="showFilters = !showFilters">
        <i class="icon f7-icons" style="font-size: 16px;">line_horizontal_3_decrease</i>
        <span v-if="activeFilterCount > 0" class="gym-map-filter-badge">{{ activeFilterCount }}</span>
      </div>

      <!-- Zoom slider + badge -->
      <div class="gym-map-zoom-row" @mousedown.stop @touchstart.stop>
        <input
          type="range"
          class="gym-map-zoom-slider"
          min="5" max="500" step="1"
          :value="zoomPercent"
          @input="onZoomSlider($event)"
        />
        <span class="gym-map-badge">{{ zoomPercent }}%</span>
      </div>

      <!-- Filter panel -->
      <div
        v-if="showFilters"
        class="gym-map-filter-panel"
        :class="{ 'gym-map-filter-panel-dark': isDark }"
        @click.stop
        @mousedown.stop
        @touchstart.stop
      >
        <div class="gym-map-filter-header">
          <span class="gym-map-filter-title">Filters</span>
          <span v-if="activeFilterCount > 0" class="gym-map-filter-clear" @click="clearFilters">Clear all</span>
        </div>

        <div class="gym-map-filter-section">
          <div class="gym-map-filter-label">Grade</div>
          <div class="gym-map-filter-chips">
            <span
              v-for="g in availableGrades" :key="'fg-' + g"
              class="gym-map-chip"
              :class="{ 'gym-map-chip-active': filterGrades.has(g), 'gym-map-chip-dark': isDark }"
              @click="toggleFilter('grades', g)"
            >{{ g }}</span>
          </div>
        </div>

        <div class="gym-map-filter-section">
          <div class="gym-map-filter-label">Setter</div>
          <div class="gym-map-filter-chips">
            <span
              v-for="s in availableSetters" :key="'fs-' + s"
              class="gym-map-chip"
              :class="{ 'gym-map-chip-active': filterSetters.has(s), 'gym-map-chip-dark': isDark }"
              @click="toggleFilter('setters', s)"
            >{{ s }}</span>
          </div>
        </div>

        <div class="gym-map-filter-section">
          <div class="gym-map-filter-label">Wall</div>
          <div class="gym-map-filter-chips">
            <span
              v-for="w in availableWallNames" :key="'fw-' + w"
              class="gym-map-chip"
              :class="{ 'gym-map-chip-active': filterWalls.has(w), 'gym-map-chip-dark': isDark }"
              @click="toggleFilter('walls', w)"
            >{{ w }}</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="mappedWalls.length === 0" class="gym-map-empty">
        <i class="icon f7-icons" :style="{ fontSize: '48px', color: isDark ? '#64748b' : '#94a3b8' }">map</i>
        <p :style="{ marginTop: '12px', fontSize: '15px', color: isDark ? '#94a3b8' : '#64748b' }">No wall shapes drawn yet</p>
        <p :style="{ fontSize: '13px', color: isDark ? '#64748b' : '#94a3b8' }">Wall shapes are drawn in the routesetter dashboard.</p>
      </div>
    </div>
  </f7-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { f7 } from 'framework7-vue'
import { useStore } from 'vuex'

const props = defineProps({
  f7router: Object,
})

const store = useStore()
const svgRef = ref(null)
const containerRef = ref(null)

// Dark mode detection
const isDark = ref(false)
let darkObserver = null
onMounted(() => {
  isDark.value = document.documentElement.classList.contains('theme-dark')
  darkObserver = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('theme-dark')
  })
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
onUnmounted(() => { darkObserver?.disconnect() })

// View state (local, not in vuex — this is read-only viewer)
const viewBox = ref({ x: 0, y: 0, w: 1, h: 1 })
const scale = computed(() => viewBox.value.w)
const viewBoxString = computed(() => {
  const vb = viewBox.value
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`
})
const zoomPercent = computed(() => Math.round(1 / viewBox.value.w * 100))

// Rotation state
const rotation = ref(0)
const rotationTransform = computed(() =>
  `translate(0.5, 0.5) rotate(${rotation.value}) translate(-0.5, -0.5)`
)

function rotateView() {
  rotation.value = (rotation.value + 90) % 360
}

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

// Filter state
const showFilters = ref(false)
const filterGrades = ref(new Set())
const filterSetters = ref(new Set())
const filterWalls = ref(new Set())

const allProblems = computed(() => Object.values(problems.value))

const availableGrades = computed(() => {
  const grades = new Set()
  allProblems.value.forEach(p => {
    const name = p.grade?.name || p.gradeName || ''
    if (name) grades.add(p.routetype === 'boulder' ? name.toUpperCase() : name)
  })
  return [...grades].sort()
})

const availableSetters = computed(() => {
  const setters = new Set()
  allProblems.value.forEach(p => {
    if (p.author) {
      const name = p.author.nick || `${p.author.etunimi || ''} ${p.author.sukunimi || ''}`.trim()
      if (name) setters.add(name)
    }
  })
  return [...setters].sort()
})

const availableWallNames = computed(() => {
  const names = new Set()
  mappedWalls.value.forEach(w => {
    const name = w.wallchar || w.walldesc || ''
    if (name) names.add(name)
  })
  return [...names].sort()
})

const activeFilterCount = computed(() =>
  filterGrades.value.size + filterSetters.value.size + filterWalls.value.size
)

const filterRefs = { grades: filterGrades, setters: filterSetters, walls: filterWalls }
function toggleFilter(filterName, value) {
  const filterRef = filterRefs[filterName]
  const next = new Set(filterRef.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  filterRef.value = next
}

function clearFilters() {
  filterGrades.value = new Set()
  filterSetters.value = new Set()
  filterWalls.value = new Set()
}

function problemMatchesFilters(p) {
  if (filterGrades.value.size > 0) {
    const name = p.grade?.name || p.gradeName || ''
    const display = p.routetype === 'boulder' ? name.toUpperCase() : name
    if (!filterGrades.value.has(display)) return false
  }
  if (filterSetters.value.size > 0) {
    const name = p.author
      ? (p.author.nick || `${p.author.etunimi || ''} ${p.author.sukunimi || ''}`.trim())
      : ''
    if (!filterSetters.value.has(name)) return false
  }
  if (filterWalls.value.size > 0) {
    // Wall filter checked at wall level in getWallProblems
  }
  return true
}

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
  if (filterWalls.value.size > 0) {
    const wallName = wall.wallchar || wall.walldesc || ''
    if (!filterWalls.value.has(wallName)) return []
  }
  const center = wallCenter(wall)
  const allWallProbs = Object.values(problems.value).filter(p => String(p.wallid) === String(wall.id))
  const probs = allWallProbs.filter(p => problemMatchesFilters(p))
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
    const wallObj = wall
    return {
      ...p,
      cx,
      cy,
      color: getColor(p),
      gradeName: p.grade?.name || p.gradeName || '',
      wallName: wallObj.wallchar || wallObj.walldesc || '',
    }
  })
}

function shortTag(tag) {
  if (!tag) return ''
  return tag.length > 7 ? tag.slice(7) : tag
}

function displayGrade(p) {
  const name = p.gradeName || ''
  return p.routetype === 'boulder' ? name.toUpperCase() : name
}

function setterName(p) {
  if (!p.author) return ''
  if (p.author.nick) {
    return p.author.nick
  }
  const first = p.author.etunimi || ''
  const last = p.author.sukunimi || ''
  return `${first} ${last}`.trim()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function likeCount(p) {
  return p.likeCount || p.c_like || 0
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
function navigateHome() {
  const router = props.f7router || f7.views.main.router
  router.back()
}

// Track pan to prevent problem tap during drag
const didPan = ref(false)

// Selected problem state
const selectedProblem = ref(null)
const popupPos = ref(null)

function svgToScreen(svgX, svgY) {
  const svg = svgRef.value
  if (!svg) return { x: 0, y: 0 }
  const pt = svg.createSVGPoint()
  // Apply the rotation transform to get actual SVG coords
  const rad = rotation.value * Math.PI / 180
  const cos = Math.cos(rad), sin = Math.sin(rad)
  const cx = svgX - 0.5, cy = svgY - 0.5
  pt.x = cos * cx - sin * cy + 0.5
  pt.y = sin * cx + cos * cy + 0.5
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const screenPt = pt.matrixTransform(ctm)
  return { x: screenPt.x, y: screenPt.y }
}

function updatePopupPos() {
  if (!selectedProblem.value) { popupPos.value = null; return }
  const p = selectedProblem.value
  const screen = svgToScreen(p.cx, p.cy)
  const container = containerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  popupPos.value = {
    x: screen.x - rect.left,
    y: screen.y - rect.top - 20, // above the dot
  }
}

function onProblemTap(p) {
  if (didPan.value) return
  if (selectedProblem.value && selectedProblem.value.id === p.id) {
    // Already selected — deselect
    selectedProblem.value = null
    popupPos.value = null
    return
  }
  selectedProblem.value = p
  nextTick(updatePopupPos)
}

function openProblemDetails() {
  if (!selectedProblem.value) return
  const p = selectedProblem.value
  selectedProblem.value = null
  popupPos.value = null
  const router = props.f7router || f7.views.main.router
  router.navigate('/problem/' + p.id + '/popup', { props: { problem: p } })
}

function dismissPopup() {
  if (selectedProblem.value) {
    selectedProblem.value = null
    popupPos.value = null
  }
  showFilters.value = false
}

// Update popup position when view changes
watch([viewBox, rotation], () => { updatePopupPos() })

function resetView() {
  viewBox.value = { x: 0, y: 0, w: 1, h: 1 }
  rotation.value = 0
}

function onZoomSlider(event) {
  const pct = parseInt(event.target.value)
  const newW = Math.max(0.02, Math.min(20, 1 / (pct / 100)))
  const vb = viewBox.value
  // Zoom centred on current view centre
  const cx = vb.x + vb.w / 2
  const cy = vb.y + vb.h / 2
  viewBox.value = {
    x: cx - newW / 2,
    y: cy - newW / 2,
    w: newW,
    h: newW,
  }
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
    dismissPopup()
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
    dismissPopup()
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
.gym-map-container {
  position: absolute;
  top: calc(var(--f7-navbar-height) + var(--f7-safe-area-top));
  left: 0;
  right: 0;
  bottom: calc(var(--f7-toolbar-height) + var(--f7-safe-area-bottom));
  background: #f1f5f9;
  touch-action: none;
  overflow: hidden;
}

.gym-map-container.gym-map-dark {
  background: #0f1526;
}

.gym-map-btn {
  position: absolute;
  top: 12px;
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

.gym-map-zoom-row {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.gym-map-zoom-slider {
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.gym-map-zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.gym-map-zoom-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  border: none;
  cursor: pointer;
}

.gym-map-badge {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  pointer-events: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  white-space: nowrap;
}

.gym-map-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.gym-map-popup {
  position: absolute;
  transform: translate(-50%, -100%);
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  z-index: 20;
  min-width: 180px;
  max-width: 240px;
}

.gym-map-popup-dark {
  background: #1e293b;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.gym-map-popup-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.4;
}

.gym-map-popup-table td {
  padding: 2px 0;
  vertical-align: top;
}

.gym-map-popup-label {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  padding-right: 10px;
  text-align: left;
}

.gym-map-popup-dark .gym-map-popup-label {
  color: #64748b;
}

.gym-map-popup-value {
  color: #1e293b;
  font-size: 13px;
  text-align: left;
}

.gym-map-popup-dark .gym-map-popup-value {
  color: #e2e8f0;
}

.gym-map-popup-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  vertical-align: middle;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.gym-map-popup-dark .gym-map-popup-color {
  border-color: rgba(255, 255, 255, 0.15);
}

.gym-map-popup-removal {
  color: #ef4444;
}

.gym-map-popup-dark .gym-map-popup-removal {
  color: #f87171;
}

.gym-map-popup-btn {
  margin-top: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.gym-map-popup-btn:active {
  background: #2563eb;
}

.gym-map-filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0 4px;
}

.gym-map-filter-panel {
  position: absolute;
  top: 56px;
  left: 12px;
  right: 12px;
  max-height: 60%;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
  z-index: 30;
}

.gym-map-filter-panel-dark {
  background: #1e293b;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.gym-map-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.gym-map-filter-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.gym-map-filter-panel-dark .gym-map-filter-title {
  color: #e2e8f0;
}

.gym-map-filter-clear {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
}

.gym-map-filter-section {
  margin-bottom: 10px;
}

.gym-map-filter-section:last-child {
  margin-bottom: 0;
}

.gym-map-filter-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gym-map-filter-panel-dark .gym-map-filter-label {
  color: #64748b;
}

.gym-map-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gym-map-chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid transparent;
  user-select: none;
  white-space: nowrap;
}

.gym-map-chip.gym-map-chip-dark {
  background: #334155;
  color: #cbd5e1;
}

.gym-map-chip.gym-map-chip-active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.gym-map-chip.gym-map-chip-active.gym-map-chip-dark {
  background: #3b82f6;
  color: #fff;
}
</style>
