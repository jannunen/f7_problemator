<template>
  <!-- Nothing at all when the gym has no spray walls: most gyms don't, and an
       empty section on Home is worse than no section. -->
  <div v-if="sprayWalls.length > 0" class="px-4 py-2">
    <h3 class="p-section-title text-center">
      {{ t('spraywall.title') }}
      <span class="p-text-muted text-xs">{{ sprayWalls.length }}</span>
    </h3>

    <p class="text-center text-xs p-text-dim mb-2">{{ t('spraywall.intro') }}</p>

    <!-- The list is always shown, even for a single wall. A gym has one to three
         of these, so the whole point is reaching one in a single tap. -->
    <a
      v-for="wall in sprayWalls"
      :key="wall.id"
      href="#"
      class="spray-wall-row"
      @click.prevent="openWall(wall)"
    >
      <span class="material-icons spray-wall-row__icon">grid_on</span>
      <span class="spray-wall-row__body">
        <span class="spray-wall-row__name">{{ wallName(wall) }}</span>
        <span class="spray-wall-row__meta">
          <template v-if="!wall.ready">{{ t('spraywall.not_ready') }}</template>
          <template v-else>
            {{ t('spraywall.problem_count', wall.problem_count) }}
            <template v-if="wall.moderated"> · {{ t('spraywall.moderated') }}</template>
          </template>
        </span>
      </span>
      <span class="material-icons spray-wall-row__chevron">chevron_right</span>
    </a>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { f7 } from 'framework7-vue'
import api from '@js/api'

const { t } = useI18n()
const store = useStore()

const gymid = computed(() => store.state.gymid)

// Keyed by gym so switching gyms refetches rather than showing the previous
// gym's walls, and disabled until a gym is actually chosen.
const { data: sprayWalls } = useQuery({
  queryKey: computed(() => ['spray-walls', gymid.value]),
  queryFn: () => api.getSprayWalls(gymid.value),
  enabled: computed(() => !!gymid.value),
  initialData: [],
})

const wallName = (wall) => {
  if (wall.walldesc) return wall.walldesc
  return wall.wallchar ? `${t('spraywall.wall')} ${wall.wallchar}` : t('spraywall.wall')
}

const openWall = (wall) => {
  f7.views.main.router.navigate(`/spray-wall/${wall.id}`, {
    props: { wallName: wallName(wall), ready: wall.ready },
  })
}
</script>

<style scoped>
.spray-wall-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  border-radius: 10px;
  background: rgba(var(--p-accent-rgb), 0.12);
  border: 1px solid rgba(var(--p-accent-rgb), 0.2);
  color: inherit;
  text-decoration: none;
}

.spray-wall-row__icon {
  font-size: 24px;
  color: var(--p-accent);
}

.spray-wall-row__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.spray-wall-row__name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spray-wall-row__meta {
  font-size: 0.75rem;
  opacity: 0.7;
}

.spray-wall-row__chevron {
  font-size: 20px;
  opacity: 0.5;
}
</style>
