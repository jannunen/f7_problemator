<template>
  <f7-page name="home">
    <!-- Top Navbar -->
    <f7-navbar :sliding="false" >
      <f7-nav-left>
        <f7-link icon-ios="f7:menu" icon-aurora="f7:menu" icon-md="material:menu" panel-open="left"></f7-link>
      </f7-nav-left>
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
    <problem-list  :filters="filters" :wall="wall"></problem-list>
    <div v-html="$t('global.join')" class="mx-4 text-sm"></div>
    <div class="m-4 pb-4 ">&copy;{{ year }} {{ $t('global.arr') }}</div>
    </div>


    
  </f7-page>
</template>
<script>
import RouteFilterButtons from '@components/home/RouteFilterButtons.vue'
import PersonalTickStatus from '@components/home/PersonalTickStatus.vue'
import FloorMap from '@components/ui/FloorMap.vue'
import ProblemList from '@components/ui/ProblemList.vue'
import { useStore } from 'vuex'
  import { f7, f7ready } from 'framework7-vue';
import { ref, onMounted, computed} from 'vue'
import store from '@js/store/store.js'
import dayjs from 'dayjs'

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
          f7.preloader.show()
          store.dispatch("getProfile")
          .then(() => {
            profileLoaded.value = true
            f7.preloader.hide()
          })
          filters.value = localStorage.filters
          wall.value = localStorage.wall

      })
      const store = useStore()
      const gym = computed(() => store.state.gym)
      const walls = computed(() => store.state.walls)

      const selectedWalls = ref([])
      const onAreaSelected = (area) => {
        // Set selected wall.
        localStorage.wall = area.alt
        // Find wall ids
        const selectedWall = walls.value.find(wall => wall.wallchar.toLowerCase() ==area.alt.toLowerCase())
        console.log("selecting wall",selectedWall.id)
        store.commit("setFilterWalls",[selectedWall.id])
      }
      const year = dayjs().format("YYYY")
      return {
        gym,
        onAreaSelected,
        profileLoaded,
        wall,
        filters,
        year,
        dayjs,
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


