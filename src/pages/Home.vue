<template>
  <f7-page name="home">
    <f7-navbar>
      <f7-nav-left> </f7-nav-left>
      <f7-nav-title>Problemator </f7-nav-title>
      <f7-nav-right>
        <div class="navbar-lang-btn" style="margin-right: 12px;">
          <span class="material-icons" style="font-size: 22px; line-height: 1;">language</span>
          <select class="navbar-lang-select" v-model="currentLocale">
            <option v-for="(name, code) in localeNames" :key="code" :value="code">{{ name }}</option>
          </select>
        </div>
        <f7-link @click.prevent="store.commit('setSidePanel', true)">
          <span class="material-icons" style="font-size: 28px; line-height: 1;">menu</span>
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <div>
      <div v-if="profileLoaded">
        <complete-profile-popup />
        <show-tick-help :opened="showTickHelpDialog" />
        <left-sidepanel />

        <!-- Version update banner -->
        <div v-if="serverVersion != null && serverVersion != version" class="px-4 mt-2">
          <div class="p-banner p-banner--info">
            <span class="material-icons p-banner__icon">system_update</span>
            <div class="p-banner__content">
              {{ t('home.new_version', { version: serverVersion }) }}
              <button @click="updateVersion" class="p-btn p-btn--primary p-btn--sm mt-2">{{ t('home.update_now') }}</button>
            </div>
          </div>
        </div>

        <!-- Gym selector always visible -->
        <div class="home-section">
          <gym-selector />
        </div>

        <!-- Empty state when no gym selected -->
        <div v-if="!gymid" class="px-4 mt-6 text-center">
          <span class="material-icons p-text-dim" style="font-size: 48px;">location_city</span>
          <h2 class="text-lg font-bold mt-2">{{ t('home.no_gym_selected') }}</h2>
          <p class="p-text-dim text-sm mt-1">{{ t('home.select_gym_prompt') }}</p>
        </div>

        <!-- All gym-dependent sections -->
        <template v-else>
          <!-- Section: Your session -->
          <div class="home-section">
            <TodayHeader :profile="profile" @addtick="onAddTick" />
            <div v-if="ticksLoaded && alltime.ticks.length == 0" class="px-4 mt-2">
              <div class="p-banner p-banner--warning">
                <span class="material-icons p-banner__icon p-text-warning">help_outline</span>
                <div class="p-banner__content">
                  {{ t('home.no_ticks_message') }}
                  <button
                    @click="showTickHelpDialog = true"
                    class="p-btn p-btn--sm mt-2"
                  >{{ t('home.help_me') }}</button>
                  <div class="text-xs mt-1 p-text-dim">
                    {{ t('home.no_ticks_hint') }}
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
            <my-badges />
            <grade-pyramid />
            <my-logs :show-selector="true" />
          </div>
        </template>

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
  </f7-page>
</template>
<script setup>
import TodayHeader from '@components/home/TodayHeader.vue'
import SearchProblemsSheetVue from '@components/ui/problem/SearchProblemsSheet.vue'
import GymSelector from '@components/GymSelector.vue'
import MyLogs from '@components/home/MyLogs.vue'
import CompetitionsBadge from '@components/comps/CompetitionsBadge.vue'
import BadgeGymStats from '@components/home/BadgeGymStats.vue'
import ExpiringProblemsAlert from '@components/ExpiringProblemsAlert.vue'
import LeftSidepanel from '@components/home/LeftSidepanel.vue'
import Ranking from '@components/home/Ranking.vue'
import GradePyramid from '@components/home/GradePyramid.vue'
import FloorMapBlock from '@components/ui/FloorMapBlock.vue'
import ShowLoginInstructions from '@components/home/ShowLoginInstructions.vue'
import ShowTickHelp from '@components/home/ShowTickHelp.vue'
import MyBadges from '@components/home/MyBadges.vue'
import CompleteProfilePopup from '@components/home/CompleteProfilePopup.vue'
import PButton from '@components/PButton.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
const store = useStore()
const showTickHelpDialog = ref(false)
const ready = computed(() => store.state.ready)
const profile = computed(() => store.state.profile)
const gym = computed(() => store.state.gym)
const gymid = computed(() => store.state.gymid)
const alltime = computed(() => store.state.alltime)
const ticksLoaded = computed(() => store.state.ticksLoaded)
const version = computed(() => store.state.version)
const serverVersion = computed(() => store.state.server_version)
const updateVersion = () => {
  window.location.reload(true)
}
const isOpened = ref(false)

const { t, locale } = useI18n()

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
watch(currentLocale, (val) => {
  locale.value = val
  localStorage.setItem('locale', val)
})
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
<style scoped>
.navbar-lang-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  cursor: pointer;
}
.navbar-lang-select {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  -webkit-appearance: none;
}
</style>
