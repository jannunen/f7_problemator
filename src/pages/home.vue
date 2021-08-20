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
    <div v-if="profileLoaded">
    <route-filter-buttons></route-filter-buttons>
    <personal-tick-status></personal-tick-status>
    <f7-block>
      <h2 class="no-margin" >{{ $t('home.floor_maps') }} <small>{{ gym.floormaps?.length }} {{ $t('home.maps') }}</small></h2>
      <small >{{ $t('home.click_to_filter_by_wall')}}</small>
        <div v-for="floormap in gym.floormaps" :key="floormap.id">
          <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
        </div>
    </f7-block>
    <problem-list :filters="filters" :wall="wall"></problem-list>
    </div>


    
  </f7-page>
</template>
<script>
import RouteFilterButtons from '@components/home/RouteFilterButtons.vue'
import PersonalTickStatus from '@components/home/PersonalTickStatus.vue'
import FloorMap from '@components/ui/FloorMap.vue'
import ProblemList from '@components/ui/ProblemList.vue'
import { useStore } from 'framework7-vue'
import { ref, onMounted} from 'vue'
import store from '@js/store.js'

  export default {
    
    computed : {
      gymid() {
        return localStorage.gymid || null
      },
    },
    setup() {
      const filters = ref(null)
      const wall = ref(null)
      const profileLoaded = ref(false)
      onMounted(() => {
          store.dispatch("getProfile")
          .then(() => {
            profileLoaded.value = true
          })
          filters.value = localStorage.filters
          wall.value = localStorage.wall

      })
      const gym = useStore('gym')
      const onAreaSelected = (area) => {
        debugger
        // Set selected wall.
        localStorage.wall = area.alt
      }
      return {
        gym,
        onAreaSelected,
        profileLoaded,
        wall,
        filters,
      }
    },
    components : {
      RouteFilterButtons,
      PersonalTickStatus,
      FloorMap,
      ProblemList,
    }
  }
</script>


