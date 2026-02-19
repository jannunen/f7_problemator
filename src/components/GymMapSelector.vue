<template>
  <div class="gym-map-selector" ref="mapContainer"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useStore } from 'vuex'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const props = defineProps({
  gyms: { type: Array, default: () => [] },
})
const emit = defineEmits(['select'])
const store = useStore()

const mapContainer = ref(null)
let map = null
let markers = []

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '...'

function clearMarkers() {
  markers.forEach((m) => m.remove())
  markers = []
}

function addMarkers() {
  if (!map) return
  clearMarkers()

  const bounds = new mapboxgl.LngLatBounds()
  let hasValidCoords = false

  props.gyms.forEach((gym) => {
    const lat = parseFloat(gym.latitude)
    const lng = parseFloat(gym.longitude)
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return

    hasValidCoords = true
    bounds.extend([lng, lat])

    const isActive = String(gym.id) === String(store.state.gymid)

    const el = document.createElement('div')
    el.className = 'gym-marker' + (isActive ? ' gym-marker--active' : '')

    const locationParts = [gym.city, gym.country].filter(Boolean).map(escapeHtml)
    const descrText = gym.descr ? escapeHtml(gym.descr.length > 80 ? gym.descr.slice(0, 77) + '...' : gym.descr) : ''
    const websiteLink = gym.website ? `<a href="${escapeHtml(gym.website)}" target="_blank" rel="noopener" class="gym-popup-link">${escapeHtml(gym.website.replace(/^https?:\/\//, ''))}</a>` : ''

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '260px' }).setHTML(
      `<div class="gym-popup">
        <strong>${escapeHtml(gym.name)}</strong>
        ${locationParts.length ? `<div class="gym-popup-city">${locationParts.join(', ')}</div>` : ''}
        ${descrText ? `<div class="gym-popup-descr">${descrText}</div>` : ''}
        ${websiteLink ? `<div class="gym-popup-website">${websiteLink}</div>` : ''}
        <button class="gym-popup-btn" data-gym-id="${gym.id}">Select</button>
      </div>`
    )

    const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(map)

    popup.on('open', () => {
      const btn = document.querySelector(`.gym-popup-btn[data-gym-id="${gym.id}"]`)
      if (btn) {
        btn.addEventListener('click', () => {
          store.dispatch('changeGym', gym.id)
          emit('select', gym.id)
          popup.remove()
        })
      }
    })

    markers.push(marker)
  })

  if (hasValidCoords && markers.length > 1) {
    map.fitBounds(bounds, { padding: 50, maxZoom: 12 })
  } else if (hasValidCoords && markers.length === 1) {
    map.setCenter(bounds.getCenter())
    map.setZoom(10)
  }
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

onMounted(() => {
  mapboxgl.accessToken = MAPBOX_TOKEN

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [24.94, 60.17], // Helsinki default
    zoom: 14,
  })

  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  map.on('load', () => {
    if (props.gyms.length > 0) {
      addMarkers()
    }
  })
})

watch(
  () => props.gyms,
  () => {
    if (map && map.loaded()) {
      addMarkers()
    }
  }
)

onBeforeUnmount(() => {
  clearMarkers()
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.gym-map-selector {
  width: 100%;
  height: calc(100vh - 140px);
  border-radius: 10px;
  overflow: hidden;
}
</style>

<style>
.gym-marker {
  width: 16px;
  height: 16px;
  background: var(--p-accent, #4a90d9);
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s;
}
.gym-marker:hover {
  transform: scale(1.3);
}
.gym-marker--active {
  background: #34d399;
  width: 20px;
  height: 20px;
  border-width: 3px;
}
.gym-popup {
  text-align: center;
  padding: 4px 2px;
  color: #1a1a1a;
}
.gym-popup strong {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}
.gym-popup-city {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.gym-popup-descr {
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
  line-height: 1.3;
}
.gym-popup-website {
  margin-bottom: 6px;
}
.gym-popup-link {
  font-size: 11px;
  color: var(--p-accent, #4a90d9);
  text-decoration: none;
  word-break: break-all;
}
.gym-popup-btn {
  background: var(--p-accent, #4a90d9);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 16px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
}
.gym-popup-btn:hover {
  opacity: 0.85;
}
</style>
