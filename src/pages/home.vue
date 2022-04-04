<script setup>
import TodayHeader from '@components/home/TodayHeader.vue'
import SearchProblemsSheetVue from '@components/ui/problem/SearchProblemsSheet.vue'
import FloorMapBlock from '@components/home/FloorMapBlock.vue'
import GymSelector from '@components/GymSelector.vue'
import MyLogs from '@components/home/MyLogs.vue'
import BadgeGymStats  from '@components/home/BadgeGymStats.vue'
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
const gym = useStore('gym')
const gymid = useStore('gymid')
const localDark = ref(true)
const isOpened = ref(false)
const { t } = useI18n()
const props = defineProps({
  f7router: Object,
})
watch(gym,(newValue,oldValue) => {
  if (newValue != null && oldValue != null && newValue.id != oldValue.id) {
    toaster('The gym has been changed!')
  }
})
const profileLoaded = useStore('profileLoaded')
const gymSelectorOpen = ref(false)


console.log("home gymid",gymid.value)
if (gymid.value == null || gymid.value == "" || isNaN(gymid.value)) {
  gymSelectorOpen.value = true
}
watch(gymid,(newValue, oldValue) => {
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
    props: { problem }
  })
}

console.log('store -> getProfile')
store.dispatch('getProfile')

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
  <f7-page name="home">
    <f7-navbar title="Home">
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
      <my-logs  :show-selector="true" />

      <div class="m-4 grid grid-cols-2 gap-2" v-if="profile">
        <badge-groups />
        <badge-competitions />
        <badge-ranking />

      </div>
    </div>
    <div v-else class="text-center mt-20">
      <f7-preloader class="my-2"></f7-preloader>
      <br />
      Loading ...
     </div>

    <f7-sheet class="choose_gym_sheet" :opened="gymSelectorOpen" @sheet:closed="gymSelectorOpen= false">
        <f7-page-content>
          <f7-block>
            <h1 class="text-2xl font-bold text-center">{{ t('home.gym_not_selected') }}</h1>
            <p class="my-3">{{ t('home.gym_selection_info') }}</p>
            <gym-selector />
          </f7-block>
        </f7-page-content>
    </f7-sheet>



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
