
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
    <div v-if="profileLoaded">
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
    <div class="bg-white my-2">
      <h2 class="no-margin text-center text-lg font-bold" >{{ $t('home.floor_maps') }} <small>{{ gym.floormaps?.length }} {{ $t('home.maps') }}</small></h2>
      <div class="m-2">{{ $t('home.start_by_clicking_a_wall_or')}}
        <f7-link href="/problems" class="font-bold text-blue-700">{{ $t('home.show_all_problems')}}</f7-link>
        </div>
        <div v-for="floormap in gym.floormaps" :key="floormap.id">
          <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
        </div>
    </div>

    </div><!-- if profileloaded -->
  </f7-page>
</template>

<script>
import FloorMap from '@components/ui/FloorMap.vue'
import { f7, f7ready } from "framework7-vue";
import { onMounted, computed } from "vue";
import { useStore } from "vuex";
export default {
  setup() {
    const store = useStore();
    const profileLoaded = computed(() => store.state.homeLoaded);
    const user = computed(() => store.state.user);
    const gym = computed(() => store.state.gym);
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
    return {
      profileLoaded,
      user,
      triesToday,
      ticksToday,
      gym,
      onAreaSelected,
    };
  },
  components: {
    FloorMap,
  },
};
</script>

<style>
</style>