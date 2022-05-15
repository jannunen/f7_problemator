<script setup>
import TodayHeader from '@components/home/TodayHeader.vue'
import SearchProblemsSheetVue from '@components/ui/problem/SearchProblemsSheet.vue'
import FloorMapBlock from '@components/home/FloorMapBlock.vue'
import GymSelector from '@components/GymSelector.vue'
import MyLogs from '@components/home/MyLogs.vue'
import BadgeGymStats from '@components/home/BadgeGymStats.vue'
import { useAuth0 } from '@auth0/auth0-vue'
const {
  idTokenClaims,
  getAccessTokenSilently,
  loginWithRedirect,
  logout,
  user,
} = useAuth0()
import { toaster } from '@helpers/notifications.js'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import $ from 'dom7'
import { f7, useStore } from 'framework7-vue'
import { watch } from 'vue'
import { ref } from 'vue'
import store from '../js/store.js'
const dark = useStore('dark')
const profile = useStore('profile')
const accessToken = useStore('access_token')
const sidePanelOpen = useStore('sidePanelOpen')
const selectedItem = useStore('selectedLeftPanelItem')
const gym = useStore('gym')
const gymid = useStore('gymid')
const localDark = ref(true)
const isOpened = ref(false)
const { t } = useI18n()
const props = defineProps({
  f7router: Object,
})
watch(gym, (newValue, oldValue) => {
  if (newValue != null && oldValue != null && newValue.id != oldValue.id) {
    toaster('The gym has been changed!')
  }
})
const profileLoaded = useStore('profileLoaded')
const isAuthenticated = useStore('isAuthenticated')
const gymSelectorOpen = ref(false)


console.log('home gymid', gymid.value)
if (gymid.value == null || gymid.value == '' || isNaN(gymid.value)) {
  gymSelectorOpen.value = true
}
watch(gymid, (newValue, oldValue) => {
  if (!isNaN(newValue)) {
    gymSelectorOpen.value = false
  }
})
const toggleDark = (newValue) => {
  const nowChecked = newValue.target.checked
  store.dispatch('setDark', nowChecked)
}
const onAddTick = () => {
  isOpened.value = true
}
const onStartNavigate = (problem) => {
  isOpened.value = false
  props.f7router.navigate('/problem/' + problem.id + '/popup', {
    props: { problem },
  })
}

onMounted(() => {
  // wait for auth and then load profile
  watch(isAuthenticated, (newValue, oldValue) => {
    store.dispatch('getProfile', { user })
  })
})

// Handles changing the dark/light theme. Seems a bit kludge, because it is.
watch(dark, (isDarkTheme, oldValue) => {
  const self = this
  const $html = $('html')
  $html.removeClass('theme-dark theme-light')
  if (isDarkTheme) {
    $html.addClass(`theme-dark`)
  } else {
    $html.addClass(`theme-light`)
  }
})
</script>

<template>
  <f7-panel left v-model:opened="sidePanelOpen">
    <f7-view>
      <f7-page>
        <f7-block>Problemator menu</f7-block>
        <f7-list menu-list>
          <f7-list-item
            link
            title="Home"
            :selected="selectedItem === 'home'"
            @click="() => (store.dispatch('setSelectedLeftPanelItem','home'))"
          >
            <template #media>
              <f7-icon md="material:home" aurora="f7:house_fill" ios="f7:house_fill" />
            </template>
          </f7-list-item>
          <f7-list-item
            link
            title="Profile"
            :selected="selectedItem === 'profile'"
            @click="() => (store.dispatch('setSelectedLeftPanelItem','profile'))"
          >
            <template #media>
              <f7-icon
                md="material:person"
                aurora="f7:person_fill"
                ios="f7:person_fill"
              />
            </template>
          </f7-list-item>
          <f7-list-item
            link
            title="Settings"
            :selected="selectedItem === 'settings'"
            @click="() => (store.dispatch('setSelectedLeftPanelItem','settings'))"
          >
            <template #media>
              <f7-icon
                md="material:settings"
                aurora="f7:gear_alt_fill"
                ios="f7:gear_alt_fill"
              />
            </template>
          </f7-list-item>
          <f7-list-item
            link
            title="Logout"
            :selected="selectedItem === 'logout'"
            @click="() => {store.dispatch('setSelectedLeftPanelItem','logout');logout()}"
          >
            <template #media>
              <f7-icon
                md="material:logout"
                aurora="f7:square_arrow_left"
                ios="f7:square_arrow_left"
              />
            </template>
          </f7-list-item>

        </f7-list>
      </f7-page>
    </f7-view>
  </f7-panel>
  <f7-page name="home">
    <f7-navbar>
      <f7-nav-left>
        <f7-link @click.prevent="store.dispatch('setSidePanel', true)">Menu</f7-link>
      </f7-nav-left>
      <f7-nav-title>Problemator</f7-nav-title>
      <f7-nav-right>
        <f7-toggle :checked="localDark" @change="toggleDark" />
      </f7-nav-right>
    </f7-navbar>
    <!-- Page content -->
    <div v-if="profileLoaded">
      <gym-selector />
      <badge-gym-stats :gym="gym" />
      <TodayHeader :profile="profile" @addtick="onAddTick" />
      <floor-map-block />
      <my-logs :show-selector="true" />

      <div class="m-4 grid grid-cols-2 gap-2" v-if="profile">
        <badge-groups />
        <badge-competitions />
        <badge-ranking />
      </div>
    </div>
    <div v-else class="text-center mt-20">
      <!-- If should show preloader, show only if gym IS selected -->
      <div v-if="accessToken != null">
        <div v-if="!gymSelectorOpen">
          <f7-preloader class="my-2"></f7-preloader>
          <br />
          Loading ...
        </div>
        <div v-else>
          <f7-block>
            <h1 class="text-2xl font-bold text-center">
              {{ t('home.gym_not_selected') }}
            </h1>
            <p class="my-3">{{ t('home.gym_selection_info') }}</p>
            <gym-selector />
          </f7-block>
        </div>
      </div>
      <div v-else>
        You are not logged in, login
        <f7-button
          class="my-2 mx-2 uppercase block text-center button py-2 h-12 px-4 dark:bg-sky-500 bg-green-500 text-white"
          @click="loginWithRedirect()"
          >{{ t('Login') }}</f7-button
        >
      </div>
    </div>

    <f7-sheet
      v-model:opened="isOpened"
      style="height: auto"
      close-on-escape
      close-by-outside-click
      swipe-to-close
      @sheet:closed="isOpened = false"
    >
      <SearchProblemsSheetVue
        @close="isOpened = false"
        @start-navigate="onStartNavigate"
      />
    </f7-sheet>
  </f7-page>
</template>
