<template>
  <f7-page name="problems">
    <!-- Top Navbar -->
    <f7-navbar :sliding="false" :back-link="$t('global.back')">
      <f7-nav-title>{{ $t("problems.page_title") }}</f7-nav-title>
      <f7-nav-right>
        <f7-link
          icon-ios="f7:menu"
          icon-aurora="f7:menu"
          icon-md="material:menu"
          panel-open="left"
        ></f7-link>
      </f7-nav-right>
    </f7-navbar>
    <!-- Page content-->

    <route-filter-buttons></route-filter-buttons>
    <personal-tick-status></personal-tick-status>
    <f7-block v-if="gym.floormaps.length > 0">
      <h3 class="no-margin">
        {{ $t("home.floor_maps") }}
        <small class="text-sm">{{ gym.floormaps?.length }} {{ $t("home.maps") }}</small>
      </h3>
      <small>{{ $t("home.click_to_filter_by_wall") }}</small>
      <div v-for="floormap in gym.floormaps" :key="floormap.id">
        <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
      </div>
    </f7-block>
    <problem-list :filters="filters" :wall="wall"></problem-list>
    <div v-html="$t('global.join')" class="mx-4 text-sm"></div>
    <div class="m-4 pb-4">&copy;{{ year }} {{ $t("global.arr") }}</div>
  </f7-page>
</template>
<script>
import RouteFilterButtons from "@components/home/RouteFilterButtons.vue";
import PersonalTickStatus from "@components/home/PersonalTickStatus.vue";
import FloorMap from "@components/ui/FloorMap.vue";
import ProblemList from "@components/ui/ProblemList.vue";
import { useStore } from "vuex";
import { ref, onMounted, computed } from "vue";
import dayjs from "dayjs";

export default {
  props: {
    areaSelected: {
      type: Object,
      default: null,
    },
  },

  computed: {
    gymid() {
      return localStorage.gymid || null;
    },
  },
  setup(props) {
    const filters = ref(null);
    const wall = ref(null);
    const store = useStore();
    const gym = computed(() => store.state.gym);
    const walls = computed(() => store.state.walls);

    const selectedWalls = ref([]);
    onMounted(() => {
      filters.value = localStorage.filters;
      wall.value = localStorage.wall;
      // IF wall is pre-selected via router, then select the wall immediately
      if (props.areaSelected != null) {
        onAreaSelected(props.areaSelected);
      }
    });
    const onAreaSelected = (area) => {
      // Set selected wall.
      localStorage.wall = area.alt;
      // Find wall ids
      const selectedWall = walls.value.find(
        (wall) => wall.wallchar.toLowerCase() == area.alt.toLowerCase()
      );
      console.log("selecting wall", selectedWall.id);
      store.commit("setFilterWalls", [selectedWall.id]);
    };
    const year = dayjs().format("YYYY");
    return {
      gym,
      onAreaSelected,
      wall,
      filters,
      year,
      dayjs,
    };
  },
  components: {
    RouteFilterButtons,
    PersonalTickStatus,
    FloorMap,
    ProblemList,
  },
};
</script>
