<template>
  <div class="mt-8 m-4 rounded-md raised shadow-lg p-4 border border-gray-800">

    <div class="font-bold text-lg" style="color: #3bb273">{{ t('mylogs.my_logs') }} <a class="text-blue-500 text-sm" href="/archive">{{ t('mylogs.open_archive') }}</a></div>

    <div class="grid grid-cols-4">
      <div>&nbsp;</div>
      <div class="col-span-4">
          <span class="font-bold">Hardest top10 climb scores per week</span>
          <br />
          <small>4000pts = 6a, 5000pts = 6b,  7000pts = 7a, 8000pts = 7b, 9000pts = 7c.  </small>
          <Bar 
            :chart-data="progressData" chart-id="c_progress" :width="300" :height="150" />
        </div>
    </div>

    <div class="grid grid-cols-3">
      <div class="flex flex-col items-end mr-3 gap-1">
        <div class="text-4xl">{{ getLatestSessionCount }}</div>
        <div>{{ t('mylogs.sessions') }}</div>
        <div class="text-4xl">{{ getLatestProblemCount }}</div>
        <div >{{ t('mylogs.ascents') }}</div>
      </div>
      <div class="flex flex-col justify-between col-span-2">
        <div>
          <Bar 
            v-if="ascentsFound"
            ref="lastAscents"
            :chart-options="{plugins : { legend: { display: false } }}"
            :chart-data="data" chart-id="c1" :width="400" :height="200" />
          
          <div v-else class="text-2xl font-bold text-center text-orange-400">No ascents to list</div>
        </div>

        <div class="flex flex-row gap-2 justify-center">
          Last
          <f7-link popover-open=".popover-lastdays">{{ lastDays }}</f7-link>
          days
        </div>
        <small class="text-center">Click day amount to change</small>
      </div>
      <div v-if="showSelector" class="flex flex-col col-span-3 my-2 items-center">
        <div class="flex flex-row justify-around my-1">
          <div>
            <f7-radio
              class="mx-1"
              :checked="showOfType == 'boulder'"
              name="showOfType"
              value="boulder"
              @change="() => changeOfType('boulder')"
            ></f7-radio>
            {{ t('mylogs.boulder') }}
          </div>
          <div>
            <f7-radio
              class="mx-1"
              :checked="showOfType == 'sport'"
              name="showOfType"
              value="sport"
              @change="() => changeOfType('sport')"
            ></f7-radio
            >{{ t('mylogs.sport') }}
          </div>
          <div>
            <f7-radio
              class="mx-1"
              :checked="showOfType == 'all'"
              name="showOfType"
              value="all"
              @change="() => changeOfType('all')"
            ></f7-radio
            >{{ t('mylogs.all') }}
          </div>
        </div>
      </div>
    </div>
    <f7-popover class="popover-lastdays">
      <f7-list>
        <f7-list-item @click="lastDays=1" link="#" popover-close title="today"></f7-list-item>
        <f7-list-item @click="lastDays=7" link="#" popover-close title="week"></f7-list-item>
        <f7-list-item @click="lastDays=14" link="#" popover-close title="two weeks"></f7-list-item>
        <f7-list-item @click="lastDays=30" link="#" popover-close title="30 days"></f7-list-item>
        <f7-list-item @click="lastDays=60" link="#" popover-close title="60 days"></f7-list-item>
        <f7-list-item @click="lastDays=90" link="#" popover-close title="90 days"></f7-list-item>
        <f7-list-item @click="lastDays=180" link="#" popover-close title="half a year"></f7-list-item>
        <f7-list-item @click="lastDays=360" link="#" popover-close title="year"></f7-list-item>
        <f7-list-input 
        type="text" 
        outline 
        label="Custom days"
        clear-button
        v-model:value="lastDays"></f7-list-input>
      </f7-list>
    </f7-popover>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { computed, ref } from 'vue'
import { getAscentsByGrade } from '@helpers/component.helpers.js'
import { Bar } from 'vue-chartjs'
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
      backgroundColor: ["#97B0C4"],
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
         acc += calculatePoints(grade.score, parseInt(item.tries))
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
      backgroundColor: ["#97B0C4"],
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
