<template>
  <f7-panel left v-model:opened="sidePanelOpen" @panel:close="store.commit('setSidePanel', false)">
    <f7-view>
      <show-tick-help :opened="showTickHelpDialog" />
      <show-tips :opened="showTipsDialog" @close="showTipsDialog=false" />
      <show-changelog :opened="showChangeLogDialog" @close="showChangeLogDialog=false" />
      <f7-page>
        <!-- Brand header -->
        <div class="flex flex-col items-center py-6 px-4">
          <img width="60" :src="logo" class="sidepanel-logo" />
          <h1 class="font-bold text-lg mt-2">Problemator</h1>
          <small class="p-text-muted">{{ version }}</small>
          <span class="text-xs font-semibold uppercase mt-1 p-text-dim sidepanel-tagline">{{ t('sidepanel.every_problem_counts') }}</span>
        </div>

        <div v-if="isAuthenticated" class="px-2">
          <!-- Nav items -->
          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'home' }" @click="() => store.commit('setSelectedLeftPanelItem', 'home')">
            <span class="material-icons p-nav-item__icon">home</span>
            <span class="p-nav-item__label">{{ t('sidepanel.home') }}</span>
          </button>

          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'feed' }" @click="openFeed">
            <span class="material-icons p-nav-item__icon">dynamic_feed</span>
            <span class="p-nav-item__label">{{ t('sidepanel.feed') }}</span>
          </button>

          <button v-if="hasGymMap" class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'gymmap' }" @click="openGymMap">
            <span class="material-icons p-nav-item__icon">map</span>
            <span class="p-nav-item__label">{{ t('sidepanel.open_map') }}</span>
          </button>

          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'settings' }" @click="openSettings">
            <span class="material-icons p-nav-item__icon">settings</span>
            <span class="p-nav-item__label">{{ t('sidepanel.settings') }}</span>
          </button>

          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'archive' }" @click="openArchive">
            <span class="material-icons p-nav-item__icon">calendar_month</span>
            <span class="p-nav-item__label">{{ t('sidepanel.tick_archive') }}</span>
          </button>

          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'import_ticks' }" @click="showTickHelpDialog=true">
            <span class="material-icons p-nav-item__icon">merge</span>
            <span class="p-nav-item__label">{{ t('sidepanel.import_ticks') }}</span>
          </button>

          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'tips' }" @click="showTipsDialog=true">
            <span class="material-icons p-nav-item__icon">lightbulb</span>
            <span class="p-nav-item__label">{{ t('sidepanel.tips') }}</span>
          </button>

          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'changelog' }" @click="showChangeLogDialog=true">
            <span class="material-icons p-nav-item__icon">list</span>
            <span class="p-nav-item__label">{{ t('sidepanel.roadmap_changes') }}</span>
          </button>

          <!-- Language selector -->
          <div class="p-nav-item" style="cursor: default;">
            <span class="material-icons p-nav-item__icon">language</span>
            <span class="p-nav-item__label">{{ t('sidepanel.language') }}</span>
            <select class="p-lang-select" v-model="currentLocale">
              <option v-for="(name, code) in localeNames" :key="code" :value="code">{{ name }}</option>
            </select>
          </div>

          <!-- Dark mode toggle -->
          <div class="p-nav-item" style="cursor: default;">
            <span class="material-icons p-nav-item__icon">dark_mode</span>
            <span class="p-nav-item__label">{{ t('sidepanel.dark_mode') }}</span>
            <label class="p-toggle">
              <input type="checkbox" v-model="localDarkMode" />
              <span class="p-toggle__track"></span>
            </label>
          </div>

          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'checkupdate' }" @click="doVersionCheck">
            <span class="material-icons p-nav-item__icon">refresh</span>
            <span class="p-nav-item__label">{{ t('sidepanel.check_update') }}</span>
            <span class="p-nav-item__badge">v{{ serverVersion }}</span>
          </button>

          <button class="p-nav-item" @click="doReloadApp">
            <span class="material-icons p-nav-item__icon">cleaning_services</span>
            <span class="p-nav-item__label">{{ t('sidepanel.reload_clear_cache') }}</span>
          </button>

          <div class="p-nav-item--divider"></div>

          <button class="p-nav-item" :class="{ 'p-nav-item--active': selectedItem === 'logout' }" @click="doLogout">
            <span class="material-icons p-nav-item__icon">logout</span>
            <span class="p-nav-item__label">{{ t('sidepanel.logout') }}</span>
          </button>
        </div>

        <div v-if="serverVersion != null && serverVersion != version" class="text-center px-4 mt-4">
          <div class="p-banner p-banner--info">
            <span class="material-icons p-banner__icon">system_update</span>
            <div class="p-banner__content">
              {{ t('sidepanel.new_version', { version: serverVersion }) }}
              <button @click="updateVersion" class="p-btn p-btn--primary p-btn--sm mt-2">{{ t('sidepanel.update_now') }}</button>
            </div>
          </div>
        </div>

        <div class="flex flex-col px-4 mt-6 text-center">
          <div class="text-xs p-text-dim">
            {{ t('sidepanel.user_id') }}: {{ climber?.id || 'N/A'}}<br />
            {{ t('sidepanel.gym_id') }}: {{ gym?.id || 'N/A'}}
          </div>
        </div>
      </f7-page>
    </f7-view>
  </f7-panel>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { f7 } from 'framework7-vue'
import { ref, watch, computed } from 'vue'
import ShowTickHelp from '@components/home/ShowTickHelp.vue'
import ShowTips from '@components/home/ShowTips.vue'
import ShowChangelog from '@components/home/ShowChangelog.vue'
import $ from 'dom7'
import logo from '../../assets/images/logo.png'
const store = useStore()
const showTickHelpDialog = ref(false)
const showTipsDialog = ref(false)
const showChangeLogDialog = ref(false)

const gym = computed(() => store.state.gym)
const version = computed(() => store.state.version)
const climber = computed(() => store.state.climber)
const isAuthenticated = computed(() => store.state.isAuthenticated)
const serverVersion = computed(() => store.state.server_version)

const { t, locale } = useI18n()
const darkMode = localStorage.getItem('dark') === 'true'
const localDarkMode = ref(darkMode)

const localeNames = {
  en: 'English',
  fi: 'Suomi',
  es: 'Español',
  sv: 'Svenska',
  et: 'Eesti',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  ge: 'ქართული',
  fr: 'Français',
  no: 'Norsk',
  de: 'Deutsch',
  it: 'Italiano',
  pl: 'Polski',
}

const currentLocale = ref(locale.value)

watch(currentLocale, (newLocale) => {
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
})

const walls = computed(() => store.state.walls || [])
const hasGymMap = computed(() => walls.value.some(w => w.shape_data && w.shape_data.length > 0))

const openFeed = () => {
  store.commit('setSelectedLeftPanelItem', 'feed')
  store.commit('setSidePanel', false)
  f7.views.main.router.navigate("/feed")
}
const openGymMap = () => {
  store.commit('setSelectedLeftPanelItem', 'gymmap')
  store.commit('setSidePanel', false)
  f7.views.main.router.navigate("/gym-map", { ignoreCache: true, force: true })
}
const openSettings = () => {
  store.commit('setSelectedLeftPanelItem', 'settings')
  store.commit('setSidePanel', false)
  f7.views.main.router.navigate("/settings")
}
const openArchive = () => {
  store.commit('setSelectedLeftPanelItem', 'archive')
  store.commit('setSidePanel', false)
  f7.views.main.router.navigate("/archive")
}
const updateVersion = () => {
  window.location.reload()
}
// Handles changing the dark/light theme. Seems a bit kludge, because it is.
watch(localDarkMode, (isDarkTheme, oldValue) => {
  const self = this
  //store.dispatch('setDark', isDarkTheme)
  localStorage.setItem('dark', isDarkTheme.toString())
  const $html = $('html')
  $html.removeClass('theme-dark theme-light')
  if (isDarkTheme) {
    $html.addClass(`theme-dark`)
  } else {
    $html.addClass(`theme-light`)
  }
})


const doVersionCheck = () => {
  store.dispatch('version')
}
const doReloadApp = async () => {
  store.commit('setSidePanel', false)
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const reg of registrations) {
      await reg.unregister()
    }
  }
  // Clear all caches
  if ('caches' in window) {
    const keys = await caches.keys()
    for (const key of keys) {
      await caches.delete(key)
    }
  }
  // Hard reload
  window.location.reload(true)
}
const doLogout = () => {
  store.commit('setSidePanel', false)
  store.dispatch('logout')
}
const sidePanelOpen = computed(() => store.state.sidePanelOpen)
const selectedItem = computed(() => store.state.selectedItem)

</script>
<style scoped>
.sidepanel-logo {
  border-radius: 50%;
  border: 2px solid rgba(var(--p-accent-rgb), 0.2);
}
.sidepanel-tagline {
  letter-spacing: 0.06em;
}
.p-lang-select {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(var(--p-accent-rgb), 0.2);
  background: transparent;
  color: inherit;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
</style>
