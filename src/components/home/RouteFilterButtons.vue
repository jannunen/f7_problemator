<template>
  <f7-block>
    <div class="flex flex-row flex-wrap">
      <div
        v-for="routeType in routeTypes"
        :key="routeType"
        @click="store.commit('setFilterProblems', routeType)"
        style="color: #5e4955"
        :class="classes(routeType)"
      >
        {{ $t("btn_" + routeType) }}
      </div>
      <!--
                <div @click="store.commit('setFilterProblems','new')"  style="color : #5E4955;" class="mx-2 text-center font-bold rounded-full py-2 px-3 shadow-lg">{{ $t('btn_new_routes') }}</div> 
                <div @click="store.commit('setFilterProblems','expiring')"   style="color : #5E4955;" class="mx-2 text-center font-bold rounded-full py-2 px-3 shadow-lg">{{ $t('btn_expiring_routes') }}</div> 
                <div  @click="store.commit('setFilterProblems','circuits')"  style="color : #5E4955;" class="mx-2 text-center font-bold rounded-full py-2 px-3 shadow-lg">{{ $t('btn_circuits') }}</div> 
                <div  @click="store.commit('setFilterProblems','boulders')"  style="color : #5E4955;" class="mx-2 text-center font-bold rounded-full py-2 px-3 shadow-lg">{{ $t('btn_boulders') }}</div> 
                <div  @click="store.commit('setFilterProblems','routes')"  style="color : #5E4955;" class="mx-2 text-center font-bold rounded-full py-2 px-3 shadow-lg">{{ $t('btn_routes') }}</div> 
                <div  @click="store.commit('setFilterProblems','projects')"  style="color : #5E4955;" class="mx-2 text-center font-bold rounded-full py-2 px-3 shadow-lg">{{ $t('btn_projects') }}</div> 
-->
    </div>
  </f7-block>
</template>
<script>
import { useStore } from "vuex";
import { ref, computed } from "vue";
export default {
  setup() {
    const store = useStore();
    const activeFilter = computed(() => store.state.filters.problemFilters)
    const classes = (currentFilter) => {

      return {
        "m-1": true,
        "text-center": true,
        "font-bold": true,
        "rounded-full": true,
        "py-2": true,
        "px-3": true,
        "shadow-lg": true,
        "border" : (currentFilter == activeFilter.value),
        "border-red-400" : (currentFilter == activeFilter.value),
      }
    }
    const routeTypes = ref([
      "all",
      "new",
      "expiring",
      "circuits",
      "boulders",
      "routes",
      "projects",
      "ticked",
    ]);
    return {
      store,
      routeTypes,
      classes,
    };
  },
};
</script>   