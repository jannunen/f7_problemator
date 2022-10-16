<template>
  <f7-page name="home">
    <f7-navbar>
      <f7-nav-left>
      </f7-nav-left>
      <f7-nav-title>Problemator</f7-nav-title>
      <f7-nav-right>
        <f7-link @click.prevent="store.commit('setSidePanel', true)">
          <f7-icon md="material:menu" aurora="f7:menu" ios="f7:menu" />
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
    <div v-else class="text-center">
      <!-- If profile is not yet loaded -->
      <!-- If should show preloader, show only if gym IS selected -->
      <div v-if="accessToken != null">
        <div v-if="!profileLoaded">
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
        <!-- Show this only when not loading stuff... -->

        <div v-if="!initializing">
          <show-login-instructions />
        </div>
        <div v-else>
          Gearing up.
        </div>
      </div>
    </div>

    <f7-sheet v-model:opened="isOpened" style="height: auto" close-on-escape close-by-outside-click swipe-to-close @sheet:closed="isOpened = false">
      <SearchProblemsSheetVue @close="onSearchSheetClosed" @start-navigate="onStartNavigate" />
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
import ShowLoginInstructions from '@components/home/ShowLoginInstructions.vue'
import { toaster } from '@helpers/notifications.js'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'
import { ref } from 'vue'
import { useStore } from 'vuex'
const store = useStore()
const initializing = computed(() => store.state.initializing)
const profile = computed(() => store.state.profile)
const accessToken = computed(() => store.state.access_token)
const gym = computed(() => store.state.gym)
const gymid = computed(() => store.state.gymid)
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
const profileLoaded = computed(() => store.state.profileLoaded)
const gymSelectorOpen = ref(false)
const onSearchSheetClosed = () => {
  isOpened.value = false
}


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


</script>
