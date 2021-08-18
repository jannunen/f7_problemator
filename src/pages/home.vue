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
    <!-- Page content-->
    <route-filter-buttons></route-filter-buttons>
    <personal-tick-status></personal-tick-status>
    <div>
      <h2>{{ $t('home.Floor maps') }}</h2>
        <div v-for="floormap in gym.floormaps" :key="floormap.id">
          <floor-map :map="floormap"></floor-map>
        </div>
    </div>



    
  </f7-page>
</template>
<script>
import RouteFilterButtons from '@components/home/RouteFilterButtons.vue'
import PersonalTickStatus from '@components/home/PersonalTickStatus.vue'
import FloorMap from '@components/floormaps/FloorMap.vue'
import { useStore } from 'framework7-vue'
import { onMounted} from 'vue'
import store from '@js/store.js'

  export default {
    
    computed : {
      gymid() {
        return localStorage.gymid || null
      },
    },
    setup() {
      onMounted(() => {
          store.dispatch("getProfile")

      })
      const gym = useStore('gym')
      return {
        gym
      }
    },
    components : {
      RouteFilterButtons,
      PersonalTickStatus,
      FloorMap,
    }
  }
</script>


