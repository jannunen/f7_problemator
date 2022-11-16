<template>
    <a href="#" @click.prevent="navigateToArchive">
        <div class="flex flex-col mx-4 text-center">
            <div class="text-5xl font-bold leading-8">{{ scoreToday }}<br /></div>
            <small class="mt-1 mb-2">{{ t('home.score_today') }}</small>
            <div class="text-xl text-center leading-3">{{ hardestClimb }}</div>
            <small>{{ t('home.hardest_climb') }}</small>
        </div>
    </a>
    <div class="flex flex-col mx-4 text-center">
        <div class="text-5xl font-bold leading-8">{{ ticksTodayLength }}<br /></div>
        <small class="mt-1 mb-2">{{ t('home.ascents') }}</small>
        <div class="text-sm text-center leading-3">{{ triesTodayLength }}</div>
        <small>{{ t('home.tries') }}</small>
    </div>
</template>
<script setup>
import { f7  } from 'framework7-vue'
import { calculatePoints } from '@/js/helpers'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

const { t } = useI18n()
const store = useStore()
const grades = computed(() => store.state.grades)
const ticksTodayLength = computed(() => ticks.value.length)
const triesTodayLength = computed(() => tries.value.length)
const allTicks = computed(() => store.state.alltime.ticks)
const allTries = computed(() => store.state.alltime.tries)
const ticks = computed(() => allTicks.value.filter(x => {
  return  dayjs(x.tstamp).isSame(dayjs(),'date')
}))
const tries = computed(() => allTries.value.filter(x => {
  return  dayjs(x.tstamp).isSame(dayjs(),'date')
}))

const hardestClimb = computed(() => {
    const best = ticks.value.sort((b, a) => a.gradeid - b.gradeid).slice(0, 10).find(x => x != null)
    if (best != null) {
        const grade = grades.value.find(x => x.id == best.gradeid)
        if (grade != null && grade.name != null) {
            return grade.name
        }
    }
    return null
})
const scoreToday = computed(() => {
    if (grades.value == null) {
        return 0
    }
    const top10 = ticks?.value.sort((b, a) => a.gradeid - b.gradeid).slice(0, 10)
    const points = top10.reduce((acc, item) => {
        const grade = grades.value.find(x => x.id == item.gradeid)
        if (grade != null && grade.score != null) {
            acc += calculatePoints(item.routetype, parseInt(item.tries))
        }
        return acc
    }, 0)
    return points
})
const navigateToArchive = () => {
  f7.views.main.router.navigate({url : '/archive'  });

}

</script>