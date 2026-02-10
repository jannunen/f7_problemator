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
    <div class="my-2 text-center uppercase text-lg font-bold">{{ t('home.today') }}</div>
    <div class="flex flex-row justify-center mt-3">
      <score-today />

      <div class="flex flex-col gap-1 items-center">
        <button @click="emit('addtick')" class="w-12 h-12 rounded-full bg-purple-800 py-2 px-0 text-white flex flex-col justify-center items-center font-bold">
          <f7-icon material="add" color="white" size="16px"></f7-icon>
          <span class="uppercase">{{ t('home.add') }}</span>
        </button>
        <button @click="openQRReader" class="w-16 h-16 rounded-full bg-purple-800 py-1 px-0 text-white flex flex-col justify-center items-center font-bold">
          <f7-icon material="qr_code_scanner" color="white" size="20px"></f7-icon>
          <span class="uppercase text-2xs">{{ t('home.qr') }}</span>
        </button>
      </div>

    </div>
    <qr-search-sheet :opened="qrReaderOpened" @close="qrReaderOpened = false"  />

  </div>
</template>
