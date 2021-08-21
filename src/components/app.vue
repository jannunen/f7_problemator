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
  <f7-view main class="safe-areas" url="/welcome" v-cloak>

  </f7-view>

  </f7-app>
</template>
<script>
  import { ref, onMounted } from 'vue';
  import { f7, f7ready } from 'framework7-vue';
  import axios from 'axios'

import { createLocal, createSession } from 'the-storages'
  //import { useStore } from 'framework7-vue';
  import routes from '../js/routes.js';
  import store from '@js/store';



  export default {
    setup(props,context) {

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
          const mirror = createLocal() // create localStorage; createSession is sessionStorage
          const storage = mirror._prx 

          console.log(storage, mirror)
          // Filters are being fetched from the storage here, and they
          // are set into store. When the filters are updated, they are
          // both updated in the store and to the localStorage, so that
          // they will survive through reloads and stuff. 
          // BUt they are stored in the store, so that the reactive properties stay
          if (mirror.filters.gradeMin != null) {
            //storage.set('filters',{...mirror.get('filters'),['gradeMin'] : 'min', ['gradeMax'] : 'max'})
            store.dispatch('setGradeMin',mirror.filters.gradeMin)
          }
          if (mirror.filters.gradeMax != null) {
            store.dispatch('setGradeMax',mirror.filters.gradeMax)
          }
          if (mirror.filters.styles == null) {
            store.dispatch('setStyles',mirror.filters.styles)
          }
          if (mirror.filters.sort == null) {
            storage.set('filters',{...mirror.get('filters'),['sort'] : 'sector_asc'})
          }
          
          /*
          TODO: Set these
          */

          // Initialize filters (inc. sort)
          if (localStorage.jwt != null) {
            const jwt = localStorage.jwt
              // Set jwt to axios
              axios.defaults.headers.common = {'Authorization': `Bearer ${jwt}`}
              // Try to refresh the token, and if it's valid, navigate to actual home
              store.dispatch('refreshJWT')
              .then(data => {
                // Update jwt to axios
                axios.defaults.headers.common = {'Authorization': `Bearer ${data.jwt}`}
                // Save it to localStorage for future refreshes
                localStorage.jwt = data.jwt
                // If we have a fresh jwt, navigate to /home
                f7.views.main.router.navigate("/home")
              })
              .catch(data => {
                f7.views.main.router.navigate("/")

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