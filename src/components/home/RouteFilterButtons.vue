<template>
  <div class="flex flex-row flex-wrap m-4">
    <div
      v-for="routeType in routeTypes"
      :key="routeType"
      @click="store.commit('setFilterProblems', routeType)"
      style="color: #5e4955"
      :class="classes(routeType)"
    >
      {{ $t("btn_" + routeType) }}
    </div>
  </div>
</template>
<script>
import { useStore } from "vuex";
import { ref, computed } from "vue";
export default {
  setup() {
    const store = useStore();
    const activeFilter = computed(() => store.state.filters.problemFilters);
    const classes = (currentFilter) => {
      return {
        "m-1": true,
        "text-center": true,
        'text-sm' : true,
        "font-bold": false,
        "rounded-full": true,
        "py-1": true,
        "px-3": true,
        "shadow-lg": false,
        'border': true,
        "border-red-400": currentFilter == activeFilter.value,
        "border-gray-300": currentFilter != activeFilter.value,
      };
    };
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
