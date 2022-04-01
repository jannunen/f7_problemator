<template>
<div>
  <!-- Show floormaps -->
  <f7-block v-if="gym != null && gym.floormaps != null && gym.floormaps.length > 0" class="my-0">
    <h3 class="no-margin">
      {{ t('home.floor_maps') }}
      <small class="text-sm">{{ gym.floormaps?.length }} {{ t('home.maps') }}</small>
    </h3>
    <div class="m-1">
      {{ t('home.start_by_clicking_a_wall_or') }}
      <f7-link href="/problems" class="font-bold text-blue-700">{{
        t('home.show_all_problems')
      }}</f7-link>
    </div>
    <div v-for="floormap in gym.floormaps" :key="floormap.id">
      <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
    </div>
  </f7-block>
  <div else class="text-center">
      <div class="mt-2">{{ t('home.floor_map_missing') }}</div>
    <div class="font-bold text-white text-lg dark:bg-sky-700 bg-blue-500  py-3 mx-4 px-8 my-2" >
      <f7-link  href="/problems">{{ capitalize(t('home.show_all_problems')) }}</f7-link>
    </div>
  </div>
  </div>
</template>
<script setup>
import store from '@js/store.js'
import { useStore } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { capitalize } from '@helpers/filters.js'
const { t } = useI18n()
const gym = useStore('gym')
const props = defineProps({
  f7router: Object,
})

const onAreaSelected = (area) => {
  // Navigate to problems with selected wall
  f7router.navigate('/problems', {
    props: {
      areaSelected: area,
    },
  })
}
</script>
