<template>
  <!-- Main Framework7 App component where we pass Framework7 params -->
  <f7-app name="Problemator" id="fi.problemator.v2" :routes="routes" theme="aurora"
  >
    <!-- initial page is specified in routes.js -->

    <f7-view 
    :push-state="true"
    :browser-history="true"
    :browser-history-root="historyRoot"
    main 
    ></f7-view>
  </f7-app>
</template>
<script>
import routes from './js/routes.js'
import { useI18n } from 'vue-i18n'
import { useAuth0 } from '@auth0/auth0-vue'
import {  watch, computed } from 'vue'
import { useStore } from 'vuex'
import $ from 'dom7'

export default {
  props: {
    f7router: Object,
  },
  setup() {
    const { t } = useI18n()
    const store = useStore()
    const allTime = computed(() => store.state.alltime)
    const profile = computed(() => store.state.profile)
    const historyRoot = import.meta.env.VITE_REDIRECT_URI
    const {
      getInstance,
      getAccessTokenSilently,
      loginWithRedirect,
      user,
      isAuthenticated,
    } = useAuth0()

    store.dispatch('version')
    // Save tip showing status in locaStorage.
    const tipShowStatus = JSON.parse(localStorage.getItem('tipShowStatus'))
    const access_token = computed(() => store.state.access_token)
    store.dispatch('tipShowStatus', tipShowStatus)
    store.commit('setInitializing', false)
    

    // Get app local version
    const version = import.meta.env.PACKAGE_VERSION
    store.commit('setVersion', version)
    getAccessTokenSilently()
      .then((token) => {
        store.commit('user', user.value)
        store.commit('setToken', token)
      })
      .catch((err) => {
        store.commit('setReady',true)
        console.log("err in auth0",err)
      })

    const isDark = localStorage.getItem('dark')
    if (isDark != 'false') {
      const $html = $('html')
      $html.removeClass('theme-dark theme-light')
      $html.addClass(`theme-dark`)
    }

    watch(access_token, async (newValue, oldValue) => {
      if (newValue != null && newValue != "") {
        if (profile.value.settings == null) {
          console.log('Loading profile')
          await store.dispatch('getProfile')
        }
        if (allTime.value.ticks.length == 0 && allTime.value.tries.length == 0) {
          console.log('Loading ticks')
          store.dispatch('loadAllTimeTicks')
        }
        store.commit('setReady', true)
      }
      store.commit('setInitializing', false)
    })

    return {
      t,
      store,
      routes,
      isAuthenticated,
      historyRoot,
      accessToken : access_token.value,
    }
  },
  data() {
    return {}
  },
}
</script>
