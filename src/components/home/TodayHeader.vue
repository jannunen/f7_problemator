<script setup>
import ScoreToday from '@components/home/ScoreToday.vue'
import QrSearchSheet from '@components/ui/problem/QrSearchSheet.vue'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
const { t } = useI18n()

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
</style>
