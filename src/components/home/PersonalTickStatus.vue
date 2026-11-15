<template>
  <div class="flex flex-row my-4 justify-center items-center">
    <div class="flex flex-col items-center w-4/5">
      <div>
        <div class="flex flex-row justify-center px-4 gap-4">
          <div style="display: flex; flex-direction: column; align-content: center">
            <small>{{ $t("pts.you_ticked") }}</small>
            <round-badge
              @click="uiStore.setFilterProblems('ticked')"
              :width="38"
              border-color="#5fda5f"
              >{{ getOwnTickCount }}</round-badge
            >
          </div>

          <div style="display: flex; flex-direction: column; align-content: center">
            <small>{{ $t("pts.projects") }}</small>
            <round-badge
              :width="38"
              border-color="#f08d0c"
              @click="uiStore.setFilterProblems('projects')"
              >{{ getTriedCount }}</round-badge
            >
          </div>

          <div style="display: flex; flex-direction: column; align-content: center">
            <small>{{ $t("pts.total") }}</small>
            <round-badge @click="uiStore.setFilterProblems('all')" :width="38">{{
              getTotalRoutes
            }}</round-badge>
          </div>
        </div>
        <div></div>
        <horizontal-bar-graph
          style="height: 18px"
          :height="10"
          :items="[getOwnTickCount, getTriedCount]"
          :colours="['#5fda5f', '#f08d0c']"
          :max="getTotalRoutes"
        >
        </horizontal-bar-graph>
      </div>
    </div>
  </div>
</template>

<script>
import RoundBadge from "@components/ui/RoundBadge.vue";
import { computed } from "vue";
import { useUiStore } from "@js/stores/ui.store.js";
import { useGymStore } from "@js/stores/gym.store.js";
import { useQuery } from "@tanstack/vue-query";
import { queries } from "@js/queryKeys.js";
import HorizontalBarGraph from "../ui/HorizontalBarGraph.vue";

export default {
  setup() {
    const uiStore = useUiStore();
    const gymStore = useGymStore();
    const gymid = computed(() => gymStore.gymid);
    // profile/gym used to be captured once, non-reactively, off Vuex state —
    // harmless only because getProfile always finished before this mounted.
    // A changeGym mid-session would have left both stale; reading them off
    // the query keeps them live across a gym switch too.
    const { data: profile } = useQuery({ ...queries.profile(gymid), select: (data) => data.profile });
    const { data: gym } = useQuery({ ...queries.profile(gymid), select: (data) => data.gym });

    const getOwnTickCount = computed(() => {
      if (profile.value?.info != null) {
        // Count only unique ticks
        const problemsids = profile.value.info.ticked.map((tick) => tick.problemid);
        const distinctProblems = [...new Set(problemsids)];
        return distinctProblems.length;
      }
      return 0;
    });
    const getTriedCount = computed(() => {
      if (profile.value?.info != null) {
        if (profile.value.info.tried == null) {
          return 0;
        }

        const problemsids = profile.value.info.tried.map((tick) => tick.problemid);
        const distinctProblems = [...new Set(problemsids)];
        return distinctProblems.length;
      }
      return 0;
    });
    const getTotalRoutes = computed(() => {
      if (gym.value != null) {
        const total = gym.value.problemcount;
        return total || 0;
      }
      return 0;
    });

    return {
      getOwnTickCount,
      getTriedCount,
      getTotalRoutes,
      profile,
      gym,
      uiStore,
    };
  },
  methods: {},
  components: {
    HorizontalBarGraph,
    RoundBadge,
  },
};
</script>

<style></style>
