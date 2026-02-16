<template>
  <f7-page name="home" class="p-page-with-tabbar">
    <f7-navbar>
      <f7-nav-left> </f7-nav-left>
      <f7-nav-title>Problemator </f7-nav-title>
      <f7-nav-right>
        <f7-link @click.prevent="store.commit('setSidePanel', true)">
          <span class="material-icons p-tab-bar__icon">menu</span>
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <!-- Custom bottom tab bar -->
    <div class="p-tab-bar">
      <button
        class="p-tab-bar__item"
        :class="{ 'p-tab-bar__item--active': activeTab === 'home' }"
        @click="activeTab = 'home'"
      >
        <span class="material-icons p-tab-bar__icon">home</span>
        <span class="p-tab-bar__label">Home</span>
      </button>
      <button
        class="p-tab-bar__item"
        :class="{ 'p-tab-bar__item--active': activeTab === 'map' }"
        @click="activeTab = 'map'; navigateToGymMap()"
      >
        <span class="material-icons p-tab-bar__icon">map</span>
        <span class="p-tab-bar__label">Map</span>
      </button>
      <button
        class="p-tab-bar__item"
        :class="{ 'p-tab-bar__item--active': activeTab === 'feed' }"
        @click="activeTab = 'feed'; initFeedTab()"
      >
        <span class="material-icons p-tab-bar__icon">dynamic_feed</span>
        <span class="p-tab-bar__label">Feed</span>
      </button>
    </div>

    <!-- Tab content via v-show -->
    <div v-show="activeTab === 'home'">
      <div v-if="profileLoaded">
        <complete-profile-popup />
        <show-tick-help :opened="showTickHelpDialog" />
        <left-sidepanel />

        <!-- Section: Your session -->
        <div class="home-section">
          <gym-selector />
          <TodayHeader :profile="profile" @addtick="onAddTick" />
          <div v-if="ticksLoaded && alltime.ticks.length == 0" class="px-4 mt-2">
            <div class="p-banner p-banner--warning">
              <span class="material-icons p-banner__icon p-text-warning">help_outline</span>
              <div class="p-banner__content">
                It seems that you have no ticks. If you should have, click here for instructions.
                <button
                  @click="showTickHelpDialog = true"
                  class="p-btn p-btn--sm mt-2"
                >Help me</button>
                <div class="text-xs mt-1 p-text-dim">
                  Otherwise this message will disappear after you start ticking problems.
                  You can find this later from Settings-menu.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Gym overview -->
        <div class="home-section">
          <expiring-problems-alert />
          <floor-map-block :f7router="props.f7router" />
          <badge-gym-stats :gym="gym" />
        </div>

        <!-- Section: Community -->
        <div class="home-section">
          <competitions-badge />
          <ranking />
        </div>

        <!-- Section: Progress -->
        <div class="home-section">
          <my-logs :show-selector="true" />
        </div>

      </div>
      <div v-else>
        <div v-if="!ready" class="home-skeleton">
          <!-- Skeleton: gym selector -->
          <div class="home-skeleton__row mx-4 mt-3">
            <div class="p-skeleton" style="height: 2.75rem; border-radius: var(--p-radius);"></div>
          </div>
          <!-- Skeleton: today stats -->
          <div class="flex justify-center gap-6 mt-5 mb-4">
            <div class="flex flex-col items-center gap-2">
              <div class="p-skeleton p-skeleton--stat"></div>
              <div class="p-skeleton p-skeleton--text-sm" style="width: 3rem;"></div>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="p-skeleton p-skeleton--stat"></div>
              <div class="p-skeleton p-skeleton--text-sm" style="width: 3rem;"></div>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="p-skeleton p-skeleton--circle" style="width: 48px; height: 48px;"></div>
            </div>
          </div>
          <!-- Skeleton: map card -->
          <div class="mx-4 mb-3">
            <div class="p-skeleton p-skeleton--card"></div>
          </div>
          <!-- Skeleton: stats card -->
          <div class="mx-4 mb-3">
            <div class="p-skeleton p-skeleton--card" style="height: 5rem;"></div>
          </div>
          <!-- Skeleton: ranking card -->
          <div class="mx-4 mb-3">
            <div class="p-skeleton p-skeleton--chart"></div>
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
    </div>

    <div v-show="activeTab === 'feed'">
      <feed-tab />
    </div>
  </f7-page>
</template>
<script setup>
import TodayHeader from '@components/home/TodayHeader.vue'
import SearchProblemsSheetVue from '@components/ui/problem/SearchProblemsSheet.vue'
import FeedTab from '@components/feed/FeedTab.vue'
import GymSelector from '@components/GymSelector.vue'
import MyLogs from '@components/home/MyLogs.vue'
import CompetitionsBadge from '@components/comps/CompetitionsBadge.vue'
import BadgeGymStats from '@components/home/BadgeGymStats.vue'
import ExpiringProblemsAlert from '@components/ExpiringProblemsAlert.vue'
import LeftSidepanel from '@components/home/LeftSidepanel.vue'
import Ranking from '@components/home/Ranking.vue'
import FloorMapBlock from '@components/ui/FloorMapBlock.vue'
import ShowLoginInstructions from '@components/home/ShowLoginInstructions.vue'
import ShowTickHelp from '@components/home/ShowTickHelp.vue'
import CompleteProfilePopup from '@components/home/CompleteProfilePopup.vue'
import PButton from '@components/PButton.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { f7 } from 'framework7-vue'
const store = useStore()
const showTickHelpDialog = ref(false)
const ready = computed(() => store.state.ready)
const profile = computed(() => store.state.profile)
const gym = computed(() => store.state.gym)
const alltime = computed(() => store.state.alltime)
const ticksLoaded = computed(() => store.state.ticksLoaded)
const activeTab = ref('home')
const isOpened = ref(false)
const gymid = computed(() => store.state.gymid)
const navigateToGymMap = () => {
  f7.views.main.router.navigate('/gym-map', { ignoreCache: true, force: true })
}

const initFeedTab = () => {
  store.dispatch('getFeed')
  store.dispatch('newProblems', gym.value.id)
}

const { t } = useI18n()
const props = defineProps({
  f7router: Object,
})
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
