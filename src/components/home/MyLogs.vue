<template>
  <div class="p-card">

    <div class="flex items-center justify-between mb-2">
      <div class="p-card__title mb-0">{{ t('mylogs.my_logs') }}</div>
      <a class="p-link text-sm" href="/archive">{{ t('mylogs.open_archive') }}</a>
    </div>

    <div class="mb-4">
      <div class="text-sm font-semibold mb-1" style="color: var(--p-text-secondary);">Hardest top10 climb scores per week</div>
      <div class="text-xs mb-2 p-text-muted">4000pts = 6a, 5000pts = 6b, 7000pts = 7a, 8000pts = 7b, 9000pts = 7c.</div>
      <Line
        :chart-data="progressData" chart-id="c_progress" :width="300" :height="150" />
    </div>

    <div class="flex items-start gap-4">
      <div class="flex flex-col items-center gap-3 flex-shrink-0">
        <div class="p-stat">
          <div class="p-stat__value">{{ getLatestSessionCount }}</div>
          <div class="p-stat__label">{{ t('mylogs.sessions') }}</div>
        </div>
        <div class="p-stat">
          <div class="p-stat__value">{{ getLatestProblemCount }}</div>
          <div class="p-stat__label">{{ t('mylogs.ascents') }}</div>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div>
          <Bar
            v-if="ascentsFound"
            ref="lastAscents"
            :chart-options="{plugins : { legend: { display: false } }}"
            :chart-data="data" chart-id="c1" :width="400" :height="200" />

          <div v-else class="text-center py-4">
            <span class="material-icons mb-1" style="font-size: 32px; color: var(--p-warning);">trending_flat</span>
            <div class="text-sm font-semibold" style="color: var(--p-warning);">No ascents to list</div>
          </div>
        </div>

        <!-- Last N days selector -->
        <div class="flex items-center justify-center gap-1 mt-2 text-sm" style="color: var(--p-text-muted);">
          Last
          <div class="p-dropdown">
            <span class="p-dropdown__trigger" @click="showDaysDropdown = !showDaysDropdown">{{ lastDays }}</span>
            <div v-if="showDaysDropdown" class="p-dropdown__menu">
              <button v-for="opt in dayOptions" :key="opt.value" class="p-dropdown__item" @click="lastDays = opt.value; showDaysDropdown = false">{{ opt.label }}</button>
            </div>
          </div>
          days
        </div>
      </div>
    </div>

    <!-- Boulder / Sport / All toggle -->
    <div v-if="showSelector" class="mt-4">
      <div class="p-toggle-group">
        <button
          class="p-toggle-group__btn"
          :class="{ 'p-toggle-group__btn--active': showOfType == 'boulder' }"
          @click="changeOfType('boulder')"
        >{{ t('mylogs.boulder') }}</button>
        <button
          class="p-toggle-group__btn"
          :class="{ 'p-toggle-group__btn--active': showOfType == 'sport' }"
          @click="changeOfType('sport')"
        >{{ t('mylogs.sport') }}</button>
        <button
          class="p-toggle-group__btn"
          :class="{ 'p-toggle-group__btn--active': showOfType == 'all' }"
          @click="changeOfType('all')"
        >{{ t('mylogs.all') }}</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { computed, ref } from 'vue'
import { getAscentsByGrade } from '@helpers/component.helpers.js'
import { Bar, Line } from 'vue-chartjs'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
import dayjs from 'dayjs'
import { calculatePoints } from '@/js/helpers'
import advancedFormat from  'dayjs/plugin/advancedFormat'
import weekOfYear  from 'dayjs/plugin/weekOfYear'
import customParseFormat  from 'dayjs/plugin/customParseFormat'
dayjs.extend(advancedFormat)
dayjs.extend(weekOfYear)
dayjs.extend(customParseFormat)

const store = useStore()
const props = defineProps({
  showSelector: {
    type: Boolean,
    default: false,
  },
})
const { t } = useI18n()
const grades = computed(() => store.state.grades)
const ticks = computed(() => store.state.alltime.ticks)
const tries = computed(() => store.state.alltime.tries)
const lastDays = ref(30)
const showOfType = ref('boulder')
const showDaysDropdown = ref(false)
const dayOptions = [
  { value: 1, label: 'today' },
  { value: 7, label: 'week' },
  { value: 14, label: 'two weeks' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: 'half a year' },
  { value: 360, label: 'year' },
]

const ascentsByGrade = computed(() => getAscentsByGrade(grades.value, ticks.value,lastDays.value,showOfType.value))
const ascentsFound = computed(() => ascentsByGrade.value.size > 0)
const labels = computed(() => Array.from(ascentsByGrade.value.keys()).map(
  (gradeId) => grades.value.find((grade) => grade.id == gradeId).name
))
const ascents = computed(() => Array.from(ascentsByGrade.value.values()))
const data = computed(() => ({
  labels : labels.value,
  datasets: [
    {
      data: ascents.value,
      label: t("amount"),
      backgroundColor: ["rgba(56, 189, 248, 0.4)"],
      borderColor: ["rgba(56, 189, 248, 0.6)"],
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
}));

// Find progession by week, take running 12 months into account

// Default deadline to a running year.
const weekDeadline = dayjs().subtract(1, 'year')
const progress = computed(() => {
  const filteredTicks = ticks.value.filter(tick => dayjs(tick.tstamp).isAfter(weekDeadline))
  const ticksByTimeGroup = filteredTicks.reduce((acc,item) => {
    // Find week
    const yearWeek = dayjs(item.tstamp).format("YYYY-ww")
      if (acc[yearWeek]==null) {
        acc[yearWeek] = []
      }
      acc[yearWeek].push(item)
    return acc
  },{})

  // Then calculate top10 from each week and find points
  const top10s = Object.keys(ticksByTimeGroup).reduce((acc,yearWeek) => {

    const ticks = ticksByTimeGroup[yearWeek]
    // Sort by hardes to easiest and take top10
    const top10 = ticks.sort((b,a) => a.gradeid - b.gradeid).slice(0,10)
    // Calculate top 10.
    const points = top10.reduce((acc,item) => {
       const grade = grades.value.find(x=>x.id ==item.gradeid)
       if (grade != null && grade.score != null) {
         acc += grade.score + calculatePoints(item.routetype, parseInt(item.tries))
       }
       return acc
    },0)
    acc.push({yearWeek, points})
    return acc
  },[])
  return top10s
})

//const sortedProgress = computed(() => progress.value.sort((b,a) => dayjs(a.yearWeek,'YYYY-ww').isAfter(dayjs(b.yearWeek,'YYYY-ww'))))
const sortedProgress = computed(() => progress.value.reverse())
const progressLabels = computed(() => sortedProgress.value.map(x => x.yearWeek))
const progressValues = computed(() => sortedProgress.value.map(x => x.points))
const progressData = computed(() => ({
  labels : progressLabels.value,
  datasets: [
    {
      data: progressValues.value,
      label: t("Score"),
      borderColor: "#38bdf8",
      backgroundColor: "rgba(56, 189, 248, 0.08)",
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointBackgroundColor: "#38bdf8",
    },
  ],
}));

const changeOfType = (type) => {
  showOfType.value = type
}
const getLatestProblemCount = computed(() => {
  const deadline = dayjs().subtract(lastDays.value, 'day')
  let problemCount = 0
  const validTicks = ticks.value.filter(tick => dayjs(tick.tstamp).isAfter(deadline))
  validTicks.forEach((tick) => {
    // Filter by route type
    if (tick.routetype == showOfType.value || showOfType.value == 'all') {
      const ts = dayjs(tick.tstamp).format('YYYY-MM-DD')
      problemCount++
    }
  })
  return problemCount
})
const getLatestSessionCount = computed(() => {
  // Sessions are defined as unique days (we don't count morning and evening session as two)
  // Easiest way is to use set, as it's unique in nature. So let's get to it.
  // Count ticks and tries to session count
  const deadline = dayjs().subtract(lastDays.value, 'day')
  let sessions = new Set()

  const validTicks = ticks.value.filter(tick => dayjs(tick.tstamp).isAfter(deadline))
  validTicks.forEach(tick => {
    if (tick.routetype == showOfType.value || showOfType.value == 'all') {
      const tickDate = dayjs(tick.tstamp).format('YYYY-MM-DD')
      sessions.add(tickDate)
    }
  })
  const validTries = tries.value.filter(tick => dayjs(tick.tstamp).isAfter(deadline))
  validTries.forEach(tick => {
    if (tick.routetype == showOfType.value || showOfType.value == 'all') {
      const tickDate = dayjs(tick.tstamp).format('YYYY-MM-DD')
      sessions.add(tickDate)
    }
  })
  return sessions.size
})
</script>
