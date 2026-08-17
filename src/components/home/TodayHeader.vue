<script setup>
import ScoreToday from '@components/home/ScoreToday.vue'
import QrSearchSheet from '@components/ui/problem/QrSearchSheet.vue'
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
const { t } = useI18n()
const store = useStore()
const allTicks = computed(() => store.state.alltime?.ticks || [])
const ticksTodayLength = computed(() => allTicks.value.filter(x => dayjs(x.tstamp).isSame(dayjs(), 'date')).length)
const navigateToArchive = () => {
  f7.views.main.router.navigate({ url: '/archive' })
}

const props = defineProps({
  profile: Object,
})
const qrReaderOpened = ref(false)
const openQRReader = () => {
  qrReaderOpened.value = true
}
const emit = defineEmits(['addtick'])
</script>
<template>
  <div>
    <div class="p-section-title text-center">{{ t('home.today') }}</div>
    <div class="today-header">
      <score-today />

      <div class="today-actions">
        <button @click="emit('addtick')" class="today-action-btn today-action-btn--primary">
          <span class="material-icons today-action-icon">add</span>
          <span class="today-action-label">{{ t('home.add') }}</span>
        </button>
        <button @click="openQRReader" class="today-action-btn today-action-btn--secondary">
          <span class="material-icons today-action-icon today-action-icon--sm">qr_code_scanner</span>
          <span class="today-action-label">{{ t('home.qr') }}</span>
        </button>
      </div>

    </div>
    <div v-if="ticksTodayLength > 0" class="score-today__link-hint">
      <a href="#" @click.prevent="navigateToArchive" class="score-today__link">
        <span class="material-icons" style="font-size: 14px;">list</span>
        {{ t('home.view_todays_ticks', 'View today\'s ascents') }}
      </a>
    </div>
    <qr-search-sheet :opened="qrReaderOpened" @close="qrReaderOpened = false" />

  </div>
</template>
<style scoped>
.today-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.today-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.today-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  border-radius: 50%;
  border: 1px solid transparent;
  color: var(--p-text-secondary);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--p-duration) var(--p-ease);
  -webkit-tap-highlight-color: transparent;
}
.today-action-btn:active {
  transform: scale(0.93);
}
.today-action-btn--primary {
  width: 60px;
  height: 60px;
  background: rgba(var(--p-accent-rgb), 0.15);
  border-color: rgba(var(--p-accent-rgb), 0.3);
  color: var(--p-accent);
}
.today-action-btn--primary:hover {
  background: rgba(var(--p-accent-rgb), 0.22);
  box-shadow: 0 4px 16px rgba(var(--p-accent-rgb), 0.15);
}
.today-action-btn--secondary {
  width: 44px;
  height: 44px;
  background: rgba(var(--p-purple-rgb), 0.1);
  border-color: rgba(var(--p-purple-rgb), 0.25);
  color: var(--p-purple);
}
.today-action-btn--secondary:hover {
  background: rgba(var(--p-purple-rgb), 0.18);
}
.today-action-icon {
  font-size: 22px;
  line-height: 1;
}
.today-action-icon--sm {
  font-size: 18px;
}
.today-action-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.score-today__link-hint {
  width: 100%;
  text-align: center;
  margin-top: 0.5rem;
}
.score-today__link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--p-accent);
  text-decoration: none;
  opacity: 0.8;
  transition: opacity var(--p-duration) ease;
}
.score-today__link:active {
  opacity: 0.5;
}
</style>
