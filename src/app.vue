<template>
  <!-- Main Framework7 App component where we pass Framework7 params -->
  <f7-app name="Problemator" id="fi.problemator.v2" :routes="routes" theme="aurora"
  >
    <!-- initial page is specified in routes.js -->

    <f7-view 
    :push-state="useBrowserHistory"
    :browser-history="useBrowserHistory"
    :browser-history-root="historyRoot"
    main 
    ></f7-view>
  </f7-app>
</template>
<script>
import routes from './js/routes.js'
import { registerBackButton, setupChrome } from '@js/native.js'
import { useBrowserHistory } from '@js/platform.js'
import { useI18n } from 'vue-i18n'
import {  watch, computed } from 'vue'
import { useStore } from 'vuex'
import $ from 'dom7'
import { f7 } from 'framework7-vue'

export default {
  props: {
    f7router: Object,
  },
  setup() {
    const { t } = useI18n()
    const store = useStore()
    const allTime = computed(() => store.state.alltime)
    const profile = computed(() => store.state.profile)
    // Despite the name, VITE_REDIRECT_URI is not an auth redirect — auth is
    // OTP with a JWT in localStorage. It is Framework7's history root, and it
    // only means anything on the web.
    const historyRoot = import.meta.env.VITE_REDIRECT_URI
    const isAuthenticated = computed(() => store.state.isAuthenticated)

    store.dispatch('version')

    // No-ops on the web. On native: dismiss the splash, keep the status bar
    // from overlaying our header, and make Android's back button pop the
    // Framework7 stack instead of exiting the app.
    setupChrome()
    registerBackButton(f7)
    // Save tip showing status in localStorage.
    const tipShowStatus = JSON.parse(localStorage.getItem('tipShowStatus'))
    const access_token = computed(() => store.state.access_token)
    store.dispatch('tipShowStatus', tipShowStatus)
    store.commit('setInitializing', false)

    // Get app local version
    const version = import.meta.env.PACKAGE_VERSION
    store.commit('setVersion', version)

    const isDark = localStorage.getItem('dark')
    if (isDark != 'false') {
      const $html = $('html')
      $html.removeClass('theme-dark theme-light')
      $html.addClass(`theme-dark`)
    }

    // Set up watch BEFORE bootstrapping token so the watcher fires
    watch(access_token, async (newValue, oldValue) => {
      if (newValue != null && newValue != "" && newValue != "null") {
        try {
          if (profile.value.settings == null) {
            console.log('Loading profile')
            await store.dispatch('getProfile')
          }
          if (allTime.value.ticks.length == 0 && allTime.value.tries.length == 0) {
            console.log('Loading ticks')
            store.dispatch('loadAllTimeTicks')
          }
          store.commit('setReady', true)
        } catch (err) {
          console.warn('Session expired or invalid token, redirecting to login', err)
          store.dispatch('logout')
        }
      }
      store.commit('setInitializing', false)
    })

    // Bootstrap from localStorage token (after watch is registered)
    const existingToken = localStorage.getItem('token')
    if (existingToken && existingToken !== 'null') {
      store.commit('setToken', existingToken)
    } else {
      store.commit('setReady', true)
    }

    return {
      t,
      store,
      routes,
      isAuthenticated,
      historyRoot,
      useBrowserHistory,
      accessToken : access_token.value,
    }
  },
  data() {
    return {}
  },
}
</script>
