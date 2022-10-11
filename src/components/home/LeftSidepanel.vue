<template>
  <f7-panel
    left
    v-model:opened="sidePanelOpen"
    @panel:close="store.commit('setSidePanel', false)"
  >
    <f7-view>
      <f7-page>
        <f7-block>Problemator menu</f7-block>
        <f7-list menu-list>
          <f7-list-item
            link
            title="Home"
            :selected="selectedItem === 'home'"
            @click="() => store.commit('setSelectedLeftPanelItem', 'home')"
          >
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
          <f7-list-item
            link
            title="Settings"
            :selected="selectedItem === 'settings'"
            @click="openSettings"
          >
            <template #media>
              <f7-icon
                md="material:settings"
                aurora="f7:gear_alt_fill"
                ios="f7:gear_alt_fill"
              />
            </template>
          </f7-list-item>
           <f7-list-item>
            Dark mode
            <f7-toggle v-model:checked="localDarkMode"></f7-toggle>
            <template #media>
              <f7-icon md="material:home" aurora="f7:house_fill" ios="f7:house_fill" />
            </template>
           </f7-list-item>
          <f7-list-item
            link
            title="Tick archive"
            :selected="selectedItem === 'archive'"
            @click="openArchive"
          >
            <template #media>
              <f7-icon
                md="material:calendar_month"
                aurora="f7:calendar_month"
                ios="f7:calendar_month"
              />
            </template>
          </f7-list-item>

          <f7-list-item
            link
            title="Logout"
            :selected="selectedItem === 'logout'"
            @click="doLogout"
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

        {{ t('global.join') }}
        <div class="flex flex-row gap-2">
          <a class="block" href="https://github.com/jannunen/f7_problemator.git">
            <i class="f7-icons">logo_github</i>
          </a>
        </div>
      </f7-page>
    </f7-view>
  </f7-panel>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useAuth0 } from '@auth0/auth0-vue'
import { useStore } from 'vuex'
import { f7  } from 'framework7-vue'
import { ref, watch, computed} from 'vue'
import $ from 'dom7'
const store = useStore()

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
  localStorage.setItem('dark',isDarkTheme.toString())
  const $html = $('html')
  $html.removeClass('theme-dark theme-light')
  if (isDarkTheme) {
    $html.addClass(`theme-dark`)
  } else {
    $html.addClass(`theme-light`)
  }
})


const doLogout = () => {
  store.commit('setSelectedLeftPanelItem', 'logout')
  store.commit('isAuthenticated', false)
  logout()
}
const sidePanelOpen = computed(() => store.state.sidePanelOpen)
const selectedItem = computed(() => store.state.selectedItem)

</script>

<style></style>
