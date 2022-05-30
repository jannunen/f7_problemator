<template>
  <f7-page name="home">
    <f7-navbar>
      <f7-nav-left>
      </f7-nav-left>
      <f7-nav-title>Problemator</f7-nav-title>
      <f7-nav-right>
        <f7-link @click.prevent="store.dispatch('setSidePanel', true)">
            <f7-icon
                md="material:menu"
                aurora="f7:menu"
                ios="f7:menu"
              />
        </f7-link>
      </f7-nav-right>
    </f7-navbar>
  <left-sidepanel></left-sidepanel>
    <!-- Page content -->
    <div v-if="profileLoaded">
      <gym-selector />
      <badge-gym-stats :gym="gym" />
      <TodayHeader :profile="profile" @addtick="onAddTick" />
      <floor-map-block />
      <competitions-badge />
      <my-logs :show-selector="true" />

      <div class="m-4 grid grid-cols-2 gap-2" v-if="profile">
        <badge-groups />
        <badge-competitions />
        <badge-ranking />
      </div>
    </div>
    <div v-else class="text-center mt-20">
      <!-- If profile is not yet loaded -->
      <!-- If should show preloader, show only if gym IS selected -->
      <div v-if="accessToken != null">
        <div v-if="!gymSelectorOpen">
          Profile not loaded<br />
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
      <div v-else class="flex flex-col justify-center">
           
          <h1 class="text-3xl text-white font-bold">Problemator</h1>
          <!--<img class="w-3/5 mx-auto" src="images/problemator_logo_new.png" alt="metacritic" />-->
          <p>
            You are not logged in, please click the login or register button below
          </p>
          <f7-button
            class="btn-primary"
            @click="loginWithRedirect()"
            >{{ t('Login') }}</f7-button >
          <f7-button
            class="my-2 mx-12 uppercase block text-center button py-2 h-12 px-4 dark:bg-sky-500 bg-green-500 text-white"
            @click="loginWithRedirect()"
            >{{ t('Register') }}</f7-button >

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
        @close="onSearchSheetClosed"
        @start-navigate="onStartNavigate"
      />
    </f7-sheet>
  </f7-page>
</template>
<script setup>
import TodayHeader from '@components/home/TodayHeader.vue'
import SearchProblemsSheetVue from '@components/ui/problem/SearchProblemsSheet.vue'
import FloorMapBlock from '@components/home/FloorMapBlock.vue'
import GymSelector from '@components/GymSelector.vue'
import MyLogs from '@components/home/MyLogs.vue'
import CompetitionsBadge from '@components/comps/CompetitionsBadge.vue'
import BadgeGymStats from '@components/home/BadgeGymStats.vue'
import LeftSidepanel from '@components/home/LeftSidepanel.vue'
import { useAuth0 } from '@auth0/auth0-vue'
import $ from 'dom7'
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
import { f7, useStore } from 'framework7-vue'
import { watch } from 'vue'
import { ref } from 'vue'
import store from '../js/store.js'
const profile = useStore('profile')
const accessToken = useStore('access_token')
const sidePanelOpen = useStore('sidePanelOpen')
const gym = useStore('gym')
const gymid = useStore('gymid')
const isOpened = ref(false)
const initializing = useStore('initializing')
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
const onSearchSheetClosed = () => {
  isOpened.value = false
}


console.log('home gymid', gymid.value)
if (gymid.value == null || gymid.value == '' || isNaN(gymid.value)) {
  gymSelectorOpen.value = true
}
watch(gymid, (newValue, oldValue) => {
  if (!isNaN(newValue)) {
    gymSelectorOpen.value = false
  }
})
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

</script>
