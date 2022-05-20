<template>
  <f7-panel
    left
    v-model:opened="sidePanelOpen"
    @panel:close="store.dispatch('setSidePanel', false)"
  >
    <f7-view>
      <f7-page>
        <f7-block>Problemator menu</f7-block>
        <f7-list menu-list>
          <f7-list-item
            link
            title="Home"
            :selected="selectedItem === 'home'"
            @click="() => store.dispatch('setSelectedLeftPanelItem', 'home')"
          >
            <template #media>
              <f7-icon md="material:home" aurora="f7:house_fill" ios="f7:house_fill" />
            </template>
          </f7-list-item>
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
          <f7-list-item
            link
            title="Settings"
            :selected="selectedItem === 'settings'"
            @click="() => store.dispatch('setSelectedLeftPanelItem', 'settings')"
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
import { f7, useStore } from 'framework7-vue'
import store from '@/js/store.js'

const { t } = useI18n()
const {
  idTokenClaims,
  getAccessTokenSilently,
  loginWithRedirect,
  logout,
  user,
} = useAuth0()

const doLogout = () => {
  store.dispatch('setSelectedLeftPanelItem', 'logout')
  store.dispatch('isAuthenticated', false)
  logout()
}
const sidePanelOpen = useStore('sidePanelOpen')
const selectedItem = useStore('selectedLeftPanelItem')
</script>

<style></style>
