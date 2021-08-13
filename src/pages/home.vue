<template>
  <f7-page name="home">
    <!-- Top Navbar -->
    <f7-navbar large :sliding="false">
      <f7-nav-left>
        <f7-link icon-ios="f7:menu" icon-aurora="f7:menu" icon-md="material:menu" panel-open="left"></f7-link>
      </f7-nav-left>
      <f7-nav-title sliding>Problemator</f7-nav-title>
      <f7-nav-title-large>Problemator</f7-nav-title-large>
    </f7-navbar>
    <!-- Toolbar-->
    <f7-toolbar bottom>
      <f7-link>Left Link</f7-link>
      <f7-link>Right Link</f7-link>
    </f7-toolbar>
    <!-- Page content-->
    <route-filter-buttons></route-filter-buttons>
    <personal-tick-status></personal-tick-status>

    
  </f7-page>
</template>
<script>
import RouteFilterButtons from '@components/home/RouteFilterButtons.vue'
import PersonalTickStatus from '@components/home/PersonalTickStatus.vue'
import store from '@js/store.js'

  export default {
    mounted() {
      // Fetch profile info
      store.dispatch("getProfile")

    },
    components : {
      RouteFilterButtons,
      PersonalTickStatus,
    }
  }
</script>


