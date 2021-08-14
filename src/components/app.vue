<template>
  <f7-app store={store} v-bind="f7params" >

  <!-- Left panel with cover effect-->
  <f7-panel left cover theme-dark>
    <f7-view>
      <f7-page>
        <f7-navbar title="Left Panel"></f7-navbar>
        <f7-block>Left panel content goes here</f7-block>
      </f7-page>
    </f7-view>
  </f7-panel>


  <!-- Your main view, should have "view-main" class -->
  <f7-view main class="safe-areas" url="/">

  </f7-view>

  </f7-app>
</template>
<script>
  import { ref, onMounted } from 'vue';
  import { f7, f7ready } from 'framework7-vue';
  import axios from 'axios'

  //import { useStore } from 'framework7-vue';
  import routes from '../js/routes.js';
  import store from '@js/store';



  export default {
    setup() {

      // Framework7 Parameters
      const f7params = {
        name: 'Problemator', // App name
        theme: 'auto', // Automatic theme detection
        store,
        routes,
        // Register service worker (only on production build)
        serviceWorker: process.env.NODE_ENV ==='production' ? {
          path: '/service-worker.js',
        } : {},
      };
      const self = this

      onMounted(() => {
        f7ready(() => {
          if (localStorage.jwt != null) {
            const jwt = localStorage.jwt
              // Set jwt to axios
              axios.defaults.headers.common = {'Authorization': `Bearer ${jwt}`}
              // Try to refresh the token, and if it's valid, navigate to actual home
              store.dispatch('refreshJWT')
              .then(data => {
                debugger
                // Update jwt to axios
                axios.defaults.headers.common = {'Authorization': `Bearer ${data.jwt}`}
                // Save it to localStorage for future refreshes
                localStorage.jwt = data.jwt
                // If we have a fresh jwt, navigate to /home
                f7.views.main.router.navigate("/home")
              })
          }
          // Call F7 APIs here
        });
      });

      return {
        f7params,
      }
    }
  }
</script>