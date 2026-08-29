<template>
  <!-- Main Framework7 App component where we pass Framework7 params -->
  <f7-app
    name="Problemator"
    id="fi.problemator.v2"
    :routes="routes"
    theme="aurora"
  >
    <!-- initial page is specified in routes.js -->

    <!-- With browser history off, Framework7 has no location to derive the
         first route from, so the main view came up empty: full-size, zero
         pages, and nothing but the dark theme's black. On the web the URL
         still decides, so `url` is left undefined there and deep links keep
         working. -->
    <ErrorBoundary>
      <f7-view 
    :url="useBrowserHistory ? undefined : '/'"
    :push-state="useBrowserHistory"
    :browser-history="useBrowserHistory"
    :browser-history-root="historyRoot"
    main 
    ></f7-view>
    </ErrorBoundary>

    <!-- The side panel is app furniture, not part of the home screen. It used
         to be mounted inside Home, so on every other page it simply did not
         exist and the Valikko tab opened nothing. Framework7 panels belong
         beside the view anyway. -->
    <left-sidepanel v-if="isAuthenticated" />

    <!-- Outside the view so it survives navigation, and only once signed in:
         there is nowhere to go from the sign-in screen. Climbers kept asking
         where the route list was, and the honest answer was that it had no
         entry anywhere — not here, not in the side panel. The only way in was
         a button part-way down the home screen. -->
    <bottom-tab-bar
      v-if="isAuthenticated"
      :tabs="tabs"
      :active-tab="activeTab"
      @select="onTabSelect"
    />
  </f7-app>
</template>
<script>
import routes from './js/routes.js'
import ErrorBoundary from '@/components/ui/ErrorBoundary.vue'
import BottomTabBar from '@components/ui/BottomTabBar.vue'
import LeftSidepanel from '@components/home/LeftSidepanel.vue'
import { registerBackButton, setupChrome, registerDeepLinks } from '@js/native.js'
import { pendingWebSession } from '@helpers/socialAuth.js'
import { useBrowserHistory, browserHistoryRoot } from '@js/platform.js'
import { readStoredToken } from '@js/authToken.js'
import { useI18n } from 'vue-i18n'
import { watch, computed, ref } from 'vue'
import { useStore } from 'vuex'
import $ from 'dom7'
import { f7, f7ready } from 'framework7-vue'

export default {
  components: { BottomTabBar, LeftSidepanel },
  props: {
    f7router: Object,
  },
  setup() {
    const { t } = useI18n()
    const store = useStore()
    const allTime = computed(() => store.state.alltime)
    const profile = computed(() => store.state.profile)
    // Read from where the page is actually served rather than configured, so
    // it cannot disagree with the origin pushState will check it against.
    // See platform.js for what that disagreement costs.
    const historyRoot = browserHistoryRoot
    const isAuthenticated = computed(() => store.state.isAuthenticated)

    // Five destinations, one of which is the route list — the thing climbers
    // could not find. "Menu" opens the side panel so nothing that lived only
    // there becomes unreachable.
    const TABS = [
      { id: 'home', icon: 'home', path: '/' },
      { id: 'problems', icon: 'format_list_bulleted', path: '/problems' },
      // The side panel opened the map with these options before it was moved
      // here; the map needs a fresh page rather than a cached one.
      { id: 'map', icon: 'map', path: '/gym-map', options: { ignoreCache: true, force: true } },
      { id: 'feed', icon: 'dynamic_feed', path: '/feed' },
      { id: 'menu', icon: 'menu', path: null },
    ]
    const tabs = computed(() => TABS.map((tab) => ({ ...tab, label: t(`tabbar.${tab.id}`) })))

    const activeTab = ref('home')

    // Highlight follows the router, not the last tap: arriving at the route
    // list from the home screen's button should light the same tab up.
    const syncFromUrl = (url) => {
      if (!url) return
      const match = TABS.find((tab) => tab.path && tab.path !== '/' && url.startsWith(tab.path))
      activeTab.value = match ? match.id : url === '/' || url.startsWith('/home') ? 'home' : activeTab.value
    }

    // Set on <html> rather than bound on <f7-app>: Framework7's App component
    // does not forward a class binding to its root element, so the class was
    // silently dropped and every page's last row sat under the bar.
    watch(isAuthenticated, (on) => {
      document.documentElement.classList.toggle('has-tabbar', !!on)
    }, { immediate: true })

    f7ready(() => {
      const router = f7?.views?.main?.router
      // currentRoute is not necessarily populated when f7ready fires, so fall
      // back to the router's own history. Without this the bar highlighted
      // Home on any start route other than '/'.
      syncFromUrl(router?.currentRoute?.url ?? router?.history?.[router.history.length - 1])
      // routeChange fires as navigation begins, routeChanged once it lands.
      // Listening to both keeps the highlight right whether a page resolves
      // immediately or after an async component loads.
      f7.on('routeChange', (newRoute) => syncFromUrl(newRoute?.url))
      f7.on('routeChanged', (newRoute) => syncFromUrl(newRoute?.url))
    })

    const onTabSelect = (id) => {
      if (id === 'menu') {
        store.commit('setSidePanel', true)
        return
      }
      const tab = TABS.find((x) => x.id === id)
      if (!tab?.path) return
      const router = f7?.views?.main?.router
      if (!router) return
      activeTab.value = id
      // reloadCurrent on the same destination avoids stacking duplicates of a
      // page a climber taps twice.
      if (router.currentRoute?.url === tab.path) return
      router.navigate(tab.path, { animate: true, ...(tab.options ?? {}) })
    }

    store.dispatch('version')

    // No-ops on the web. On native: dismiss the splash, keep the status bar
    // from overlaying our header, and make Android's back button pop the
    // Framework7 stack instead of exiting the app.
    setupChrome()
    registerBackButton(f7)
    // Let a social sign-in back in after its trip to the system browser.
    registerDeepLinks()

    // The web equivalent: the provider redirected back onto our own origin and
    // supabase-js consumed the URL before this ran, so any session it left is
    // waiting to be traded for our JWT. Resolves to null on an ordinary load.
    pendingWebSession().then((token) => {
      if (token) store.dispatch('completeSocialLogin', token)
    })
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

    // Bootstrap from the stored token (after watch is registered). The
    // "is it really a token" question lives in readStoredToken, so this is
    // not a third place that has to remember about the string "null".
    const existingToken = readStoredToken()
    if (existingToken) {
      store.commit('setToken', existingToken)
    } else {
      store.commit('setReady', true)
    }

    return {
      tabs,
      activeTab,
      onTabSelect,
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
