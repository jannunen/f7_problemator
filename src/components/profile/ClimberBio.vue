<template>
  
  <h1 class="pt-8 font-bold text-2xl bottom-0 text-center">
    {{ profile.etunimi }}
    {{ profile.sukunimi }}
  </h1>
  <p class="mx-auto w-4/5 px-10 italic">
    {{ profile.bio }}
  </p>
  <div class="absolute bottom-5 w-full">
    <div class="flex justify-between">
      <div class="py-2 px-4">
        <span class="font-bold text-2xl">{{
          profile.boulder_hardest?.name.toUpperCase()
        }}</span>
        <h2>Hardest boulder</h2>
        <span class="font-bold text-2xl">{{
          profile.sport_hardest?.name ?? 'None'
        }}</span>
        <h2>Hardest sport</h2>
      </div>

      <div class="p-2 text-center">
        <span class="font-bold text-2xl">{{ profile.total_ascents }}</span>
        <h2>Total ascents</h2>
      </div>

      <div class="p-2">
        <span class="font-bold text-2xl"
          >{{ estimateGrade(profile.boulder_top10_alltime, grades).toUpperCase() }}
        </span>
        <small class="px-1">({{ profile.boulder_top10_alltime }})</small>
        <h2>Top 10 alltime, boulder</h2>
        <span class="font-bold text-2xl">{{
          estimateGrade(profile.sport_top10_alltime, grades)
        }}</span>
        <small class="px-1">({{ profile.sport_top10_alltime }})</small>
        <h2>Top 10 alltime, sport</h2>
      </div>
    </div>
  </div>
</template>
<script setup>
import { estimateGrade } from '@/js/helpers'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { ref, computed } from 'vue'
import { f7 } from 'framework7-vue'
const { t } = useI18n()
const store = useStore()
const grades = computed(() => store.state.grades)
const props = defineProps({
  profile: Object,
})
</script>
