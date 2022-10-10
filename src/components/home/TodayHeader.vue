<script setup>
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useStore } from 'vuex'
const { t } = useI18n()
const store = useStore()
const props = defineProps({
  profile: Object,
})
const emit = defineEmits(['addtick'])
const problems = computed(() => store.state.gym.problems)
const ticks = computed(() => store.state.profile.alltime.ticks.filter(x => dayjs(x.tstamp).isSame(dayjs(),'date')))
const tries = computed(() => store.state.profile.alltime.tries.filter(x => dayjs(x.tstamp).isSame(dayjs(),'date')))

const ticksToday = computed(() =>  ticks.value.length )
const triesToday = computed(() => tries.value.length)

</script>
<template>
  <div>
    <div class="my-2 text-center text-lg font-bold">{{ t('home.today') }}</div>
    <div class="flex flex-row justify-center mt-3">
      <div class="flex flex-col mx-4 text-center">
        <div class="text-5xl font-bold leading-8">{{ ticksToday }}<br /></div>
        <small class="mb-2">{{ t('home.ascents') }}</small>
        <div class="text-sm text-center leading-3">{{ triesToday }}</div>
        <small>{{ t('home.tries') }}</small>
      </div>
      <div class="mt-2">
        <button
          @click="emit('addtick')"
          class="w-20 h-20 rounded-full bg-purple-800 p-2 text-white flex flex-col justify-center items-center font-bold"
        >
          <f7-icon material="add" color="white" size="26px"></f7-icon>
          <span class="uppercase">{{ t('home.add') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
