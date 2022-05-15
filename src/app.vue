<template>
  <!-- Main Framework7 App component where we pass Framework7 params -->
  <f7-app 
    name = "Problemator"
    id ="fi.problemator.v2"
    :routes="routes" 
    :store="store" 
    :autoDarkTheme="true"
  >
    <!-- initial page is specified in routes.js -->
    <f7-view main url="/" :browser-history="true"></f7-view>
  </f7-app>
</template>
<script>
  import routes from './js/routes.js';
  import store from './js/store.js';
  import { useI18n } from 'vue-i18n'
  import { useAuth0 } from '@auth0/auth0-vue';
  import { watch, computed } from 'vue'
  import { f7, useStore } from 'framework7-vue'

  export default {
    props : {
      f7router : Object,
    },
    setup() {
        const { t } = useI18n() 
        store.dispatch("changeGym",localStorage.gymid)
        const { getAccessTokenSilently, loginWithRedirect, user, isAuthenticated } = useAuth0()

        watch(user, async (newValue, oldValue) => {
          if (newValue != null) {
            const ret = await store.dispatch('setUser', newValue)
          }
        })

        watch(isAuthenticated, async (newValue, oldValue) => {
          if (newValue === true) {
            const token = await getAccessTokenSilently()
            const ret = await store.dispatch('setToken', token)
            console.log("access token",token)
            await store.dispatch('setIsAuthenticated',true)
          }
          store.dispatch('setInitializing',false)
        })

        /*
        watch(user,(newValue, oldValue) => {
          debugger
          if (newValue != null && newValue.email != null) {
            //store.dispatch('getProfile')
          }
        })
        watch(isAuthenticated,(newValue, oldValue) => {
          debugger
          if (isAuthenticated===true) {
            f7.views.main.router.navigate({url : '/home'  });
          }
        })
        */

        return {
            t,
            store,
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
