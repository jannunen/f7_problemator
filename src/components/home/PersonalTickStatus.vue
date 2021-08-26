<template>
  <f7-block>
    <f7-row>
      <f7-col>
        <div
          style="display: flex; flex-direction: row; justify-content: center"
        >
          <div
            style="display: flex; flex-direction: column; align-content: center"
          >
            {{ $t("pts.you_ticked") }}
            <round-badge 
            @click="store.commit('setFilterProblems','ticked')"
            :width="38" border-color="#5fda5f">{{
              getOwnTickCount
            }}</round-badge>
          </div>
        </div>
      </f7-col>
      <f7-col>
        <div
          style="display: flex; flex-direction: row; justify-content: center"
        >
          <div
            style="display: flex; flex-direction: column; align-content: center"
          >
            {{ $t("pts.projects") }}
            <round-badge :width="38" border-color="#f08d0c"
            @click="store.commit('setFilterProblems','projects')"
            >{{
              getTriedCount
            }}</round-badge>
          </div>
        </div>
      </f7-col>
      <f7-col>
        <div
          style="display: flex; flex-direction: row; justify-content: center"
        >
          <div
            style="display: flex; flex-direction: column; align-content: center"
          >
            {{ $t("pts.total") }}
            <round-badge 
            @click="store.commit('setFilterProblems','all')"

            :width="38" >{{ getTotalRoutes }}</round-badge>
          </div>
        </div>
      </f7-col>
    </f7-row>
    <f7-row>
      <f7-col>
        <horizontal-bar-graph
          style="height : 18px;"
          :height="10"
          :items="[getOwnTickCount, getTriedCount]"
          :colours="['#5fda5f', '#f08d0c']"
          :max="getTotalRoutes"
        >
        </horizontal-bar-graph>
      </f7-col>
    </f7-row>
  </f7-block>
</template>

<script>
import RoundBadge from "@components/ui/RoundBadge.vue";
import { computed } from "vue";
import { useStore } from "vuex";
import HorizontalBarGraph from "../ui/HorizontalBarGraph.vue";

export default {
  components: {
    RoundBadge,
  },
  setup() {
    const store = useStore();
    const profile = store.state.profile
    const gym = store.state.gym

    const getOwnTickCount = computed(() => {
      if (profile.info != null) {
        // Count only unique ticks
        const problemsids = profile.info.ticked.map(tick => tick.problemid)
        const distinctProblems = [... new Set(problemsids)]
        return distinctProblems.length;
      }
      return 0;
    });
    const getTriedCount = computed(() => {
      if (profile.info != null) {
        if (profile.info.tried == null) {
            return 0
        }

        const problemsids = profile.info.tried.map(tick => tick.problemid)
        const distinctProblems = [... new Set(problemsids)]
        return distinctProblems.length;
      }
      return 0;
    });
    const getTotalRoutes = computed(() => {
      if (gym != null) {
        const total = gym.problemcount;
        return total;
      }
      return 0;
    });

    return {
      getOwnTickCount,
      getTriedCount,
      getTotalRoutes,
      profile,
      gym,
      store,
    };
  },
  methods: {},
  components: {
    HorizontalBarGraph,
    RoundBadge,
  },
};
</script>

<style>
</style>