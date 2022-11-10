<script setup>
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useStore } from 'vuex'
import { calculatePoints } from '@/js/helpers'

const { t } = useI18n()
const store = useStore()
const props = defineProps({
  profile: Object,
})
const emit = defineEmits(['addtick'])
const grades = computed(() => store.state.grades)
const allTicks = computed(() => store.state.alltime.ticks)
const allTries = computed(() => store.state.alltime.tries)
const ticks = computed(() => allTicks.value.filter(x => {
  return  dayjs(x.tstamp).isSame(dayjs(),'date')
}))
const tries = computed(() => allTries.value.filter(x => {
  return  dayjs(x.tstamp).isSame(dayjs(),'date')
}))

const ticksTodayLength = computed(() =>  ticks.value.length )
const triesTodayLength = computed(() => tries.value.length)
const hardestClimb = computed(() => {
  const best = ticks.value.sort((b, a) => a.gradeid - b.gradeid).slice(0, 10).find(x => x!= null)
  if (best != null) {
    const grade = grades.value.find(x => x.id == best.gradeid)
    if (grade != null && grade.name != null) {
      return grade.name
    }
  }
  return null
})
const scoreToday = computed(() => {
  const top10 = ticks.value.sort((b, a) => a.gradeid - b.gradeid).slice(0, 10)
  const points = top10.reduce((acc, item) => {
    const grade = grades.value.find(x => x.id == item.gradeid)
    if (grade != null && grade.score != null) {
      acc += calculatePoints(grade.score, parseInt(item.tries))
    }
    return acc
  }, 0)
  return points
})

</script>
<template>
  <div>
    <div class="my-2 text-center text-lg font-bold">{{ t('home.today') }}</div>
    <div class="flex flex-row justify-center mt-3">
      <div class="flex flex-col mx-4 text-center">
        <div class="text-5xl font-bold leading-8">{{ scoreToday }}<br /></div>
        <small class="mt-1 mb-2">{{ t('home.score_today') }}</small>
        <div class="text-xl text-center leading-3">{{ hardestClimb }}</div>
        <small>{{ t('home.hardest_climb') }}</small>
      </div>

      <div class="flex flex-col mx-4 text-center">
        <div class="text-5xl font-bold leading-8">{{ ticksTodayLength }}<br /></div>
        <small class="mt-1 mb-2">{{ t('home.ascents') }}</small>
        <div class="text-sm text-center leading-3">{{ triesTodayLength }}</div>
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
