
<template>
  <f7-page name="home">
    <!-- Top Navbar -->
    <f7-navbar :sliding="false">
      <f7-nav-left>
        <f7-link
          icon-ios="f7:menu"
          icon-aurora="f7:menu"
          icon-md="material:menu"
          panel-open="left"
        ></f7-link>
      </f7-nav-left>
    </f7-navbar>
    <div v-if="profileLoaded" class="mb-12">
      <div class="my-2 text-center font-bold text-md">
        {{ user.etunimi }} - {{ $t("home.logs") }}
      </div>
      <div class="my-2 text-center text-md">{{ $t("home.today") }}</div>
      <div class="flex flex-row justify-center mt-3">
        <div class="flex flex-col mx-4 text-center">
          <div class="text-5xl font-bold leading-8">{{ ticksToday }}<br /></div>
          <small class="mb-2">{{ $t("home.ascents") }}</small>
          <div class="text-sm text-center leading-3">{{ triesToday }}</div>
          <small>{{ $t("home.tries") }}</small>
        </div>
        <div class="mt-2">
          <button
            class="
              w-14
              h-14
              rounded-full
              bg-purple-800
              p-2
              text-white
              flex flex-col
              justify-center
              items-center
              font-bold
            "
          >
            <f7-icon material="add" color="white" size="12px"></f7-icon>
            <small>{{ $t("home.add") }}</small>
          </button>
        </div>
      </div>

    <!-- Show floormaps -->
    <f7-block>
      <h3 class="no-margin" >{{ $t('home.floor_maps') }} <small class="text-sm">{{ gym.floormaps?.length }} {{ $t('home.maps') }}</small></h3>
      <div class="m-1">{{ $t('home.start_by_clicking_a_wall_or')}}
        <f7-link href="/problems" class="font-bold text-blue-700">{{ $t('home.show_all_problems')}}</f7-link>
        </div>
        <div v-for="floormap in gym.floormaps" :key="floormap.id">
          <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
        </div>
    </f7-block>

    <my-logs @click="onMyLogsClicked"></my-logs>

    <!-- show climbed percentage status -->
    <div class="grid grid-cols-2">


    <div class=" m-4 rounded-md raised shadow-lg p-4 bg-white flex flex-col items-center" @click="onStatusBadgeClicked">
        <div class="font-bold text-lg" style="color : #3BB273;">{{ gym.name }}</div>
        <div>{{ $t('home.climbed') }} <span class="text-lg">{{ getClimbedPercentage }}%</span> {{ $t('home.of') }}</div>
        <div class="text-5xl">{{ getTotalRoutes }}</div>
        <div>{{ $t('home.of_routes') }}</div>
    </div>
    
    <div class="m-4 rounded-md raised shadow-lg p-4 bg-white flex flex-col items-center">
        <div class="font-bold text-lg" style="color : #3BB273;">Info</div>
        <div>Competitions and groups are coming later...</div>
    </div>

    </div>

    </div><!-- if profileloaded -->
  </f7-page>
</template>

<script>
import FloorMap from '@components/ui/FloorMap.vue'
import MyLogs from '@components/home/MyLogs.vue'
import { f7, f7ready } from "framework7-vue";
import { onMounted, computed } from "vue";
import { useStore } from "vuex";

export default {
  setup() {
    const store = useStore();
    const profileLoaded = computed(() => store.state.homeLoaded);
    const user = computed(() => store.state.user);
    const gym = computed(() => store.state.gym);
    const profile = computed(() => store.state.profile);
    onMounted(() => {
      f7.preloader.show();
      store.dispatch("getProfile").then(() => {
        f7.preloader.hide();
      });
    });
    const ticksToday = computed(() => {
      // Go through gym problems for the ascents
      const probs = store.state.gym.problems;
      return probs.reduce((acc, prob) => {
        acc += prob.myTicks.length;
        return acc;
      }, 0);
    });

    const triesToday = computed(() => {
      // Go through gym problems for the ascents
      const probs = store.state.gym.problems;
      const triesToday = probs.reduce((acc, prob) => {
        acc += prob.myTicks.reduce((ticks, tick) => {
          ticks += parseInt(tick.tries);
          return ticks;
        }, 0);
        return acc;
      }, 0);
      return triesToday;
    });
    const onAreaSelected = (area) => {
            // Nafvigate to problems with selected wall
            f7.views.main.router.navigate("/problems", {props : {
                'areaSelected' : area
            }})
    }
    const getTotalRoutes = computed(() => {
      if (gym.value != null) {
        const total = gym.value.problemcount;
        return total;
      }
      return 0;
    });
    const getOwnTickCount = computed(() => {
      if (profile.value.info != null) {
        // Count only unique ticks
        const problemsids = profile.value.info.ticked.map(tick => tick.problemid)
        const distinctProblems = [... new Set(problemsids)]
        return distinctProblems.length;
      }
      return 0;
    });
    const getClimbedPercentage = computed(() => {
        const percentage = Math.round( (getOwnTickCount.value / getTotalRoutes.value)*1000 )/10
        return percentage
    })
    const onMyLogsClicked = () => f7.views.main.router.navigate("/mylogs")
    const onStatusBadgeClicked = () => f7.views.main.router.navigate("/problems")
    return {
      profileLoaded,
      user,
      triesToday,
      ticksToday,
      gym,
      getTotalRoutes,
      onAreaSelected,
      getClimbedPercentage,
      onMyLogsClicked,
      onStatusBadgeClicked,
    };
  },
  components: {
    FloorMap,
    MyLogs,
  },
};
</script>

<style>
</style>