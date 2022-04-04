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
    <f7-view main url="/"></f7-view>
  </f7-app>
</template>
<script>
  import routes from './js/routes.js';
  import store from './js/store.js';
  import { useI18n } from 'vue-i18n'

  export default {
    setup() {
        const { t } = useI18n() 
        store.dispatch("changeGym",localStorage.gymid)
        return {
            t,
            store,
            routes,
        }
    },
    data() {
        return {

        }
    }
  }
</script>
