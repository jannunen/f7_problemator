<template>
    <a href="#" @click.prevent="navigateToArchive" class="score-today__block">
        <div class="p-stat">
            <div class="p-stat__value">{{ scoreToday }}</div>
            <div class="p-stat__label">{{ t('home.score_today') }}</div>
        </div>
        <div class="score-today__sub">
            <span class="score-today__sub-value">{{ hardestClimb || '—' }}</span>
            <span class="p-stat__label">{{ t('home.hardest_climb') }}</span>
        </div>
    </a>
    <div class="score-today__block">
        <div class="p-stat">
            <div class="p-stat__value">{{ ticksTodayLength }}</div>
            <div class="p-stat__label">{{ t('home.ascents') }}</div>
        </div>
        <div class="score-today__sub">
            <span class="score-today__sub-value">{{ triesTodayLength }}</span>
            <span class="p-stat__label">{{ t('home.tries') }}</span>
        </div>
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
    if (ticks?.value == null) {
        return 0
    }
    const ticksToday = ticks.value
    const top10 = ticksToday.sort((b, a) => a.gradeid - b.gradeid).slice(0, 10)
    const points = top10.reduce((acc, item) => {
        const grade = grades.value.find(x => x.id == item.gradeid)
        if (grade != null && grade.score != null) {
            acc += grade.score + calculatePoints(item.routetype, parseInt(item.tries))
        }
        return acc
    }, 0)
    return points
})
const navigateToArchive = () => {
  f7.views.main.router.navigate({url : '/archive'  });

}

</script>
<style scoped>
.score-today__block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 5rem;
  padding: 0 1rem;
  text-decoration: none;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}
a.score-today__block {
  transition: opacity var(--p-duration) ease;
}
a.score-today__block:active {
  opacity: 0.7;
}
.score-today__sub {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.score-today__sub-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--p-accent);
  line-height: 1.2;
}
</style>