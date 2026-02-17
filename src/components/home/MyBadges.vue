<template>
  <div v-if="earnedBadges.length > 0" class="px-4 mt-3">
    <h2 class="font-bold text-lg mb-2">Badges</h2>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="badge in recentBadges"
        :key="badge.badge_id"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
        :style="{ backgroundColor: badge.color + '22', color: badge.color, border: '1px solid ' + badge.color + '44' }"
      >
        <span v-if="badge.icon" class="material-icons" style="font-size: 16px;">{{ badge.icon }}</span>
        {{ badge.name }}
      </div>
    </div>
    <div v-if="earnedBadges.length > maxShow" class="mt-1 text-xs p-text-dim">
      + {{ earnedBadges.length - maxShow }} more
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'

const maxShow = 5

const { data: badgeData } = useQuery({
  queryKey: ['badges'],
  queryFn: () => api.getBadges(),
})

const earnedBadges = computed(() => badgeData.value?.earned || [])
const recentBadges = computed(() => earnedBadges.value.slice(0, maxShow))
</script>
