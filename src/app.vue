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
import { wasReturnedFromStripeCheckout } from '@js/helpers/stripeReturn.js'
import { logoutOnProfileBootstrapFailure } from '@js/helpers/profileBootstrapError.js'
import { invalidate, queries } from '@js/queryKeys.js'
import { useI18n } from 'vue-i18n'
import { useQueryClient, useQuery } from '@tanstack/vue-query'
import { watch, computed, ref } from 'vue'
import { useUiStore } from '@js/stores/ui.store.js'
import { useAuthStore } from '@js/stores/auth.store.js'
import { useGymStore } from '@js/stores/gym.store.js'
import $ from 'dom7'
import { f7, f7ready } from 'framework7-vue'

export default {
  components: { BottomTabBar, LeftSidepanel, ErrorBoundary },
  props: {
    f7router: Object,
  },
  setup() {
    const { t } = useI18n()
    const uiStore = useUiStore()
    const authStore = useAuthStore()
    const gymStore = useGymStore()
    const queryClient = useQueryClient()
    const gymid = computed(() => gymStore.gymid)
    // No data read off this here — app.vue is the one place guaranteed to be
    // mounted for the whole authenticated session, so this is what makes
    // sure the profile fetch (and its climber/rankingTarget bridge into
    // Pinia — see queryKeys.js) starts the moment sign-in lands, rather than
    // only incidentally whenever some page that happens to read gym/styles/
    // grades/walls happens to mount.
    const profileQuery = useQuery(queries.profile(gymid))
    // Same reasoning for queries.allTimeTicks: this is the one place
    // guaranteed to stay mounted for the whole session, so its gcTime never
    // evicts the cache entry mutations.js's saveTick/deleteTick/
    // deleteTickByProblem patch directly.
    useQuery(queries.allTimeTicks())
    // The old getProfile dispatch's try/catch logged the climber out on ANY
    // rejection — a network error, a 500, not only an expired/invalid token
    // (a 401 that can't be refreshed already logs out on its own, via the
    // jwt interceptor's forceLogout). useQuery has no onError callback in
    // this TanStack version any more than it has onSuccess, so this watches
    // the query's own state instead of awaiting+catching a dispatch. Only a
    // failure with nothing cached (isLoadingError) counts: getProfile ran
    // once per sign-in/gym change, while this query has ~30 observers whose
    // background refetches must not log a climber out over a wifi blip. See
    // helpers/profileBootstrapError.js for the gate and why it lives there.
    logoutOnProfileBootstrapFailure(profileQuery, () => authStore.logout())
    // Read from where the page is actually served rather than configured, so
    // it cannot disagree with the origin pushState will check it against.
    // See platform.js for what that disagreement costs.
    const historyRoot = browserHistoryRoot
    const isAuthenticated = computed(() => authStore.isAuthenticated)

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
        uiStore.setSidePanel(true)
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

    uiStore.fetchVersion()

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
      if (token) authStore.completeSocialLogin(token)
    })

    // The other trip through an external page: back from Stripe Checkout
    // after subscribing to Ada. The subscription just changed — trial
    // exhausted becomes paying, or a first subscription starts — so the
    // cached virtualCoach state is wrong the instant this loads. Without
    // this a climber who just paid would still be shown "trial used up"
    // until something else happened to invalidate it, which is the worst
    // possible moment to have that backwards.
    if (wasReturnedFromStripeCheckout(window.location.search, window.location.hash)) {
      queryClient.invalidateQueries({ queryKey: invalidate.virtualCoach() })
      // Drop the flag so refreshing this page does not read as another
      // return trip.
      const url = new URL(window.location.href)
      url.searchParams.delete('subscribed')
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    }

    // Save tip showing status in localStorage.
    const tipShowStatus = JSON.parse(localStorage.getItem('tipShowStatus'))
    const access_token = computed(() => authStore.accessToken)
    uiStore.setTipShowStatus(tipShowStatus)
    uiStore.setInitializing(false)

    // Get app local version
    const version = import.meta.env.PACKAGE_VERSION
    uiStore.setVersion(version)

    const isDark = localStorage.getItem('dark')
    if (isDark != 'false') {
      const $html = $('html')
      $html.removeClass('theme-dark theme-light')
      $html.addClass(`theme-dark`)
    }

    // Set up watch BEFORE bootstrapping token so the watcher fires
    //
    // No longer awaits (or try/catches) a getProfile dispatch: that action
    // is gone (see queryKeys.js's `profile` query, started above), and the
    // one thing the catch here was for — an unrecoverable session — is
    // already handled centrally by the jwt interceptor's forceLogout, which
    // calls authStore.logout() on its own whenever a 401 cannot be
    // refreshed (see jwt.interceptor.js). ready no longer waits on a
    // profile fetch resolving either: Home.vue's own skeleton/sign-in
    // choice reads isAuthenticated directly now, not just ready, so a slow
    // or failed fetch cannot strand it.
    watch(access_token, (newValue, oldValue) => {
      if (newValue != null && newValue != "" && newValue != "null") {
        uiStore.setReady(true)
      }
      uiStore.setInitializing(false)
    }, {
      // immediate, because access_token no longer starts null. It is seeded
      // from storage, so a reload with a stored token commits the value it
      // already holds — an assignment, not a change, which Vue's watch does
      // not fire on. The profile was never loaded and setReady never ran, so
      // the home screen sat on its skeletons forever. Signing in fresh worked
      // the whole time, because there the token genuinely changes.
      immediate: true,
    })

    // Bootstrap from the stored token (after watch is registered). The
    // "is it really a token" question lives in readStoredToken, so this is
    // not a third place that has to remember about the string "null".
    const existingToken = readStoredToken()
    if (existingToken) {
      authStore.setToken(existingToken)
    } else {
      uiStore.setReady(true)
    }

    return {
      tabs,
      activeTab,
      onTabSelect,
      t,
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
