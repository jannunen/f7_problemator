<template>
  <f7-page name="home" hide-toolbar-on-scroll>
    <f7-navbar>
      <f7-nav-left> </f7-nav-left>
      <f7-nav-title>Problemator </f7-nav-title>
      <f7-nav-right>
        <f7-link @click.prevent="store.commit('setSidePanel', true)">
          <f7-icon md="material:menu" aurora="f7:menu" ios="f7:menu" />
        </f7-link>
      </f7-nav-right>
    </f7-navbar>
    <f7-toolbar tabbar labels position="bottom">
      <f7-link
        tab-link="#tab-1"
        tab-link-active
        text="Home"
        icon-ios="f7:house"
        icon-aurora="f7:house"
        icon-md="material:house"
      ></f7-link>
      <f7-link
        @click="initFeedTab"
        tab-link="#tab-2"
        text="Feed"
        icon-ios="f7:list_dash"
        icon-aurora="f7:list_dash"
        icon-md="material:list_dash"
      ></f7-link>
    </f7-toolbar>

    <f7-tabs>
      <f7-tab id="tab-1" tab-active>
        <div v-if="profileLoaded">
          <PButton class="bg-red-500" @click="reloadPage">Reload app</PButton>
          <show-tick-help :opened="showTickHelpDialog" />
          <left-sidepanel />
          <!-- Page content -->
          <gym-selector />
          <TodayHeader :profile="profile" @addtick="onAddTick" />
          <floor-map-block />
          <expiring-problems-alert />
          <badge-gym-stats :gym="gym" />
          <competitions-badge />
          <ranking />
          <div class="px-2" v-if="ticksLoaded && alltime.ticks.length == 0">
            <div class="mt-8 m-4 rounded-md raised shadow-lg p-4 border border-gray-800">
              <div
                class="bg-red-600 border border-red-300 p-2 dark:text-black text-white"
              >
                It seems that you have no ticks, if you should have, click here for
                instructions.
                <p-button
                  @click="showTickHelpDialog = true"
                  class="text-sm bg-blue-400 py-1 px-4 border-white"
                  >Help me</p-button
                >
                Othewise this message will disappear after you start ticking problems. You
                can find this later from Settings-menu.
              </div>
            </div>
          </div>

          <my-logs :show-selector="true" />

          <!--
              <div class="m-4 grid grid-cols-2 gap-2" >
                <badge-groups />
                <badge-competitions />
                <badge-ranking />
              </div>
              -->
        </div>
        <div v-else class="text-center">
          <div v-if="!ready">
            <div class="p-4">
              <f7-preloader class="my-2"></f7-preloader>
              <br />
              Loading ...
            </div>
          </div>
          <div v-else>
            <show-login-instructions />
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
      </f7-tab>
      <f7-tab id="tab-2" @tab:show="initFeedTab">
        <feed-tab />
      </f7-tab>
    </f7-tabs>
  </f7-page>
</template>
<script setup>
import TodayHeader from '@components/home/TodayHeader.vue'
import SearchProblemsSheetVue from '@components/ui/problem/SearchProblemsSheet.vue'
import FeedTab from '@components/feed/FeedTab.vue'
import FloorMapBlock from '@components/home/FloorMapBlock.vue'
import GymSelector from '@components/GymSelector.vue'
import MyLogs from '@components/home/MyLogs.vue'
import CompetitionsBadge from '@components/comps/CompetitionsBadge.vue'
import BadgeGymStats from '@components/home/BadgeGymStats.vue'
import ExpiringProblemsAlert from '@components/ExpiringProblemsAlert.vue'
import LeftSidepanel from '@components/home/LeftSidepanel.vue'
import Ranking from '@components/home/Ranking.vue'
import ShowLoginInstructions from '@components/home/ShowLoginInstructions.vue'
import ShowTickHelp from '@components/home/ShowTickHelp.vue'
import PButton from '@components/PButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { useStore } from 'vuex'
const store = useStore()
const showTickHelpDialog = ref(false)
const ready = computed(() => store.state.ready)
const profile = computed(() => store.state.profile)
const gym = computed(() => store.state.gym)
const alltime = computed(() => store.state.alltime)
const ticksLoaded = computed(() => store.state.ticksLoaded)
const isOpened = ref(false)
const gymid = computed(() => store.state.gymid)
const initFeedTab = () => {
  store.dispatch('getFeed')
  store.dispatch('newProblems', gym.value.id)
}

const { t } = useI18n()
const props = defineProps({
  f7router: Object,
})
const reloadPage = () => {
  location.reload()
}
const profileLoaded = computed(() => store.state.profileLoaded)
const onSearchSheetClosed = () => {
  isOpened.value = false
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
</script>
