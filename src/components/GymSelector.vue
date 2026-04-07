<template>
  <div class="gym-selector">
    <f7-list class="m-0">
      <f7-list-item v-if="gyms.length == 0" title="Loading gyms...">
        <template #media>
          <span class="material-icons" style="color: var(--p-text-dim);">apartment</span>
        </template>
      </f7-list-item>
      <f7-list-item
        v-else
        :title="t('gymselector.active_gym')"
        :after="currentGymName"
        link="#"
        @click="popupOpened = true"
      >
        <template #media>
          <span class="material-icons" style="color: var(--p-accent);">apartment</span>
        </template>
      </f7-list-item>
    </f7-list>

    <f7-popup :opened="popupOpened" @popup:closed="popupOpened = false">
      <f7-page>
        <f7-navbar :title="t('gymselector.active_gym')">
          <template #right>
            <f7-link popup-close>{{ t('global.close_action') }}</f7-link>
          </template>
        </f7-navbar>

        <div class="gym-selector-tabs">
          <button
            class="gym-selector-tab"
            :class="{ 'gym-selector-tab--active': mode === 'map' }"
            @click="mode = 'map'"
          >
            <span class="material-icons" style="font-size: 16px;">map</span>
            {{ t('gymselector.map') }}
          </button>
          <button
            class="gym-selector-tab"
            :class="{ 'gym-selector-tab--active': mode === 'list' }"
            @click="mode = 'list'"
          >
            <span class="material-icons" style="font-size: 16px;">list</span>
            {{ t('gymselector.list') }}
          </button>
        </div>

        <div v-if="mode === 'map'" class="gym-map-container">
          <GymMapSelector
            v-if="popupOpened"
            :gyms="gyms"
            :user-location="userLocation"
            @select="onGymSelected"
          />
        </div>

        <div v-else class="gym-list-container">
          <f7-searchbar
            :disable-button-text="t('global.cancel')"
            :placeholder="t('gymselector.search_placeholder', 'Search gyms...')"
            :custom-search="true"
            @searchbar:search="onSearch"
            @searchbar:clear="searchQuery = ''"
          />
          <f7-list class="gym-list">
            <f7-list-item
              v-for="gym in filteredGyms"
              :key="gym.id"
              :title="gym.name"
              :after="gym.city || ''"
              :class="{ 'gym-list-item--active': String(gym.id) === String(gymid) }"
              link="#"
              @click="onGymSelected(gym.id)"
            />
          </f7-list>
        </div>
      </f7-page>
    </f7-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'
import GymMapSelector from './GymMapSelector.vue'

const { t } = useI18n()
const store = useStore()
const emit = defineEmits(['select'])

const popupOpened = ref(false)
const mode = ref('map')
const searchQuery = ref('')
const userLocation = ref(null)

const { data: gyms } = useQuery({
  queryKey: ['gyms'],
  queryFn: () => api.getGyms(),
  select: (data) => data.gyms,
  initialData: { gyms: [] },
})

const gymid = computed(() => store.state.gymid)

const currentGymName = computed(() => {
  if (!gymid.value || !gyms.value?.length) return ''
  const gym = gyms.value.find((g) => String(g.id) === String(gymid.value))
  return gym?.name || ''
})

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function gymDistance(gym) {
  if (!userLocation.value) return Infinity
  const lat = parseFloat(gym.latitude)
  const lng = parseFloat(gym.longitude)
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return Infinity
  return haversineDistance(userLocation.value.lat, userLocation.value.lng, lat, lng)
}

const sortedGyms = computed(() => {
  if (!userLocation.value) return gyms.value
  return [...gyms.value].sort((a, b) => gymDistance(a) - gymDistance(b))
})

const filteredGyms = computed(() => {
  const list = sortedGyms.value
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase()
  return list.filter(
    (g) =>
      g.name?.toLowerCase().includes(q) ||
      g.city?.toLowerCase().includes(q) ||
      g.country?.toLowerCase().includes(q)
  )
})

const onSearch = (_searchbar, query) => {
  searchQuery.value = query
}

// Get user location for sorting by distance
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    },
    () => {} // silently ignore if denied
  )
}

const onGymSelected = (id) => {
  store.dispatch('changeGym', id)
  emit('select', id)
  popupOpened.value = false
}
</script>

<style scoped>
.gym-selector :deep(.list) {
  --f7-list-bg-color: rgba(255, 255, 255, 0.04);
  --f7-list-item-border-color: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  margin: 0.5rem 1rem;
  overflow: hidden;
}
.gym-selector :deep(.item-title) {
  font-size: 0.85rem;
  color: var(--p-text-muted);
}
.gym-selector :deep(.item-after) {
  color: var(--p-text);
  font-weight: 600;
}
.gym-selector-tabs {
  display: flex;
  gap: 4px;
  margin: 12px 16px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 3px;
}
.gym-selector-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: var(--p-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.gym-selector-tab--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--p-text);
}
.gym-map-container {
  padding: 0 8px;
}
.gym-list-container :deep(.gym-list) {
  margin-top: 0;
}
.gym-list-container :deep(.gym-list-item--active) {
  background: rgba(52, 211, 153, 0.1);
}
.gym-list-container :deep(.gym-list-item--active .item-title) {
  color: #34d399;
  font-weight: 600;
}
</style>
