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
      <div class="text-center mt-2 text-sm p-text-muted">
        {{ t('home.start_by_clicking_a_wall_or') }}
        <a href="/problems" class="p-btn p-btn--primary p-btn--block mt-2">
          <span class="material-icons" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">format_list_bulleted</span>{{ t('home.show_problem_list') }}
        </a>
        <a v-if="hasGymMap" href="/gym-map" class="p-btn p-btn--block mt-2" style="background: rgba(var(--p-accent-rgb), 0.12); color: var(--p-accent); border: 1px solid rgba(var(--p-accent-rgb), 0.2); padding: 0.75rem 1rem; font-size: 1rem;">
          <span class="material-icons" style="font-size: 22px; vertical-align: middle; margin-right: 8px;">explore</span>{{ t('home.open_problem_map') }}
        </a>
      </div>
    </div>
    <div v-else class="text-center px-2 py-2 mx-2">
      <div v-if="!hasGymMap" class="mt-2 text-sm p-text-muted">{{ t('home.floor_map_missing') }}</div>
      <a v-if="hasGymMap" href="/gym-map" class="p-btn p-btn--block mt-3" style="background: rgba(var(--p-accent-rgb), 0.12); color: var(--p-accent); border: 1px solid rgba(var(--p-accent-rgb), 0.2); padding: 0.75rem 1rem; font-size: 1rem;">
        <span class="material-icons" style="font-size: 22px; vertical-align: middle; margin-right: 8px;">explore</span>{{ t('home.open_problem_map') }}
      </a>
      <a href="/problems" class="p-btn p-btn--primary p-btn--block mt-2">
        <span class="material-icons" style="font-size: 18px; vertical-align: middle; margin-right: 6px;">format_list_bulleted</span>{{ t('home.show_problem_list') }}
      </a>
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
