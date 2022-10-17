<template>
  <f7-panel left v-model:opened="sidePanelOpen" @panel:close="store.commit('setSidePanel', false)">
    <f7-view>
      <show-tick-help :opened="showTickHelpDialog" />
      <f7-page>
        <f7-block>Problemator menu</f7-block>
        <f7-list menu-list>
          <f7-list-item link title="Home" :selected="selectedItem === 'home'" @click="() => store.commit('setSelectedLeftPanelItem', 'home')">
            <template #media>
              <f7-icon md="material:home" aurora="f7:house_fill" ios="f7:house_fill" />
            </template>
          </f7-list-item>
          <!--
          <f7-list-item
            link
            title="Profile"
            :selected="selectedItem === 'profile'"
            @click="() => store.dispatch('setSelectedLeftPanelItem', 'profile')"
          >
            <template #media>
              <f7-icon
                md="material:person"
                aurora="f7:person_fill"
                ios="f7:person_fill"
              />
            </template>
          </f7-list-item>
          -->
          <f7-list-item link title="Settings" :selected="selectedItem === 'settings'" @click="openSettings">
            <template #media>
              <f7-icon md="material:settings" aurora="f7:gear_alt_fill" ios="f7:gear_alt_fill" />
            </template>
          </f7-list-item>
          <f7-list-item>
            Dark mode
            <f7-toggle v-model:checked="localDarkMode"></f7-toggle>
            <template #media>
              <f7-icon md="material:home" aurora="f7:house_fill" ios="f7:house_fill" />
            </template>
          </f7-list-item>
          <f7-list-item link title="Tick archive" :selected="selectedItem === 'archive'" @click="openArchive">
            <template #media>
              <f7-icon md="material:calendar_month" aurora="f7:calendar_month" ios="f7:calendar_month" />
            </template>
          </f7-list-item>
          <f7-list-item link title="Import ticks" :selected="selectedItem === 'import_ticks'" @click="showTickHelpDialog=true">
            <template #media>
              <f7-icon md="material:arrow_merge" aurora="f7:arrow_merge" ios="f7:arrow_merge" />
            </template>
          </f7-list-item>

          <f7-list-item link title="Logout" :selected="selectedItem === 'logout'" @click="doLogout">
            <template #media>
              <f7-icon md="material:logout" aurora="f7:square_arrow_left" ios="f7:square_arrow_left" />
            </template>
          </f7-list-item>
        </f7-list>

        <div class="mx-2">
          <div class="my-1 font-bold text-teal-100">
          User ID: {{ climber?.id }}<br />
          Gym ID: {{ gym?.id }}<br />
          Version: {{ version }}
          </div>
          <div v-if="serverVersion != version" class="text-center">
           New version available {{ serverVersion }}.<br /><p-button class="font-bold bg-green-600">Update now</p-button>
          </div>
          

            <div class="my-2">
            {{ t('sidepanel.join') }}
            <a class="block" href="https://github.com/jannunen/f7_problemator.git">
              <i class="fa fa-github">Open github</i>
            </a>
            </div>
          
          </div>
      </f7-page>
    </f7-view>
  </f7-panel>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useAuth0 } from '@auth0/auth0-vue'
import { useStore } from 'vuex'
import { f7 } from 'framework7-vue'
import { ref, watch, computed } from 'vue'
import ShowTickHelp from '@components/home/ShowTickHelp.vue'
import PButton from '@components/PButton.vue'
import $ from 'dom7'
const store = useStore()
const showTickHelpDialog = ref(false)
const gym = computed(() => store.state.gym)
const version = computed(() => store.state.version)
const climber = computed(() => store.state.climber)
const serverVersion = computed(() => store.state.server_version)

const { t } = useI18n()
const {
  idTokenClaims,
  getAccessTokenSilently,
  loginWithRedirect,
  logout,
  user,
} = useAuth0()
const darkMode = localStorage.getItem('dark') === 'true'
const localDarkMode = ref(darkMode)

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


const doLogout = () => {
  logout()
  localStorage.setItem('token', null)
  store.commit('setSidePanel', false)
  store.commit('setSelectedLeftPanelItem', 'logout')
  store.commit('isAuthenticated', false)
}
const sidePanelOpen = computed(() => store.state.sidePanelOpen)
const selectedItem = computed(() => store.state.selectedItem)

</script>

<style>

</style>
