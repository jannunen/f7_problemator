<template>
  <div>
    <!-- Show floormaps only when no interactive gym map exists -->
    <div v-if="!hasGymMap && gym != null && gym.floormaps != null && gym.floormaps.length > 0" class="px-4 py-2">
      <h3 class="p-section-title text-center">
        {{ t('home.floor_maps') }}
        <span class="p-text-muted text-xs">{{ gym.floormaps?.length }} {{ t('home.maps') }}</span>
      </h3>
      <div v-for="floormap in gym.floormaps" :key="floormap.id" class="my-1">
        <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
      </div>
      <!-- The route list and the map are tabs now, so the buttons that used to
           live here are gone. The sentence lost its trailing "or" with them —
           it read "Start by clicking a wall or" and then stopped. -->
      <div class="text-center mt-2 text-sm p-text-muted">
        {{ t('home.start_by_clicking_a_wall') }}
      </div>
    </div>
    <div v-else-if="!hasGymMap" class="text-center px-2 py-2 mx-2">
      <div class="mt-2 text-sm p-text-muted">{{ t('home.floor_map_missing') }}</div>
    </div>
  </div>
</template>
<script setup>
import { useStore } from 'vuex'
import { computed } from 'vue'
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { capitalize } from '@helpers/filters.js'
import FloorMap from '@components/ui/FloorMap.vue'
const store = useStore()
const { t } = useI18n()
const gym = computed(() => store.state.gym)
const walls = computed(() => store.state.walls || [])
const hasGymMap = computed(() => walls.value.some(w => w.shape_data && w.shape_data.length > 0))
const props = defineProps({
  f7router: Object,
})

const onAreaSelected = (area) => {
  // Navigate to problems with selected wall
  f7.views.main.router.navigate("/problems", {
    props: {
      areaSelected: area,
    },
  })
}
</script>
