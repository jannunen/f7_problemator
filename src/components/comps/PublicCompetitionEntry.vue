<template>
  <div v-if="comp != null">


    <f7-popup v-model:opened="showResultList">
      <f7-page>
        <f7-navbar title="Results">
          <f7-nav-right>
            <f7-link popup-close>Close</f7-link>
          </f7-nav-right>
        </f7-navbar>
        <f7-block v-if="compResults != null">
          <show-results :type="comp.tyyppi" :last-update="lastResultUpdate" :results="compResults.results" />
        </f7-block>
      </f7-page>

    </f7-popup>

    <f7-popup v-model:opened="showPointsPerRoute">
      <f7-page>
        <f7-navbar title="Points per problem">
          <f7-nav-right>
            <f7-link popup-close>Close</f7-link>
          </f7-nav-right>
        </f7-navbar>
        <f7-block>
          <points-per-route :last-update="lastUpdate" :points-per-route="comp.points_per_route" />
        </f7-block>
      </f7-page>
    </f7-popup>
    <div class="flex flex-row justify-between w-full">
      <div>{{ now }}</div>
      <div>ID: {{ comp.id  }}</div>
    </div>
    <div class="flex flex-row justify-between">
      <p-badge class="text-sm py-1 bg-blue-500">{{ comp.location ?? "Location not set"}}</p-badge>
      <p-badge class="text-sm py-1 bg-green-500">{{ t('comps.' + comp.tyyppi) }}</p-badge>
    </div>
    <div class="flex flex-row justify-between">
      <h1 class="p-0 m-0 text-2xl font-bold">{{ comp.name }}</h1>
    </div>
    <div class="flex flex-row justify-between">
      Competition venue opens at: {{ toLocalTime(comp.compdate) }}
      <small class="m-0">ID: {{ comp.id }}</small>
    </div>
    <h3 class=""> {{ t('comps.timespan') }} {{ toLocalTime(comp.timespan_start) }} - {{ toLocalTime(comp.timespan_end) }} </h3>
    <div class="my-1 flex flex-row justify-between">
      <h2 class="text-xl">
        <p-badge class="text-xl py-1 bg-blue-500">  {{ sortedProblems.length }}</p-badge>
        problem(s)
      </h2>
      <div class="text-xl">
      {{ t('comps.participants') }}
      <p-badge class="text-xl py-1 bg-blue-500">  {{ comp.paidregistrations?.length }}</p-badge>
      </div>
    </div>
    <div v-if="sortedProblems.length == 0" class="my-3 text-2xl">
      No problems have been added - yet.
    </div>
    <div v-if="isJudge">
      <f7-block-title>{{ t('comps.you_are_a_judge') }}</f7-block-title>
      <f7-link :href="getJudgingLink" class="btn-primary font-bold ">Open judging sheet</f7-link>

    </div>

    <div>

      <div v-if="compOngoing ">

        <div v-if="comp.tyyppi == 'variable_points'">
          <p-button class="bg-yellow-400 dark:bg-yellow-600" @click="showPointsPerRoute=!showPointsPerRoute">Toggle show points per route</p-button>
        </div>
        <p-button class="my-1 bg-teal-400 dark:bg-teal-600" @click="showResultList=!showResultList">Toggle show result list</p-button>
        <div class="text-center">
          <span class="dark:text-white text-black text-lg">{{ timeLeft }}</span>
        </div>
        <p class="text-center">Swipe left to delete an ascent</p>
        <f7-list class="m-0">
          <f7-list-item>
            <template #title>
              <span class="text-3xl font-bold">{{ tickCount }}</span> /<span class="text-lg">{{ sortedProblems.length }}</span>
              {{ t('comps.ticked') }}
            </template>
          </f7-list-item>

          <f7-list-item swipeout v-for="prob in sortedProblems" :key="prob.id">
            <f7-swipeout-actions right>
              <f7-swipeout-button color="red" close @click="() => onDeleted(prob.id)" confirm-text="Are you sure you want to delete this tick?">Delete</f7-swipeout-button>
            </f7-swipeout-actions>
            <template #media>
              <div class="w-16 flex flex-row justify-between">
                <div class="flex flex-col">
                  <div class="mr-1 font-bold text-xl">{{ prob.pivot.num }}</div>
                  <div class="mr-2 pt-0 text-sm font-bold">{{ right(prob?.tag,4) }}</div>
                </div>
                <div class="flex flex-col w-8">
                  <div class="h-6 mt-3 w-6 border border-white rounded-md" :style="getStyles(prob)"></div>
                </div>
              </div>
            </template>
            <template #title>
              <div v-if="comp.tyyppi == 'variable_points'">
                <f7-stepper fill :value="tries[prob.id]?.tries || 1" @stepper:change="(num) => setTries(prob.id, num)"></f7-stepper>
              </div>
              <div v-else-if="comp.tyyppi=='sport'">
                <input :value="tries[prob.id]?.sport_points" @change="(e) => onChangeSportPoints(prob.id, e)" class="border border-white h-12 w-24" :placeholder="t('Enter points')" type="text" />
              </div>
              <div v-else>
                Comp type not supported (yet)
              </div>
            </template>
            <template #after>
              <p-button @click="() => doTick(prob.id)" class="w-20 py-2 dark:bg-green-500 bg-green-600">tick</p-button>
              <span v-if="isTicked(prob.id)" class="w-5 text-red-400 font-bold text-2xl">✓</span>
              <span v-else class="w-5 text-white font-bold text-2xl">&nbsp;</span>
            </template>
          </f7-list-item>
        </f7-list>
      </div>
      <div v-else>
        <div class="text-center font-bold text-xl text-red-500 border-t-2 border-red-700 mt-2">
          {{ t('comps.the_comp_has_not_started_yet') }}
        </div>
      </div>
    </div><!-- if paid -->
    {{ errors }}
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { f7 } from 'framework7-vue'

import { onUnmounted,  computed, ref } from 'vue'
import PButton from '@components/PButton.vue'
import { right } from '@js/helpers'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import PBadge from '@components/PBadge.vue'
import PointsPerRoute from './PointsPerRoute.vue'
import ShowResults from './ShowResults.vue'
import { webendpoint } from '@js/api.js'

import {  toaster } from '@helpers/notifications.js'
import { toLocalTime } from '@helpers/component.helpers'
import { handleValidationErrors } from '@helpers'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(timezone)

const now = computed(() =>   dayjs().format("DD.MM.YYYY HH:mm") )

const props = defineProps({
  comp: Object,
})

const store = useStore()
const ticks = computed(() => store.state.alltime.ticks)
const isTicked = (pid) => {
  // check this against comp ticks
  const comp = store.state.competition
  if (comp == null) {
    return false
  }
  const tick = comp.userticks[pid]
  return tick != null
}
const errors = ref("")
const loaded = ref(false)
const showPointsPerRoute = ref(false)
const showResultList = ref(false)
dayjs.extend(duration)
dayjs.extend(isBetween)
const { t } = useI18n()
const compResults = computed(() => store.state.compResults)
const climber = computed(() => store.state.climber)

const isJudge = computed(() => {
  const comp = props.comp
  if (comp.judges == null) {
    return false
  }
  if (climber.value == null) {
    return false
  }
  const judgeids = comp.judges.map(jobj => jobj.id)
  return judgeids.includes(climber.value.id)
})
const openPaymentWindow = () => {
  const link = document.createElement("a")
  link.href = `${webendpoint}/comps/${props.comp.id}/contender/${climber.value.id}/payment`
  link.target = "_blank"
  link.click()
}
const onChangeSportPoints = (pid, e) => {
  if (tries.value[pid] == null) {
    tries.value[pid] = { tries: 0, sport_points: 0 }
  }
  tries.value[pid].sport_points = e.target.value
}
const tries = ref({})
const getJudgingLink = computed(() => {
  if (props.comp != null) {
    const url = `/competitions/${props.comp.id}/judging`
    return url
  }
})
const totalPrice = ref(0)
const isPaymentForced = computed(() => props.comp.forcepayment == 1)
const isPaidAndPriceIsSet = computed(() => {
  if (climber.value == null) {
    return false
  }
  // Now go through each row and check prices and payment statuses
  const rows = props.comp.categories.reduce((acc, cat) => {
    const finding = cat.participants.find(x => x.contenderid == climber.value.id)
    if (finding != null) {
      acc.push(finding)
    }
    return acc
  }, [])
  for (const rowKey in rows) {
    const row = rows[rowKey]
    const serie = props.comp.categories.find(x => x.id == row.serieid)
    const price = parseFloat(serie.pivot.price)
    totalPrice.value += price
    // IF there is a price, but no payment info, return false immediately
    if (!isNaN(price) && price > 0 && (row.paid == null || dayjs(row.paid).year() == 0)) {
      return false
    }
  }
  return true
})

const compOngoing = computed(() => {
  const nowUTC = dayjs().utc()

  return nowUTC.isBetween(
    dayjs.utc(props.comp.timespan_start),
    dayjs.utc(props.comp.timespan_end)
  )
})

// First, set the tries from the comp object.
tries.value = Object.keys(props.comp.userticks).reduce((acc, key) => {
  const aTick = props.comp.userticks[key]
  acc[aTick.problemid] = {
    tries: parseInt(aTick.tries),
    tries_bonus: parseInt(aTick.tries_bonus),
    ticked: true,
    sport_points: aTick.sport_points,
  }
  return acc
}, {})

const onDeleted = (id) => {
  const payload = {
    problemid: id,
    point_entry_key: climber.value.point_entry_key,
  }
  store
    .dispatch('publicDeleteTickByProblem', payload)
    .then((ret) => {
      toaster(t(ret.message))
    })
    .catch((err) => { })
}
const setTries = (id, triesAmount) => {
  if (!(id in tries.value)) {
    tries.value[id] = { tries: 0, sport_points: 0 }
  }
  const newTries = { ...tries.value[id], tries: triesAmount }
  tries.value[id] = newTries
}
const lastUpdate = ref(dayjs())
const lastResultUpdate = ref(dayjs())

let timerID = null

if (props.comp.tyyppi == 'variable_points') {
  const fetchPointsPerRoute = () => {
    // Update points per route
    const payload = { compid: props.comp.id, point_entry_key: climber.value.point_entry_key }
    store.dispatch('publicGetPointsPerRoute', payload)
      .then(() => {
        lastUpdate.value = dayjs()
      })
      .catch(err => {
        errors.value = handleValidationErrors(err)
      })

  }
  timerID = setInterval(fetchPointsPerRoute , 27 * 1000) // every 30 seconds
  fetchPointsPerRoute()
}

const fetchResults = () => {
  // Update points per route
  const payload = { compid: props.comp.id  , point_entry_key: climber.value.point_entry_key }
  store.dispatch('publicGetCompResults', payload)
    .then(() => {
      lastResultUpdate.value = dayjs()
      loaded.value = true
    })
      .catch(err => {
        //errors.value = handleValidationErrors(err)
      })
}
const resultTimerID = setInterval(fetchResults, 45 * 1000)
fetchResults()

onUnmounted(() => {
  // Stop udpates when page unloads
  if (timerID != null) {
    clearInterval(timerID)
  }
  clearInterval(resultTimerID)
})

setInterval(() => {
  // Update time left
  const dur = dayjs.duration(dayjs(props.comp.timespan_end).diff(dayjs()))
  timeLeft.value = dur.format('D[day(s)] HH[h] mm[m] ss[s]') + ' left'
}, 1000)
const timeLeft = ref(null)

const doTick = (id) => {

  let aTries = 1
  let aSportPoints = 0
  if (tries.value[id] != null) {
    aTries = tries.value[id].tries
    aSportPoints = tries.value[id].sport_points
  }

  const payload = {
    ticktype: 'tick',
    tries: aTries,
    created: new Date(),
    problemid: id,
    sport_points: aSportPoints,
    grade_opinion: null,
    point_entry_key: climber.value.point_entry_key,
  }
  store
    .dispatch('publicSaveTick', payload)
    .then((ret) => {
      tries.value[id] = { ...tries.value[id], ticked: true }
      toaster(t('comps.tick_saved'))
    })
    .catch((err) => { })
}
const getStyles = (prob) => {
  const htmlcolour = prob.colour.code
  const textcolor = prob.colour.textcolor
  return {
    'background-color': htmlcolour,
    color: textcolor,
  }
}
const tickCount = computed(() => {
  const comp = store.state.competition
  if (comp == null) {
    return 0
  }
  return Object.keys(comp.userticks).length
})
const sortedProblems = computed(() => {

  const probs = props.comp.problems.sort((a, b) => {
    const anum = parseInt(a.pivot.num)
    const bnum = parseInt(b.pivot.num)
    if (anum - bnum == 0) {
      return a.tag.localeCompare(b.tag)
    } else {
      return anum - bnum
    }
  })
  if (props.comp.tyyppi == 'sport') {
    // Add additional filtering, if there are route bindings...
    const compClimber = props.comp.paidregistrations.find(x => x.id == climber.value.id)
    return probs.filter(x => {
      if (x.pivot == null) {
        return true
      }
      return x.pivot.bind_to_category == compClimber.pivot.serieid
    })

  }
  return probs
})
</script>
