<template>
  <!-- Main Framework7 App component where we pass Framework7 params -->
  <f7-app 
    name = "Problemator"
    id ="fi.problemator.v2"
    :routes="routes" 
    :store="store" 
    theme="aurora"
  >
    <!-- initial page is specified in routes.js -->
    
    <f7-view  main url="/" :browser-history="true"></f7-view>
  </f7-app>
</template>
<script>
  import routes from './js/routes.js';
  import store from './js/store.js';
  import { useI18n } from 'vue-i18n'
  import { useAuth0 } from '@auth0/auth0-vue';
  import { ref, watch, computed } from 'vue'
  import { f7, useStore } from 'framework7-vue'
import $ from 'dom7'

  export default {
    props : {
      f7router : Object,
    },
    setup() {
        const { t } = useI18n() 
        store.dispatch("changeGym",localStorage.gymid)
        const { getInstance, getAccessTokenSilently, loginWithRedirect, user, isAuthenticated } = useAuth0()
        const loading = ref(true)

        getAccessTokenSilently()
        .then(async (token) => {
          const ret = await store.dispatch('setToken', token)
          console.log("access token1",token)
          store.dispatch('getProfile')
          loading.value = false
        })
        .catch(async (err) => {
          // Not logged in, show login...
          await store.dispatch('setIsAuthenticated',false)
          loading.value = false
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
            const ret = await store.dispatch('setToken', token)
            console.log("access token",token)
            await store.dispatch('setIsAuthenticated',true)
          }
          store.dispatch('setInitializing',false)
          loading.value = false
        })


        return {
            t,
            store,
            routes,
            isAuthenticated,
            loading,
        }
    },
    data() {
        return {

        }
    }
  }
</script>
