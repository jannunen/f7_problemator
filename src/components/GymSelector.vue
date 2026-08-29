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

        <div class="p-segmented gym-selector-tabs">
          <div
            class="p-segmented__indicator"
            :class="{ 'p-segmented__indicator--right': mode === 'list' }"
          ></div>
          <button
            class="p-segmented__btn"
            :class="{ 'p-segmented__btn--active': mode === 'map' }"
            @click="mode = 'map'"
          >
            <span class="material-icons" style="font-size: 16px;">map</span>
            {{ t('gymselector.map') }}
          </button>
          <button
            class="p-segmented__btn"
            :class="{ 'p-segmented__btn--active': mode === 'list' }"
            @click="mode = 'list'"
          >
            <span class="material-icons" style="font-size: 16px;">list</span>
            {{ t('gymselector.list') }}
          </button>
        </div>

        <!-- Asked for, never assumed. Firing getCurrentPosition on mount put
             the OS permission dialog in front of a climber who had not yet
             been told what it buys them, which reads as the app grabbing at
             something. Here the button says what it does before the system
             asks for anything. -->
        <div v-if="showLocatePrompt" class="gym-locate">
          <button class="gym-locate__btn" :disabled="locating" @click="locate">
            <span class="material-icons" style="font-size: 16px;">my_location</span>
            {{ locating
              ? t('gymselector.locating', 'Looking for your nearest gym\u2026')
              : t('gymselector.locate', 'Find my nearest gym') }}
          </button>
          <p class="gym-locate__why">
            {{ t('gymselector.locate_why', 'Checks where you are, on this device only, so the closest gym comes first. Your location is never stored or sent to us.') }}
          </p>
        </div>

        <!-- A refusal is a fine answer; say so once and get out of the way,
             rather than leaving a button that looks like it did nothing. -->
        <p v-else-if="locateError" class="gym-locate__error">{{ locateError }}</p>

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
import { ref, computed, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import GymMapSelector from './GymMapSelector.vue'

const { t } = useI18n()
const store = useStore()
const emit = defineEmits(['select'])

const popupOpened = ref(false)
const mode = ref('map')
const searchQuery = ref('')
const userLocation = ref(null)

const { data: gyms } = useQuery({
  ...queries.gyms(),
  select: (data) => data.gyms,
  // placeholderData, not initialData: initialData is cached AS the answer, so
  // with the gym list's long staleTime an empty list counted as a fresh,
  // correct result and the query never ran — the picker sat on "Loading
  // gyms..." forever. placeholderData is only what to show while finding out.
  placeholderData: { gyms: [] },
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

// Location sorts the gym list by distance and feeds the map. It is a
// convenience on top of a search box that already works, so it is opt-in.
const locating = ref(false)
const locateError = ref('')

const showLocatePrompt = computed(
  () => 'geolocation' in navigator && !userLocation.value && !locateError.value
)

function locate() {
  locating.value = true
  locateError.value = ''
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locating.value = false
      userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    },
    (err) => {
      locating.value = false
      locateError.value =
        err.code === err.PERMISSION_DENIED
          ? t('gymselector.locate_denied', 'Location is off for Problemator. Search for your gym by name instead.')
          : t('gymselector.locate_failed', 'Could not work out where you are. Search for your gym by name instead.')
    },
    // City-level accuracy is all a distance sort needs, and a stale fix
    // beats a fresh one that costs a GPS lock indoors. Without a timeout
    // the spinner can hang for the rest of the session.
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  )
}

const onGymSelected = async (id) => {
  // Close first, and let the close reach the DOM before anything reloads the
  // profile. changeGym flips profileLoaded to false synchronously, and any
  // ancestor that unmounts this component mid-close leaves Framework7's
  // backdrop and body scroll lock behind — destroy() does not close().
  popupOpened.value = false
  await nextTick()

  store.dispatch('changeGym', id)
  emit('select', id)
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
.gym-locate {
  margin: 0 16px 10px;
}
.gym-locate__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 9px 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--p-text);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.gym-locate__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}
.gym-locate__btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.gym-locate__why {
  margin: 6px 2px 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--p-text-dim);
}
.gym-locate__error {
  margin: 0 18px 10px;
  font-size: 0.75rem;
  color: var(--p-text-muted);
}
/* Placement only — .p-segmented supplies the control itself. */
.gym-selector-tabs {
  margin: 12px 16px 8px;
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
