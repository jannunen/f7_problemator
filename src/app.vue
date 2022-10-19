<template>
  <!-- Main Framework7 App component where we pass Framework7 params -->
  <f7-app 
    name = "Problemator"
    id ="fi.problemator.v2"
    :routes="routes" 
    theme="aurora"
  >
    <!-- initial page is specified in routes.js -->
    
    <f7-view  main url="/"  :push-state="true" ></f7-view>
  </f7-app>
</template>
<script>
  import routes from './js/routes.js';
  import { useI18n } from 'vue-i18n'
  import { useAuth0 } from '@auth0/auth0-vue';
  import { watch, computed } from 'vue'
  import { useStore } from 'vuex'
  import $ from 'dom7'

  export default {
    props : {
      f7router : Object,
    },
    setup() {
        const { t } = useI18n() 
        const store = useStore()
        const allTime = computed(() => store.state.alltime)
        const profile = computed(() => store.state.profile)
        store.dispatch("changeGym",localStorage.gymid)
        const { getInstance, getAccessTokenSilently, loginWithRedirect, user, isAuthenticated } = useAuth0()
        const ready = computed(() => store.state.ready)
        store.commit('setInitializing',true)

        // Save tip showing status in locaStorage.
        const tipShowStatus = JSON.parse(localStorage.getItem('tipShowStatus'))
        store.dispatch('tipShowStatus',tipShowStatus)

        const version = import.meta.env.PACKAGE_VERSION
        store.commit('setVersion',version)

        getAccessTokenSilently()
        .then(async (token) => {
          store.commit('setToken', token)
          if (profile.value.info == null) {
            await store.dispatch('getProfile')
          }
          if (allTime.value.ticks.length == 0 && allTime.value.tries.length == 0) {
            store.dispatch('loadAllTimeTicks')
          }
          store.dispatch('version')
          store.commit('setReady',true)
          store.commit('setInitializing',false)
        })
        .catch(async (err) => {
          store.commit('setInitializing',false)
          // Not logged in, show login...
          store.commit('setIsAuthenticated',false)
        })

        watch(user, async (newValue, oldValue) => {
          if (newValue != null) {
            const ret = await store.dispatch('setUser', newValue)
          }
        })

        const isDark = localStorage.getItem('dark')
        if (isDark != 'false' ) {
          const $html = $('html')
          $html.removeClass('theme-dark theme-light')
          $html.addClass(`theme-dark`)
        }
        watch(isAuthenticated, async (newValue, oldValue) => {
          if (newValue === true) {
            const token = await getAccessTokenSilently()
            store.commit('setToken', token)
            console.log("access token",token)
            store.commit('setIsAuthenticated',true)
          }
          store.commit('setInitializing',false)
        })


        return {
            t,
            store,
            ready,
            routes,
            isAuthenticated,
        }
    },
    data() {
        return {

        }
    }
  }
</script>
