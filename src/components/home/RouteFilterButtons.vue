<template>
  <div class="flex flex-row flex-wrap m-4">
    <div
      v-for="routeType in routeTypes"
      :key="routeType"
      @click="uiStore.setFilterProblems(routeType)"
      style="color: #5e4955"
      :class="classes(routeType)"
    >
      {{ $t("btn_" + routeType) }}
    </div>
  </div>
</template>
<script>
import { useUiStore } from "@js/stores/ui.store.js";
import { ref, computed } from "vue";
export default {
  setup() {
    const uiStore = useUiStore();
    const activeFilter = computed(() => uiStore.filters.problemFilters);
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
      uiStore,
      routeTypes,
      classes,
    };
  },
};
</script>
