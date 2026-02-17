<template>
  <div v-if="earnedBadges.length > 0" class="my-2">
    <h1 class="font-bold mx-1 text-2xl">Badges</h1>
    <div class="flex flex-wrap gap-2 px-2 mt-2">
      <div
        v-for="badge in earnedBadges"
        :key="badge.badge_id"
        class="flex flex-col items-center p-2 rounded-lg w-20 text-center"
        :style="{ backgroundColor: badge.color + '15' }"
      >
        <span
          v-if="badge.icon"
          class="material-icons mb-1"
          :style="{ color: badge.color, fontSize: '28px' }"
        >{{ badge.icon }}</span>
        <span class="text-xs font-semibold leading-tight">{{ badge.name }}</span>
        <span v-if="badge.tier" class="text-xs p-text-dim capitalize">{{ badge.tier }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'

const { data: badgeData } = useQuery({
  queryKey: ['badges'],
  queryFn: () => api.getBadges(),
})
const earnedBadges = computed(() => badgeData.value?.earned || [])
</script>
