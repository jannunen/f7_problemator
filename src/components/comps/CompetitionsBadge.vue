<template>
  <div class="p-card">
    <div class="p-card__title">{{ t('comps.competitions') }}</div>
    <a href="/competitions/upcoming" class="p-nav-item">
      <span class="material-icons p-nav-item__icon">emoji_events</span>
      <span class="p-nav-item__label">{{ t('comps.upcoming_competitions') }}</span>
      <span v-if="upcomingCount > 0" class="comp-badge comp-badge--red">{{ upcomingCount }}</span>
    </a>
    <a href="/competitions/past" class="p-nav-item">
      <span class="material-icons p-nav-item__icon">history</span>
      <span class="p-nav-item__label">{{ t('comps.past_competitions') }}</span>
      <span v-if="pastCount > 0" class="comp-badge comp-badge--blue">{{ pastCount }}</span>
    </a>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import {  computed, ref } from 'vue'
const store = useStore()

const { t } = useI18n()
const comps = computed(() => store.state.upcomingcomps)
if (comps.value.loaded === false) {
  store.dispatch('getUpcomingCompetitions')
}
const upcomingCount = computed(() => comps.value.upcoming.length)
const pastCount = computed(() => comps.value.past.length)
</script>
<style scoped>
.comp-badge {
  font-size: 0.7rem;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}
.comp-badge--red {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}
.comp-badge--blue {
  background: rgba(56, 189, 248, 0.15);
  color: #7dd3fc;
}
</style>