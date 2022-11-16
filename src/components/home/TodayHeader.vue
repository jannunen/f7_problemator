<script setup>
import ScoreToday from '@components/home/ScoreToday.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
  profile: Object,
})
const emit = defineEmits(['addtick'])
</script>
<template>
  <div>
    <div class="my-2 text-center text-lg font-bold">{{ t('home.today') }}</div>
    <div class="flex flex-row justify-center mt-3">
      <score-today />
      <div class="mt-2">
          <button @click="emit('addtick')" class="w-20 h-20 rounded-full bg-purple-800 p-2 text-white flex flex-col justify-center items-center font-bold">
              <f7-icon material="add" color="white" size="26px"></f7-icon>
              <span class="uppercase">{{ t('home.add') }}</span>
          </button>
      </div>
    </div>

  </div>
</template>
