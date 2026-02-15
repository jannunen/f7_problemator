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
    <div class="p-section-title text-center" style="font-size: 0.85rem;">{{ t('home.today') }}</div>
    <div class="flex flex-row justify-center mt-3">
      <score-today />

      <div class="flex flex-col gap-2 items-center">
        <button @click="emit('addtick')" class="today-action-btn today-action-btn--add">
          <span class="material-icons" style="font-size: 18px;">add</span>
          <span class="today-action-label">{{ t('home.add') }}</span>
        </button>
        <button @click="openQRReader" class="today-action-btn today-action-btn--qr">
          <span class="material-icons" style="font-size: 22px;">qr_code_scanner</span>
          <span class="today-action-label">{{ t('home.qr') }}</span>
        </button>
      </div>

    </div>
    <qr-search-sheet :opened="qrReaderOpened" @close="qrReaderOpened = false"  />

  </div>
</template>
<style scoped>
.today-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(167, 139, 250, 0.3);
  background: rgba(167, 139, 250, 0.12);
  color: #e2e8f0;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-tap-highlight-color: transparent;
}
.today-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(167, 139, 250, 0.2);
}
.today-action-btn:active {
  transform: translateY(0);
}
.today-action-btn--add {
  width: 48px;
  height: 48px;
}
.today-action-btn--qr {
  width: 60px;
  height: 60px;
}
.today-action-label {
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
